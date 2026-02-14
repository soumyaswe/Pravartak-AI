"""
Flask SocketIO backend server for AI Interviewer Avatar
Integrates GCP Text-to-Speech, Speech-to-Text, and Google Gemini API
"""

# Fix Windows console encoding for emojis
import sys
import io
import codecs

# On Windows, configure UTF-8 encoding for stdout/stderr to handle emojis
if sys.platform == 'win32':
    try:
        # Try to set UTF-8 encoding for stdout/stderr
        if hasattr(sys.stdout, 'buffer') and sys.stdout.encoding != 'utf-8':
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
        if hasattr(sys.stderr, 'buffer') and sys.stderr.encoding != 'utf-8':
            sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)
    except (AttributeError, ValueError, OSError):
        # If we can't set UTF-8, continue - Python will handle encoding errors with 'replace'
        pass

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
import json
import uuid
from datetime import datetime
import base64
import threading
from dotenv import load_dotenv, find_dotenv

# Load environment variables from the project root .env so the whole project uses a single env file.
# find_dotenv() will search parent directories for a .env file when this script is run from backend/.
env_path = find_dotenv(filename='.env')
if env_path:
    load_dotenv(env_path)
    print(f' Loaded .env from: {env_path}')
else:
    # Fallback to default behavior (will load .env in current working dir if present)
    load_dotenv()

# Set GOOGLE_APPLICATION_CREDENTIALS from .env if present (must be done before importing google.cloud)
if 'GOOGLE_APPLICATION_CREDENTIALS' in os.environ:
    creds_path = os.environ['GOOGLE_APPLICATION_CREDENTIALS']
    # Resolve relative paths from repo root
    if not os.path.isabs(creds_path):
        # If running from backend/, go up one level to repo root
        repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        creds_path = os.path.join(repo_root, creds_path)
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = creds_path
    
    if os.path.exists(creds_path):
        print(f' Using service account credentials: {creds_path}')
    else:
        print(f'️ WARNING: GOOGLE_APPLICATION_CREDENTIALS points to non-existent file: {creds_path}')
        print('   Speech/TTS clients may fail to initialize.')
else:
    print('️ WARNING: GOOGLE_APPLICATION_CREDENTIALS not set in environment variables')
    print('   Set it in .env or use Application Default Credentials (gcloud auth application-default login)')

# Now import Google Cloud clients (they will use the credentials we just set)
from google.cloud import texttospeech, speech
import vertexai
from vertexai.preview.generative_models import GenerativeModel

app = Flask(__name__)

# Enable CORS for React frontend (including production URLs)
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:8000", 
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "https://pravartak-backend--pravartak-15665.web.app",
    "https://pravartak-15665.web.app",
    "https://pravartak-15665.firebaseapp.com",
    # Firebase App Hosting domains
    "https://pravartak--pravartak-15665.asia-southeast1.hosted.app",
    "https://pravartak-ai--pravartak-15665.asia-southeast1.hosted.app",
    # Allow all Firebase and Cloud Run subdomains for development
    "*",  # Temporarily allow all origins for testing
]
# Add NEXT_PUBLIC_BASE_URL if available
if os.environ.get('NEXT_PUBLIC_BASE_URL'):
    allowed_origins.append(os.environ.get('NEXT_PUBLIC_BASE_URL'))
# Filter out empty strings
allowed_origins = [origin for origin in allowed_origins if origin]

CORS(app, resources={
    r"/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize SocketIO with CORS and extended timeouts for long audio processing
# For production (Cloud Run with gunicorn), use gevent instead of eventlet
production_mode = os.environ.get('PRODUCTION', '').lower() in ('1', 'true', 'yes')
async_mode = 'gevent' if production_mode else 'eventlet'

socketio = SocketIO(app, cors_allowed_origins=allowed_origins, async_mode=async_mode, 
   ping_timeout=600,  # Increase timeout to 600 seconds (10 minutes) for very long audio processing
   ping_interval=120,  # Send ping every 120 seconds to keep connection alive
   max_http_buffer_size=100 * 1024 * 1024  # 100MB buffer for very large audio data
)

# Initialize Google Cloud clients with error handling
tts_client = None
stt_client = None

try:
    print('🔊 Initializing Text-to-Speech client...')
    tts_client = texttospeech.TextToSpeechClient()
    print('✅ Text-to-Speech client initialized successfully')
except Exception as e:
    print(f'❌ ERROR: Failed to initialize Text-to-Speech client: {e}')
    print(f'   Error type: {type(e).__name__}')
    print('   This will prevent the interviewer from speaking!')
    print('   Please check:')
    print('   1. GOOGLE_APPLICATION_CREDENTIALS is set correctly')
    print('   2. Service account has Text-to-Speech API enabled')
    print('   3. Service account has proper permissions')
    import traceback
    traceback.print_exc()

try:
    print('🎤 Initializing Speech-to-Text client...')
    stt_client = speech.SpeechClient()
    print('✅ Speech-to-Text client initialized successfully')
except Exception as e:
    print(f'❌ ERROR: Failed to initialize Speech-to-Text client: {e}')
    print(f'   Error type: {type(e).__name__}')
    print('   This will prevent speech recognition!')
    import traceback
    traceback.print_exc()

# Initialize Vertex AI (uses service account - no API key needed!)
project_id = os.environ.get('GOOGLE_CLOUD_PROJECT_ID') or os.environ.get('GCP_PROJECT_ID')
location = os.environ.get('GOOGLE_CLOUD_REGION', 'us-central1')

if not project_id:
    print('⚠️ WARNING: GOOGLE_CLOUD_PROJECT_ID not set in environment variables')
    print('Please set GOOGLE_CLOUD_PROJECT_ID in your .env file')
else:
    try:
        vertexai.init(project=project_id, location=location)
        print(f'✅ Vertex AI initialized successfully (Project: {project_id}, Region: {location})')
    except Exception as e:
        print(f'❌ Error initializing Vertex AI: {e}')

# Use Gemini via Vertex AI (no API key needed!)
# Try multiple models with fallback (in order of preference)
# Note: gemini-1.5-flash is not available in this project - using 2.0 instead
gemini_model = None
model_names = [
    'gemini-2.0-flash',      # Gemini 2.0 stable (confirmed working)
    'gemini-2.0-flash-exp',  # Gemini 2.0 experimental (confirmed working as fallback)
]

for model_name in model_names:
    try:
        print(f'Attempting to load model: {model_name}...')
        gemini_model = GenerativeModel(model_name)
        print(f'✅ Successfully loaded {model_name} via Vertex AI')
        break
    except Exception as e:
        print(f'⚠️ Failed to load {model_name}: {str(e)}')
        continue

if gemini_model is None:
    print('❌ ERROR: Failed to load any Gemini model. AI responses will be disabled.')
    print('   Please check:')
    print('   1. GOOGLE_CLOUD_PROJECT_ID is set correctly')
    print('   2. Vertex AI API is enabled for your project')
    print('   3. Service account has proper permissions')
    print('   4. Model names are correct for your region')

# Directory to store generated audio files
AUDIO_DIR = 'audio_files'
os.makedirs(AUDIO_DIR, exist_ok=True)

# Store active chat sessions per socket connection
chat_sessions = {}
conversation_histories = {}

# Store active audio streaming sessions
audio_stream_buffers = {}
stt_stream_configs = {}

# Viseme mapping: Maps phonemes to facial blend shape indices
PHONEME_TO_VISEME_MAP = {
    # Silence
    'sil': 0, 'pau': 0,
    
    # Vowels
    'AA': 1, 'aa': 1, 'AE': 2, 'ae': 2, 'AH': 3, 'ah': 3,
    'AO': 4, 'ao': 4, 'AW': 5, 'aw': 5, 'AY': 6, 'ay': 6,
    'EH': 7, 'eh': 7, 'ER': 8, 'er': 8, 'EY': 9, 'ey': 9,
    'IH': 10, 'ih': 10, 'IY': 11, 'iy': 11, 'OW': 12, 'ow': 12,
    'OY': 13, 'oy': 13, 'UH': 14, 'uh': 14, 'UW': 15, 'uw': 15,
    
    # Consonants
    'B': 16, 'b': 16, 'CH': 17, 'ch': 17, 'D': 18, 'd': 18,
    'DH': 19, 'dh': 19, 'F': 20, 'f': 20, 'G': 21, 'g': 21,
    'HH': 22, 'hh': 22, 'JH': 17, 'jh': 17, 'K': 21, 'k': 21,
    'L': 23, 'l': 23, 'M': 16, 'm': 16, 'N': 18, 'n': 18,
    'NG': 21, 'ng': 21, 'P': 16, 'p': 16, 'R': 24, 'r': 24,
    'S': 25, 's': 25, 'SH': 17, 'sh': 17, 'T': 18, 't': 18,
    'TH': 26, 'th': 26, 'V': 20, 'v': 20, 'W': 15, 'w': 15,
    'Y': 11, 'y': 11, 'Z': 25, 'z': 25, 'ZH': 17, 'zh': 17,
}

BLEND_SHAPES = [
    'mouthClose', 'mouthFunnel', 'mouthPucker', 'mouthLeft', 'mouthRight',
    'mouthSmileLeft', 'mouthSmileRight', 'mouthFrownLeft', 'mouthFrownRight',
    'mouthDimpleLeft', 'mouthDimpleRight', 'mouthStretchLeft', 'mouthStretchRight',
    'mouthRollLower', 'mouthRollUpper', 'mouthShrugLower', 'mouthShrugUpper',
    'mouthPressLeft', 'mouthPressRight', 'mouthLowerDownLeft', 'mouthLowerDownRight',
    'mouthUpperUpLeft', 'mouthUpperUpRight', 'browDownLeft', 'browDownRight',
    'browInnerUp', 'browOuterUpLeft', 'browOuterUpRight', 'cheekPuff', 'cheekSquintLeft',
    'cheekSquintRight', 'noseSneerLeft', 'noseSneerRight', 'tongueOut', 'jawForward',
    'jawLeft', 'jawRight', 'jawOpen', 'eyeBlinkLeft', 'eyeBlinkRight',
    'eyeLookDownLeft', 'eyeLookDownRight', 'eyeLookInLeft', 'eyeLookInRight',
    'eyeLookOutLeft', 'eyeLookOutRight', 'eyeLookUpLeft', 'eyeLookUpRight',
    'eyeSquintLeft', 'eyeSquintRight', 'eyeWideLeft', 'eyeWideRight'
]


def phoneme_to_blend_shapes(phoneme, intensity=1.0):
    """Convert a phoneme to blend shape values"""
    blend_values = {shape: 0.0 for shape in BLEND_SHAPES}
    
    viseme_index = PHONEME_TO_VISEME_MAP.get(phoneme, 0)
    
    if viseme_index == 0:  # Silence/neutral - Perfect resting position
        # Neutral face: completely relaxed, lips together, jaw closed
        blend_values['mouthClose'] = 0.0  # Don't force close, let it rest naturally
        blend_values['jawOpen'] = 0.0  # Jaw completely closed
        # Keep everything else at 0 for natural resting face
    elif viseme_index in [1, 2, 3]:  # Open vowels
        blend_values['jawOpen'] = 0.6 * intensity
        blend_values['mouthFunnel'] = 0.3 * intensity
    elif viseme_index in [4, 12]:  # O sounds
        blend_values['jawOpen'] = 0.4 * intensity
        blend_values['mouthFunnel'] = 0.7 * intensity
        blend_values['mouthPucker'] = 0.5 * intensity
    elif viseme_index in [5, 6]:  # Diphthongs
        blend_values['jawOpen'] = 0.5 * intensity
        blend_values['mouthStretchLeft'] = 0.3 * intensity
        blend_values['mouthStretchRight'] = 0.3 * intensity
    elif viseme_index in [7, 9]:  # E sounds
        blend_values['jawOpen'] = 0.3 * intensity
        blend_values['mouthSmileLeft'] = 0.4 * intensity
        blend_values['mouthSmileRight'] = 0.4 * intensity
    elif viseme_index in [10, 11]:  # I sounds
        blend_values['jawOpen'] = 0.2 * intensity
        blend_values['mouthStretchLeft'] = 0.5 * intensity
        blend_values['mouthStretchRight'] = 0.5 * intensity
    elif viseme_index in [14, 15]:  # U sounds
        blend_values['mouthPucker'] = 0.7 * intensity
        blend_values['jawOpen'] = 0.2 * intensity
    elif viseme_index == 16:  # Bilabials
        blend_values['mouthClose'] = 0.9 * intensity
        blend_values['mouthPressLeft'] = 0.5 * intensity
        blend_values['mouthPressRight'] = 0.5 * intensity
    elif viseme_index == 17:  # Palatals
        blend_values['jawOpen'] = 0.2 * intensity
        blend_values['mouthFunnel'] = 0.4 * intensity
    elif viseme_index == 18:  # Alveolars
        blend_values['jawOpen'] = 0.3 * intensity
        blend_values['mouthRollUpper'] = 0.3 * intensity
    elif viseme_index == 19:  # Dental
        blend_values['jawOpen'] = 0.3 * intensity
        blend_values['tongueOut'] = 0.5 * intensity
    elif viseme_index == 20:  # Labiodentals
        blend_values['mouthRollLower'] = 0.6 * intensity
        blend_values['jawOpen'] = 0.2 * intensity
    elif viseme_index == 21:  # Velars
        blend_values['jawOpen'] = 0.4 * intensity
    elif viseme_index == 23:  # L
        blend_values['jawOpen'] = 0.3 * intensity
        blend_values['tongueOut'] = 0.3 * intensity
    elif viseme_index == 24:  # R
        blend_values['mouthFunnel'] = 0.4 * intensity
        blend_values['jawOpen'] = 0.3 * intensity
    elif viseme_index == 25:  # Sibilants
        blend_values['mouthStretchLeft'] = 0.3 * intensity
        blend_values['mouthStretchRight'] = 0.3 * intensity
        blend_values['jawOpen'] = 0.1 * intensity
    elif viseme_index == 26:  # TH
        blend_values['jawOpen'] = 0.2 * intensity
        blend_values['tongueOut'] = 0.4 * intensity
    
    return blend_values


def generate_blend_data_from_text(text, speaking_rate=1.0):
    """Generate blend shape animation data from text with natural timing"""
    import math
    
    words = text.split()
    word_count = max(len(words), 1)
    
    # Natural speaking: ~2 words per second, adjusted by rate
    words_per_second = 2.0 * speaking_rate
    duration = max(word_count / words_per_second, 0.5)
    
    fps = 60
    total_frames = int(duration * fps)
    blend_data = []
    
    # Simplified, slower phoneme cycle for natural speech
    phoneme_cycle = ['sil', 'AA', 'EH', 'OW', 'M', 'sil']
    cycle_length = len(phoneme_cycle)
    frames_per_phoneme = max(8, total_frames // (word_count * 3))  # Slower transitions
    
    for frame in range(total_frames):
        # Slow phoneme cycling
        phoneme_index = (frame // frames_per_phoneme) % cycle_length
        phoneme = phoneme_cycle[phoneme_index]
        
        # Very subtle intensity (0.2 to 0.5 range for natural look)
        phase = (frame % frames_per_phoneme) / frames_per_phoneme
        intensity = 0.3 + 0.2 * math.sin(phase * math.pi)
        
        blend_values = phoneme_to_blend_shapes(phoneme, intensity)
        
        # Reduce all values by 40% for more subtle movement
        for key in blend_values:
            blend_values[key] *= 0.6
        
        frame_data = {'blendshapes': blend_values}
        blend_data.append(frame_data)
    
    # Extended neutral closing (30 frames = 0.5 seconds)
    neutral_values = phoneme_to_blend_shapes('sil', 1.0)
    for _ in range(30):
        blend_data.append({'blendshapes': neutral_values})
    
    return blend_data


def generate_blend_data_from_actual_duration(text, duration):
    """Generate blend shape animation data from text with actual audio duration"""
    import math
    
    fps = 60
    total_frames = int(duration * fps)
    blend_data = []
    
    words = text.split()
    word_count = max(len(words), 1)
    
    # Simplified, slower phoneme cycle for natural speech
    phoneme_cycle = ['sil', 'AA', 'EH', 'OW', 'M', 'sil']
    cycle_length = len(phoneme_cycle)
    frames_per_phoneme = max(8, total_frames // (word_count * 3))  # Slower transitions
    
    for frame in range(total_frames):
        # Slow phoneme cycling
        phoneme_index = (frame // frames_per_phoneme) % cycle_length
        phoneme = phoneme_cycle[phoneme_index]
        
        # Very subtle intensity (0.2 to 0.5 range for natural look)
        phase = (frame % frames_per_phoneme) / frames_per_phoneme
        intensity = 0.3 + 0.2 * math.sin(phase * math.pi)
        
        blend_values = phoneme_to_blend_shapes(phoneme, intensity)
        
        # Reduce all values by 40% for more subtle movement
        for key in blend_values:
            blend_values[key] *= 0.6
        
        frame_data = {'blendshapes': blend_values}
        blend_data.append(frame_data)
    
    # Extended neutral closing (30 frames = 0.5 seconds)
    neutral_values = phoneme_to_blend_shapes('sil', 1.0)
    for _ in range(30):
        blend_data.append({'blendshapes': neutral_values})
    
    print(f' Generated {len(blend_data)} frames for {duration:.2f}s audio ({len(blend_data)/fps:.2f}s animation)')
    
    return blend_data


def generate_speech_and_animation(text):
    """Generate speech audio and blend shape data"""
    # Check if TTS client is initialized
    if tts_client is None:
        error_msg = 'Text-to-Speech client is not initialized. Cannot generate audio.'
        print(f'❌ {error_msg}')
        raise RuntimeError(error_msg)
    
    try:
        print(f'🎙️ Generating speech for: "{text[:50]}..."')
        # Configure TTS
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # Get speaking rate from environment or use default
        speaking_rate = float(os.environ.get('SPEAKING_RATE', '0.9'))  # Natural speaking speed
        
        voice = texttospeech.VoiceSelectionParams(
            language_code='en-US',
            name=os.environ.get('VOICE_NAME', 'en-US-Neural2-F'),
        )
        
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speaking_rate,  # Natural, clear speech
            pitch=float(os.environ.get('VOICE_PITCH', '0.0')),
        )
        
        # Synthesize speech
        print(f'📞 Calling TTS API with voice: {voice.name}...')
        response = tts_client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        if not response or not response.audio_content:
            error_msg = 'TTS API returned empty response'
            print(f'❌ {error_msg}')
            raise RuntimeError(error_msg)
        
        print(f'✅ TTS API returned {len(response.audio_content)} bytes of audio')
        
        # Save audio file
        filename = f'{uuid.uuid4()}.mp3'
        filepath = os.path.join(AUDIO_DIR, filename)
        
        with open(filepath, 'wb') as audio_file:
            audio_file.write(response.audio_content)
        
        print(f'💾 Saved audio file: {filepath} ({len(response.audio_content)} bytes)')
        
        # Get actual audio duration for perfect sync
        try:
            from mutagen.mp3 import MP3
            audio_file = MP3(filepath)
            actual_duration = audio_file.info.length
            print(f' Audio duration: {actual_duration:.2f}s for text: "{text[:50]}..."')
            
            # Generate blend data matching actual audio duration
            blend_data = generate_blend_data_from_actual_duration(text, actual_duration)
        except ImportError:
            print('️ mutagen not installed, using estimated duration')
            # Fallback to estimated duration
            blend_data = generate_blend_data_from_text(text, speaking_rate)
        except Exception as e:
            print(f'️ Could not get audio duration: {e}, using estimated')
            blend_data = generate_blend_data_from_text(text, speaking_rate)
        
        return blend_data, f'/audio/{filename}'
    
    except Exception as e:
        print(f' Error generating speech: {str(e)}')
        print(f' Error type: {type(e).__name__}')
        import traceback
        traceback.print_exc()
        raise


def get_ai_response(session_id, user_text):
    """Get AI interviewer response using Gemini"""
    try:
        print(f' Getting AI response for session: {session_id}')
        print(f' User text: "{user_text}"')
        
        # Check if chat session exists (it should have been created in start_interview)
        if session_id not in chat_sessions:
            print(f'️ No existing chat session for {session_id}, creating new one')
            chat_sessions[session_id] = gemini_model.start_chat()
            conversation_histories[session_id] = []
            
            # If no text provided, get initial greeting
            if not user_text or not user_text.strip():
                initial_prompt = """You are Alicia, a professional AI interviewer. Start with:
1. A warm greeting
2. Brief introduction of yourself
3. Ask the candidate to introduce themselves

Keep it to 2-3 sentences."""
                
                response = chat_sessions[session_id].send_message(initial_prompt)
                ai_response = response.text
                
                conversation_histories[session_id].append({
                    'role': 'interviewer',
                    'content': ai_response
                })
                
                print(f' Initial greeting: {ai_response}')
                return ai_response
        
        # Add user's response to history if not empty
        if user_text and user_text.strip():
            conversation_histories[session_id].append({
                'role': 'candidate',
                'content': user_text
            })
            
            # Generate follow-up question
            prompt = f"""The candidate just said: "{user_text}"

Based on their response, ask a relevant follow-up question or move to the next interview topic. 
Keep your response natural, conversational, and to 2-3 sentences maximum. 
Be encouraging and professional."""
        else:
            # If empty text, ask them to speak up
            prompt = "The candidate seems to have paused or you didn't hear them clearly. Politely ask them to repeat or elaborate on their answer. Keep it to 1-2 sentences."
        
        print(f' Sending prompt to Gemini...')
        response = chat_sessions[session_id].send_message(prompt)
        ai_response = response.text
        
        # Add AI's response to history
        conversation_histories[session_id].append({
            'role': 'interviewer',
            'content': ai_response
        })
        
        print(f' AI response: {ai_response}')
        return ai_response
    
    except Exception as e:
        error_msg = f'Error getting AI response: {str(e)}'
        print(f' {error_msg}')
        import traceback
        traceback.print_exc()
        return "I'm having trouble processing that. Could you please repeat your answer?"


def get_ai_response_streaming(session_id, user_text):
    """Get AI interviewer response using Gemini with streaming"""
    try:
        print(f' Getting AI response for session: {session_id}')
        print(f' User text: {user_text}')
        
        # Initialize chat session if it doesn't exist
        if session_id not in chat_sessions:
            print(f' Creating new chat session for: {session_id}')
            chat_sessions[session_id] = gemini_model.start_chat()
            conversation_histories[session_id] = []
            
            # Get initial greeting with streaming
            initial_prompt = "Start the interview with a warm, professional greeting and your first question about the candidate's background. Keep it to 2-3 sentences."
            print(f' Sending initial prompt to Gemini...')
            response_stream = chat_sessions[session_id].send_message(
                initial_prompt,
                stream=True
            )
            
            full_response = ""
            for chunk in response_stream:
                if chunk.text:
                    full_response += chunk.text
                    yield chunk.text
            
            conversation_histories[session_id].append({
                'role': 'interviewer',
                'content': full_response
            })
            print(f' Initial response complete: {full_response}')
            return
        
        # Add user's response to history
        conversation_histories[session_id].append({
            'role': 'candidate',
            'content': user_text
        })
        
        # Generate follow-up question with streaming
        prompt = f"""The candidate just said: "{user_text}"

Based on their response, ask a relevant follow-up question or move to the next topic. Keep your response to 1-3 sentences. Be natural and conversational."""
        
        print(f' Sending follow-up prompt to Gemini...')
        response_stream = chat_sessions[session_id].send_message(
            prompt,
            stream=True
        )
        
        full_response = ""
        for chunk in response_stream:
            if chunk.text:
                full_response += chunk.text
                yield chunk.text
        
        # Add AI's response to history
        conversation_histories[session_id].append({
            'role': 'interviewer',
            'content': full_response
        })
        print(f' Follow-up response complete: {full_response}')
    
    except Exception as e:
        error_msg = f'Error getting AI response: {str(e)}'
        print(f' {error_msg}')
        import traceback
        traceback.print_exc()
        yield "I'm having trouble processing that. Could you please repeat?"


# ==================== WebSocket Events ====================

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f' Client connected: {request.sid}')
    emit('connection_response', {'status': 'connected', 'session_id': request.sid})


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f' Client disconnected: {request.sid}')
    # Clean up chat session
    if request.sid in chat_sessions:
        del chat_sessions[request.sid]
    if request.sid in conversation_histories:
        del conversation_histories[request.sid]


@socketio.on('start_interview')
def handle_start_interview(data):
    """Initialize the interview with a greeting"""
    try:
        session_id = request.sid
        position = data.get('position', 'Software Engineer') if data else 'Software Engineer'
        print(f' Starting interview for session: {session_id}, position: {position}')
        
        # Check if Gemini model is initialized
        if gemini_model is None:
            error_msg = 'Gemini model is not initialized. Cannot generate AI responses.'
            print(f'❌ {error_msg}')
            emit('error', {'message': error_msg})
            return
        
        # Check if TTS client is initialized before attempting to generate speech
        if tts_client is None:
            error_msg = 'Text-to-Speech client is not initialized. Interviewer cannot speak. Check service account permissions and TTS API access.'
            print(f'❌ {error_msg}')
            emit('error', {'message': error_msg})
            return
        
        # Initialize the chat session with system instruction
        if session_id not in chat_sessions:
            chat_sessions[session_id] = gemini_model.start_chat()
            conversation_histories[session_id] = []
            
            # Create personalized greeting based on position
            initial_prompt = f"""You are Alicia, a professional AI interviewer. Start the interview with:
1. A warm, friendly greeting
2. Introduce yourself
3. Mention you'll be interviewing them for the {position} position
4. Ask them to introduce themselves briefly

Keep your greeting natural, warm and professional. Keep it to 2-3 sentences maximum."""
            
            print(f' Getting initial greeting for {position} position...')
            response = chat_sessions[session_id].send_message(initial_prompt)
            ai_greeting = response.text
            
            conversation_histories[session_id].append({
                'role': 'interviewer',
                'content': ai_greeting
            })
        else:
            ai_greeting = "Welcome back! Let's continue our interview. Please tell me about yourself."
        
        # Generate speech and animation
        print(f'🎤 Generating speech for greeting...')
        blend_data, audio_filename = generate_speech_and_animation(ai_greeting)
        
        # Send to client
        print(f'📤 Sending avatar_speaks event with audio: {audio_filename}')
        emit('avatar_speaks', {
            'blendData': blend_data,
            'filename': audio_filename,
            'transcript': ai_greeting
        })
        
        print(f'✅ AI says: {ai_greeting}')
    
    except Exception as e:
        error_msg = str(e)
        print(f'❌ Error starting interview: {error_msg}')
        print(f'   Error type: {type(e).__name__}')
        import traceback
        traceback.print_exc()
        
        # Send detailed error to client
        emit('error', {
            'message': f'Failed to start interview: {error_msg}',
            'type': type(e).__name__,
            'details': 'Check backend logs for full traceback'
        })


@socketio.on('audio_stream_start')
def handle_audio_stream_start():
    """Handle start of audio streaming"""
    session_id = request.sid
    print(f'️ Audio stream started for session: {session_id}')
    
    # Initialize buffer for this session
    audio_stream_buffers[session_id] = []
    
    emit('stream_ready', {'status': 'ready'})


@socketio.on('audio_stream_data')
def handle_audio_stream_data(data):
    """Handle incoming audio data chunks from client"""
    try:
        session_id = request.sid
        audio_chunk = data.get('audio', [])
        
        if not audio_chunk:
            print(f'️ Received empty audio chunk for session: {session_id}')
            return
        
        # Accumulate audio chunks in buffer
        if session_id not in audio_stream_buffers:
            audio_stream_buffers[session_id] = []
        
        chunk_size = len(audio_chunk)
        audio_stream_buffers[session_id].extend(audio_chunk)
        
        # Log progress every few chunks
        total_samples = len(audio_stream_buffers[session_id])
        if total_samples % 8000 == 0 and total_samples > 0:  # Log every 0.5 seconds
            print(f' Buffered {total_samples} samples ({total_samples/16000:.2f}s) for session: {session_id}')
        
        # Log first chunk to confirm receiving
        if total_samples == chunk_size:
            print(f' First audio chunk received: {chunk_size} samples for session: {session_id}')
        
    except Exception as e:
        print(f' Error processing audio chunk: {str(e)}')
        import traceback
        traceback.print_exc()


@socketio.on('audio_chunk')
def handle_audio_chunk(data):
    """Handle incoming audio chunk from client (legacy support)"""
    try:
        # This is a simplified version - in production, you'd accumulate chunks
        # and use streaming recognition with GCP Speech-to-Text
        pass
    except Exception as e:
        print(f'Error processing audio chunk: {str(e)}')


@socketio.on('audio_stream_end')
def handle_audio_stream_end(data=None):
    """Handle end of audio streaming and process the complete audio"""
    session_id = request.sid
    
    # Process audio in a background thread to prevent blocking and timeout
    def process_audio_async():
        try:
            print(f' Received audio_stream_end for session: {session_id}')
            
            # Get accumulated audio from buffer
            if session_id not in audio_stream_buffers or not audio_stream_buffers[session_id]:
                print(f'️ No audio data buffered for session: {session_id}')
                print(f'   Buffer exists: {session_id in audio_stream_buffers}')
                if session_id in audio_stream_buffers:
                    print(f'   Buffer length: {len(audio_stream_buffers[session_id])}')
                socketio.emit('transcription_result', {'transcript': '', 'confidence': 0}, room=session_id)
                socketio.emit('error', {'message': 'No audio data received. Please speak clearly and try again.'}, room=session_id)
                return
            
            print(f' Processing {len(audio_stream_buffers[session_id])} audio samples for session: {session_id}')
            
            # Convert PCM samples to bytes
            import struct
            
            # If audio is too short, inform user
            audio_samples = audio_stream_buffers[session_id]
            min_samples = 16000 * 0.2  # 0.2 seconds minimum (very lenient)
            
            if len(audio_samples) < min_samples:
                print(f'️ Audio too short: {len(audio_samples)} samples ({len(audio_samples)/16000:.2f}s) - minimum is {min_samples/16000:.2f}s')
                # Clear the buffer
                audio_stream_buffers[session_id] = []
                socketio.emit('transcription_result', {'transcript': '', 'confidence': 0}, room=session_id)
                socketio.emit('error', {'message': f'Recording too short ({len(audio_samples)/16000:.1f}s). Please hold the button longer and speak.'}, room=session_id)
                return
            
            # Check if audio has actual content (not just silence)
            import array
            audio_array = array.array('h', audio_samples)
            max_amplitude = max(abs(min(audio_array)), abs(max(audio_array)))
            print(f' Audio level check - Max amplitude: {max_amplitude} (threshold: 100)')
            
            if max_amplitude < 100:  # Very quiet or silence
                print(f'️ Audio too quiet - max amplitude: {max_amplitude}')
                audio_stream_buffers[session_id] = []
                socketio.emit('transcription_result', {'transcript': '', 'confidence': 0}, room=session_id)
                socketio.emit('error', {'message': 'Audio is too quiet. Please speak louder and closer to the microphone.'}, room=session_id)
                return
            
            audio_bytes = struct.pack(f'{len(audio_samples)}h', *audio_samples)
            
            # Clear the buffer
            audio_stream_buffers[session_id] = []
            
            # Configure Speech-to-Text for LINEAR16 PCM with longer audio support
            audio = speech.RecognitionAudio(content=audio_bytes)
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code='en-US',
                enable_automatic_punctuation=True,
                model='latest_long',  # Use latest_long model for better long audio support
                use_enhanced=True,
                profanity_filter=False,
                enable_word_confidence=True,
                enable_word_time_offsets=True,
                speech_contexts=[speech.SpeechContext(
                    phrases=["interview", "experience", "project", "technology", "software", "developer"]
                )]
            )
            
            # Transcribe audio with extended timeout
            print(f' Sending {len(audio_bytes)} bytes ({len(audio_samples)/16000:.2f}s) to Speech-to-Text API...')
            
            try:
                # For long audio, use recognize with proper timeout handling
                response = stt_client.recognize(config=config, audio=audio, timeout=300)  # 300 second (5 minute) timeout
            except Exception as stt_error:
                print(f' Speech-to-Text API error: {str(stt_error)}')
                import traceback
                traceback.print_exc()
                socketio.emit('error', {'message': 'Speech recognition failed. Please try again.'}, room=session_id)
                return
            
            if not response.results:
                print('️ No transcription results - audio may be silence or unclear')
                print(f'   Audio was {len(audio_samples)/16000:.2f}s long with max amplitude {max_amplitude}')
                socketio.emit('transcription_result', {'transcript': '', 'confidence': 0}, room=session_id)
                # Ask user to repeat - more specific feedback
                if max_amplitude < 500:
                    ai_response = "I can barely hear you. Please speak much louder and closer to your microphone."
                else:
                    ai_response = "I didn't quite catch that. Please speak more clearly and a bit slower."
                
                # Generate speech and animation for the clarification
                blend_data, audio_filename = generate_speech_and_animation(ai_response)
                socketio.emit('avatar_speaks', {
                    'blendData': blend_data,
                    'filename': audio_filename,
                    'transcript': ai_response
                }, room=session_id)
                return
            
            # Get the transcript
            transcript = response.results[0].alternatives[0].transcript
            confidence = response.results[0].alternatives[0].confidence if hasattr(response.results[0].alternatives[0], 'confidence') else 1.0
            
            print(f' Transcription: "{transcript}" (confidence: {confidence:.2%})')
            
            # Send transcription to client
            socketio.emit('transcription_result', {
                'transcript': transcript,
                'confidence': confidence
            }, room=session_id)
            
            # Process with AI only if transcript has meaningful content
            if not transcript.strip() or len(transcript.strip()) < 3:
                print(' Very short transcript - asking user to elaborate')
                ai_response = "I heard you, but could you elaborate a bit more on that?"
                
                blend_data, audio_filename = generate_speech_and_animation(ai_response)
                socketio.emit('avatar_speaks', {
                    'blendData': blend_data,
                    'filename': audio_filename,
                    'transcript': ai_response
                }, room=session_id)
                return
            
            # Get AI response based on user's answer
            print(f' Getting AI response for: "{transcript}"')
            ai_response = get_ai_response(session_id, transcript)
            
            # Generate speech and animation
            print(f'🎤 Generating speech for AI response...')
            blend_data, audio_filename = generate_speech_and_animation(ai_response)
            
            # Send complete response to client
            print(f'📤 Sending avatar_speaks event with audio: {audio_filename}')
            socketio.emit('avatar_speaks', {
                'blendData': blend_data,
                'filename': audio_filename,
                'transcript': ai_response
            }, room=session_id)
            
            print(f'✅ Complete AI response sent: {ai_response}')
        
        except Exception as e:
            print(f'❌ Error in process_audio_async: {str(e)}')
            print(f'   Error type: {type(e).__name__}')
            import traceback
            traceback.print_exc()
            error_msg = f'Error processing audio stream: {str(e)}'
            print(f' {error_msg}')
            import traceback
            traceback.print_exc()
            socketio.emit('error', {'message': 'Failed to process your audio. Please try again.'}, room=session_id)
            
            # Send a fallback response
            fallback_response = "I'm having some technical difficulties. Could you please try speaking again?"
            try:
                blend_data, audio_filename = generate_speech_and_animation(fallback_response)
                socketio.emit('avatar_speaks', {
                    'blendData': blend_data,
                    'filename': audio_filename,
                    'transcript': fallback_response
                }, room=session_id)
            except:
                pass
    
    # Start background processing with thread
    socketio.start_background_task(process_audio_async)


@socketio.on('text_message')
def handle_text_message(data):
    """Handle text-based input (fallback for testing without audio)"""
    try:
        session_id = request.sid
        user_text = data.get('text', '')
        
        if not user_text:
            return
        
        print(f' Text message from {session_id}: {user_text}')
        
        # Get AI response
        ai_response = get_ai_response(session_id, user_text)
        
        # Generate speech and animation
        print(f'🎤 Generating speech for text message response...')
        blend_data, audio_filename = generate_speech_and_animation(ai_response)
        
        # Send to client
        print(f'📤 Sending avatar_speaks event with audio: {audio_filename}')
        emit('avatar_speaks', {
            'blendData': blend_data,
            'filename': audio_filename,
            'transcript': ai_response
        })
        
        print(f'✅ AI responds: {ai_response}')
    
    except Exception as e:
        error_msg = str(e)
        print(f'❌ Error handling text message: {error_msg}')
        print(f'   Error type: {type(e).__name__}')
        import traceback
        traceback.print_exc()
        emit('error', {'message': f'Failed to process message: {error_msg}'})


# ==================== HTTP Routes ====================

@app.route('/audio/<filename>', methods=['GET'])
def serve_audio(filename):
    """Serve generated audio files"""
    try:
        filepath = os.path.join(AUDIO_DIR, filename)
        print(f'📁 Serving audio file: {filepath}')
        
        # Check if file exists
        if not os.path.exists(filepath):
            print(f'❌ Audio file not found: {filepath}')
            return jsonify({'error': f'Audio file not found: {filename}'}), 404
        
        # Log file size
        file_size = os.path.getsize(filepath)
        print(f'✅ Audio file found: {filename} ({file_size} bytes)')
        
        # Send file with proper CORS headers
        response = send_file(filepath, mimetype='audio/mpeg')
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET'
        return response
    except Exception as e:
        print(f'❌ Error serving audio file {filename}: {str(e)}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 404


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    status = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'active_sessions': len(chat_sessions),
        'tts_initialized': tts_client is not None,
        'stt_initialized': stt_client is not None,
        'gemini_initialized': gemini_model is not None
    }
    
    # Check if critical services are available
    if not tts_client:
        status['status'] = 'degraded'
        status['warnings'] = ['Text-to-Speech client not initialized - interviewer cannot speak']
    if not stt_client:
        if 'warnings' not in status:
            status['warnings'] = []
        status['warnings'].append('Speech-to-Text client not initialized - speech recognition disabled')
    if not gemini_model:
        if 'warnings' not in status:
            status['warnings'] = []
        status['warnings'].append('Gemini model not initialized - AI responses disabled')
    
    status_code = 200 if status['status'] == 'healthy' else 503
    return jsonify(status), status_code


@app.route('/talk', methods=['POST'])
def talk():
    """Legacy endpoint for backward compatibility"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        blend_data, audio_filename = generate_speech_and_animation(text)
        
        return jsonify({
            'blendData': blend_data,
            'filename': audio_filename
        })
    
    except Exception as e:
        print(f'Error: {str(e)}')
        return jsonify({'error': str(e)}), 500


# Print startup summary
print('\n' + '='*60)
print('🚀 AI Interviewer Backend Server - Startup Summary')
print('='*60)
print(f'✅ Text-to-Speech: {"Initialized" if tts_client else "❌ FAILED - Interviewer cannot speak!"}')
print(f'✅ Speech-to-Text: {"Initialized" if stt_client else "❌ FAILED - Speech recognition disabled!"}')
print(f'✅ Gemini Model: {"Initialized" if gemini_model else "❌ FAILED - AI responses disabled!"}')
print(f'✅ Audio Directory: {AUDIO_DIR} (exists: {os.path.exists(AUDIO_DIR)})')
if project_id:
    print(f'✅ Project ID: {project_id}')
else:
    print('⚠️  Project ID: Not set')
print('='*60)
print()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # Cloud Run requires binding to 0.0.0.0, not 127.0.0.1
    host = '0.0.0.0' if os.environ.get('PORT') else '127.0.0.1'
    
    print(f"""
     AI Interviewer Avatar Server Starting...
     Host: {host}
     Port: {port}
     AI Model: {"Gemini 1.5 Flash (via Vertex AI)" if gemini_model else "❌ NOT INITIALIZED"}
     Speech-to-Text: {"✅ Enabled" if stt_client else "❌ DISABLED"}
     Text-to-Speech: {"✅ Enabled" if tts_client else "❌ DISABLED - Interviewer cannot speak!"}
    """)
    
    if not tts_client:
        print('\n⚠️  WARNING: Text-to-Speech is not initialized!')
        print('   The interviewer will NOT be able to speak.')
        print('   Check your GOOGLE_APPLICATION_CREDENTIALS and service account permissions.\n')
    
    # Run with SocketIO
    socketio.run(
        app,
        host=host,
        port=port,
        debug=False,
        use_reloader=False
    )

