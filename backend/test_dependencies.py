"""
Simple test to verify backend can start
Run this to check if there are any import errors
"""

print("🧪 Testing backend dependencies...")
print()

try:
    print("1. Testing Flask...")
    from flask import Flask
    print("   ✅ Flask OK")
except ImportError as e:
    print(f"   ❌ Flask error: {e}")

try:
    print("2. Testing Flask-CORS...")
    from flask_cors import CORS
    print("   ✅ Flask-CORS OK")
except ImportError as e:
    print(f"   ❌ Flask-CORS error: {e}")

try:
    print("3. Testing Flask-SocketIO...")
    from flask_socketio import SocketIO
    print("   ✅ Flask-SocketIO OK")
except ImportError as e:
    print(f"   ❌ Flask-SocketIO error: {e}")

try:
    print("4. Testing eventlet...")
    import eventlet
    print("   ✅ eventlet OK")
except ImportError as e:
    print(f"   ❌ eventlet error: {e}")

try:
    print("5. Testing Google Cloud TTS...")
    from google.cloud import texttospeech
    print("   ✅ Google Cloud TTS OK")
except ImportError as e:
    print(f"   ❌ Google Cloud TTS error: {e}")

try:
    print("6. Testing Google Cloud STT...")
    from google.cloud import speech
    print("   ✅ Google Cloud STT OK")
except ImportError as e:
    print(f"   ❌ Google Cloud STT error: {e}")

try:
    print("7. Testing Vertex AI...")
    import vertexai
    print("   ✅ Vertex AI OK")
except ImportError as e:
    print(f"   ❌ Vertex AI error: {e}")

try:
    print("8. Testing python-dotenv...")
    from dotenv import load_dotenv
    print("   ✅ python-dotenv OK")
except ImportError as e:
    print(f"   ❌ python-dotenv error: {e}")

print()
print("=" * 50)

# Check environment setup
import os
print("\n📋 Environment Check:")
print()

if os.path.exists('.env'):
    print("✅ .env file exists")
else:
    print("❌ .env file missing")

if os.path.exists('gcp-credentials.json'):
    print("✅ gcp-credentials.json exists")
else:
    print("❌ gcp-credentials.json missing")

if os.path.exists('server_ai_interviewer.py'):
    print("✅ server_ai_interviewer.py exists")
else:
    print("❌ server_ai_interviewer.py missing")

print()
print("=" * 50)
print("\n✅ Dependency test complete!")
print("\nIf all checks passed, you can run:")
print("   python server_ai_interviewer.py")
