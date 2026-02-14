'use client';

import React, { Suspense, useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, Loader, Environment, useFBX, useAnimations, OrthographicCamera } from '@react-three/drei';
import { LineBasicMaterial, Vector2, MeshStandardMaterial, MeshPhysicalMaterial } from 'three';
import ReactAudioPlayer from 'react-audio-player';
import { io } from 'socket.io-client';
import { logError, getSafeErrorMessage } from '@/lib/error-handler';
import createAnimation from './converter';
import blinkData from './blendDataBlink.json';
import * as THREE from 'three';
import { SRGBColorSpace, LinearSRGBColorSpace } from 'three';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Video, Mic, MicOff, VideoOff, Phone, MessageSquare, X, Check, FileText } from 'lucide-react';

const _ = require('lodash');

// Use environment variable for backend URL (Cloud Run or local development)
// IMPORTANT: This env var is set at BUILD time from Secret Manager
const host = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000'
console.log('🔗 Backend URL:', host); // Debug log to verify URL

function Avatar({ avatar_url, speak, setSpeak, text, setAudioSource, playing, blendData: externalBlendData }) {

  let gltf = useGLTF(avatar_url);
  let morphTargetDictionaryBody = null;
  let morphTargetDictionaryLowerTeeth = null;

  const [ 
    bodyTexture, 
    eyesTexture, 
    teethTexture, 
    bodySpecularTexture, 
    bodyRoughnessTexture, 
    bodyNormalTexture,
    teethNormalTexture,
    hairTexture,
    tshirtDiffuseTexture,
    tshirtNormalTexture,
    tshirtRoughnessTexture,
    hairAlphaTexture,
    hairNormalTexture,
    hairRoughnessTexture,
  ] = useTexture([
    "/images/body.webp",
    "/images/eyes.webp",
    "/images/teeth_diffuse.webp",
    "/images/body_specular.webp",
    "/images/body_roughness.webp",
    "/images/body_normal.webp",
    "/images/teeth_normal.webp",
    "/images/h_color.webp",
    "/images/tshirt_diffuse.webp",
    "/images/tshirt_normal.webp",
    "/images/tshirt_roughness.webp",
    "/images/h_alpha.webp",
    "/images/h_normal.webp",
    "/images/h_roughness.webp",
  ]);

  _.each([
    bodyTexture, 
    eyesTexture, 
    teethTexture, 
    teethNormalTexture, 
    bodySpecularTexture, 
    bodyRoughnessTexture, 
    bodyNormalTexture, 
    tshirtDiffuseTexture, 
    tshirtNormalTexture, 
    tshirtRoughnessTexture,
    hairAlphaTexture,
    hairNormalTexture,
    hairRoughnessTexture
  ], t => {
    t.colorSpace = SRGBColorSpace;
    t.flipY = false;
  });

  bodyNormalTexture.colorSpace = LinearSRGBColorSpace;
  tshirtNormalTexture.colorSpace = LinearSRGBColorSpace;
  teethNormalTexture.colorSpace = LinearSRGBColorSpace;
  hairNormalTexture.colorSpace = LinearSRGBColorSpace;

  gltf.scene.traverse(node => {
    if(node.type === 'Mesh' || node.type === 'LineSegments' || node.type === 'SkinnedMesh') {
      node.castShadow = true;
      node.receiveShadow = true;
      node.frustumCulled = false;
    
      if (node.name.includes("Body")) {
        node.castShadow = true;
        node.receiveShadow = true;
        node.material = new MeshPhysicalMaterial();
        node.material.map = bodyTexture;
        node.material.roughness = 1.7;
        node.material.roughnessMap = bodyRoughnessTexture;
        node.material.normalMap = bodyNormalTexture;
        node.material.normalScale = new Vector2(0.6, 0.6);
        morphTargetDictionaryBody = node.morphTargetDictionary;
        node.material.envMapIntensity = 0.8;
      }

      if (node.name.includes("Eyes")) {
        node.material = new MeshStandardMaterial();
        node.material.map = eyesTexture;
        node.material.roughness = 0.1;
        node.material.envMapIntensity = 0.5;
      }

      if (node.name.includes("Brows")) {
        node.material = new LineBasicMaterial({color: 0x000000});
        node.material.linewidth = 1;
        node.material.opacity = 0.5;
        node.material.transparent = true;
        node.visible = false;
      }

      if (node.name.includes("Teeth")) {
        node.receiveShadow = true;
        node.castShadow = true;
        node.material = new MeshStandardMaterial();
        node.material.roughness = 0.1;
        node.material.map = teethTexture;
        node.material.normalMap = teethNormalTexture;
        node.material.envMapIntensity = 0.7;
      }

      if (node.name.includes("Hair")) {
        node.material = new MeshStandardMaterial();
        node.material.map = hairTexture;
        node.material.alphaMap = hairAlphaTexture;
        node.material.normalMap = hairNormalTexture;
        node.material.roughnessMap = hairRoughnessTexture;
        node.material.transparent = true;
        node.material.depthWrite = false;
        node.material.side = 2;
        node.material.color.setHex(0x000000);
        node.material.envMapIntensity = 0.3;
      }

      if (node.name.includes("TSHIRT")) {
        node.material = new MeshStandardMaterial();
        node.material.map = tshirtDiffuseTexture;
        node.material.roughnessMap = tshirtRoughnessTexture;
        node.material.normalMap = tshirtNormalTexture;
        node.material.color.setHex(0xffffff);
        node.material.envMapIntensity = 0.5;
      }

      if (node.name.includes("TeethLower")) {
        morphTargetDictionaryLowerTeeth = node.morphTargetDictionary;
      }
    }
  });

  const [clips, setClips] = useState([]);
  const mixer = useMemo(() => new THREE.AnimationMixer(gltf.scene), [gltf.scene]);
  const activeActionsRef = useRef([]);

  // Handle external blend data from WebSocket
  useEffect(() => {
    if (!externalBlendData || !morphTargetDictionaryBody || !morphTargetDictionaryLowerTeeth) {
      return;
    }

    console.log('🎭 Creating animation from WebSocket blend data');

    let newClips = [ 
      createAnimation(externalBlendData, morphTargetDictionaryBody, 'HG_Body'), 
      createAnimation(externalBlendData, morphTargetDictionaryLowerTeeth, 'HG_TeethLower')
    ];

    setClips(newClips);

  }, [externalBlendData, morphTargetDictionaryBody, morphTargetDictionaryLowerTeeth]);

  // Load idle animation
  let idleFbx = useFBX('/idle.fbx');
  let { clips: idleClips } = useAnimations(idleFbx.animations);

  idleClips[0].tracks = _.filter(idleClips[0].tracks, track => {
    return track.name.includes("Head") || track.name.includes("Neck") || track.name.includes("Spine2");
  });

  idleClips[0].tracks = _.map(idleClips[0].tracks, track => {
    if (track.name.includes("Head")) {
      track.name = "head.quaternion";
    }
    if (track.name.includes("Neck")) {
      track.name = "neck.quaternion";
    }
    if (track.name.includes("Spine")) {
      track.name = "spine2.quaternion";
    }
    return track;
  });

  useEffect(() => {
    let idleClipAction = mixer.clipAction(idleClips[0]);
    idleClipAction.play();

    let blinkClip = createAnimation(blinkData, morphTargetDictionaryBody, 'HG_Body');
    let blinkAction = mixer.clipAction(blinkClip);
    
    console.log('🎭 Blink Animation Setup:', {
      duration: blinkClip.duration,
      tracks: blinkClip.tracks.length,
      morphTargets: Object.keys(morphTargetDictionaryBody || {}).length
    });
    
    blinkAction.play();
    
    // Set loop mode for blinking animation
    blinkAction.setLoop(THREE.LoopRepeat);
    blinkAction.clampWhenFinished = false;
    
    console.log('👁️ Blink action started - Loop:', blinkAction.loop);
    
  }, []);

  // Play animation clips when available
  useEffect(() => {
    if (playing === false) {
      // Stop all active animations when not playing
      activeActionsRef.current.forEach(action => {
        action.stop();
      });
      activeActionsRef.current = [];
      
      // Reset to perfect neutral position (all morph targets to 0)
      if (morphTargetDictionaryBody) {
        gltf.scene.traverse(node => {
          if (node.morphTargetInfluences && node.name.includes("Body")) {
            // Reset ALL morph targets to 0 for natural resting face
            Object.keys(morphTargetDictionaryBody).forEach(key => {
              const index = morphTargetDictionaryBody[key];
              node.morphTargetInfluences[index] = 0.0;  // Complete neutral position
            });
          }
        });
      }
      
      // Also reset lower teeth
      if (morphTargetDictionaryLowerTeeth) {
        gltf.scene.traverse(node => {
          if (node.morphTargetInfluences && node.name.includes("TeethLower")) {
            Object.keys(morphTargetDictionaryLowerTeeth).forEach(key => {
              const index = morphTargetDictionaryLowerTeeth[key];
              node.morphTargetInfluences[index] = 0.0;
            });
          }
        });
      }
      return;
    }
    
    console.log('🗣️ Playing speech animation clips:', clips.length);
    
    // Clear previous actions
    activeActionsRef.current.forEach(action => {
      action.stop();
    });
    activeActionsRef.current = [];
    
    _.each(clips, clip => {
      let clipAction = mixer.clipAction(clip);
      clipAction.setLoop(THREE.LoopOnce);
      clipAction.clampWhenFinished = true;  // Hold last frame
      clipAction.play();
      activeActionsRef.current.push(clipAction);
      console.log('▶️ Clip playing - duration:', clip.duration);
    });

  }, [playing, clips, morphTargetDictionaryBody, morphTargetDictionaryLowerTeeth, gltf.scene, mixer]);

  useFrame((state, delta) => {
    mixer.update(delta);
  });

  return (
    <group name="avatar">
      <primitive object={gltf.scene} dispose={null} />
    </group>
  );
}

const STYLES = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#000'
  },
  videoContainer: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  video: {
    width: '240px',
    height: '180px',
    border: '3px solid hsl(var(--primary))',
    borderRadius: '12px',
    objectFit: 'cover',
    boxShadow: '0 4px 20px rgba(var(--primary-rgb), 0.3)'
  },
  controlPanel: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    zIndex: 100,
    background: 'rgba(0, 0, 0, 0.85)',
    padding: '20px',
    borderRadius: '12px',
    minWidth: '320px',
    maxWidth: '400px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  status: {
    color: 'hsl(var(--primary))',
    fontSize: '0.9em',
    marginBottom: '15px',
    padding: '8px 12px',
    background: 'rgba(139, 92, 246, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(139, 92, 246, 0.3)'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    flexWrap: 'wrap'
  },
  button: {
    padding: '12px 24px',
    background: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.95em',
    transition: 'all 0.3s ease',
    flex: 1,
    minWidth: '120px'
  },
  buttonDisabled: {
    padding: '12px 24px',
    background: 'hsl(var(--muted))',
    color: 'hsl(var(--muted-foreground))',
    border: 'none',
    borderRadius: '8px',
    cursor: 'not-allowed',
    fontWeight: 'bold',
    fontSize: '0.95em',
    flex: 1,
    minWidth: '120px'
  },
  buttonRecording: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, hsl(var(--destructive)), hsl(var(--destructive) / 0.8))',
    color: 'hsl(var(--destructive-foreground))',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.95em',
    animation: 'pulse 1.5s infinite',
    flex: 1,
    minWidth: '120px'
  },
  transcript: {
    marginTop: '15px',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxHeight: '120px',
    overflowY: 'auto'
  },
  transcriptLabel: {
    color: 'hsl(var(--primary))',
    fontSize: '0.8em',
    marginBottom: '8px',
    fontWeight: 'bold'
  },
  transcriptText: {
    color: '#fff',
    fontSize: '0.9em',
    lineHeight: '1.5'
  },
  header: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    zIndex: 100,
    color: '#fff'
  },
  title: {
    fontSize: '1.5em',
    fontWeight: 'bold',
    margin: 0,
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
  },
  subtitle: {
    fontSize: '0.9em',
    color: '#00ff88',
    margin: '5px 0 0 0'
  }
};

function AppInterviewer() {
  const audioPlayer = useRef();
  const videoRef = useRef();
  const mediaRecorderRef = useRef();
  const audioChunksRef = useRef([]);
  const transcriptScrollRef = useRef(null);

  // UI State
  const [uiState, setUiState] = useState('lobby'); // 'lobby' | 'interview'
  const [selectedPosition, setSelectedPosition] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  
  const [connected, setConnected] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioSource, setAudioSource] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioMuted, setAudioMuted] = useState(false);
  
  // Initialize with neutral blend data (completely neutral - all zeros)
  const neutralBlendData = useMemo(() => {
    const blendShapes = [
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
    ];
    
    // Perfect neutral frame: all values at 0 for natural resting face
    const neutralFrame = blendShapes.reduce((acc, shape) => {
      acc[shape] = 0.0;  // All at zero for natural resting position
      return acc;
    }, {});
    
    return [{ time: 0, blendshapes: neutralFrame }];
  }, []);
  
  const [blendData, setBlendData] = useState(neutralBlendData);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [mediaStream, setMediaStream] = useState(null);

  // Use ref to store socket instance per component (prevents conflicts when multiple instances mount)
  const socketRef = useRef(null);
  
  // Use ref to store media stream so cleanup can access it even if component unmounts before async completes
  const mediaStreamRef = useRef(null);
  
  // Auto-scroll transcript to bottom when new messages arrive
  useEffect(() => {
    if (transcriptScrollRef.current && conversationHistory.length > 0) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        if (transcriptScrollRef.current) {
          transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [conversationHistory]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Create socket instance for this component instance
    socketRef.current = io(host, {
      transports: ['websocket', 'polling'], // Include polling fallback for Cloud Run compatibility
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000, // 20 second timeout
      forceNew: true // Force new connection to avoid reusing stale connections
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      // Log which transport is being used (helpful for debugging Cloud Run issues)
      const transport = socket.io.engine?.transport?.name || 'unknown';
      console.log(`✅ Connected to server (transport: ${transport})`);
      setConnected(true);
      setStatusMessage('Connected - Ready to start');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
      setStatusMessage('Disconnected from server');
    });

    socket.on('connection_response', (data) => {
      console.log('Connection response:', data);
    });

    socket.on('connect_error', (error) => {
      // Cloud Run doesn't support WebSocket transport, so this error is expected
      // Socket.IO will automatically fall back to polling transport
      // Only log if we're not already connected or if it's not a WebSocket error
      if (socket.connected) {
        // Already connected via polling, ignore WebSocket errors
        return;
      }
      
      // Log for debugging, but don't show to user immediately (polling might still work)
      const errorMessage = (error && error.message) ? error.message : 'Connection failed';
      
      // Check if this is a WebSocket error (common on Cloud Run)
      const isWebSocketError = errorMessage.includes('websocket') || errorMessage.includes('WebSocket');
      
      if (isWebSocketError) {
        // Expected for Cloud Run - polling will be used instead
        console.log('⚠️ WebSocket transport failed (expected on Cloud Run), falling back to polling...');
      } else {
        // Real connection error
        console.error('❌ Socket.IO connection error:', error);
        setStatusMessage(`Connection error: ${errorMessage}. Check backend URL: ${host}`);
        setConnected(false);
      }
    });

    socket.on('avatar_speaks', (data) => {
      console.log('🎤 Avatar speaking - BlendData frames:', data.blendData?.length || 0);
      console.log('📁 Audio file:', data.filename);
      console.log('💬 Transcript:', data.transcript);
      
      setBlendData(data.blendData);
      
      // Construct full audio URL
      const audioUrl = host + data.filename;
      console.log('🔊 Setting audio source:', audioUrl);
      setAudioSource(audioUrl);
      
      setAiTranscript(data.transcript || '');
      setStatusMessage('AI Interviewer is speaking...');
      
      // Add to conversation history
      if (data.transcript) {
        setConversationHistory(prev => [...prev, { role: 'ai', text: data.transcript }]);
      }
    });

    // Handle streaming chunks from AI
    socket.on('avatar_speaks_chunk', (data) => {
      console.log('🗣️ Avatar chunk:', data.text_chunk);
      
      // Append to current blend data for continuous animation
      if (data.blendData) {
        setBlendData(prevData => {
          if (!prevData) return data.blendData;
          // Merge animations for smooth streaming
          return [...prevData, ...data.blendData];
        });
      }
      
      // Queue audio for playback
      if (data.filename) {
        setAudioSource(host + data.filename);
      }
      
      // Append text chunk to transcript
      setAiTranscript(prev => prev + data.text_chunk);
      setStatusMessage('AI is streaming response...');
    });

    // Handle complete response
    socket.on('avatar_speaks_complete', (data) => {
      console.log('✅ AI complete:', data.transcript);
      setAiTranscript(data.transcript);
      setStatusMessage('Your turn to speak');
    });

    socket.on('transcription_result', (data) => {
      console.log('📝 Transcription:', data);
      setUserTranscript(data.transcript);
      if (data.transcript && data.transcript.trim()) {
        setStatusMessage(`You said: "${data.transcript}" (${(data.confidence * 100).toFixed(0)}% confidence)`);
        
        // Add to conversation history
        setConversationHistory(prev => [...prev, { role: 'user', text: data.transcript }]);
      } else {
        setStatusMessage('Processing...');
      }
    });

    socket.on('error', (data) => {
      // Defensive handling: server may send an empty object or string
      let message = 'An unknown error occurred';

      try {
        if (!data) {
          message = 'Unknown server error - No data received';
        } else if (typeof data === 'string') {
          message = data;
        } else if (data.message) {
          message = data.message;
        } else if (data.error && data.error.message) {
          message = data.error.message;
        } else if (data.type || data.details) {
          message = `${data.type || 'Error'}: ${data.details || 'No details provided'}`;
        } else {
          // Try a compact representation for debugging
          message = `Server Error: ${JSON.stringify(data).slice(0, 200)}`;
        }
      } catch (err) {
        console.error('Error parsing socket error:', err);
        message = 'Error parsing server error payload';
      }

      // Only log real errors, not warnings or empty objects
      if (message && message !== 'An unknown error occurred' && !message.includes('No audio data')) {
        console.error('❌ Socket error:', message);
        
        // Log with centralized error handler
        try {
          logError(new Error(message), { 
            source: 'socket.error', 
            payload: data
          });
        } catch (e) {
          // Silently fail error logging
        }
      }

      // Present safe message to user only for real errors
      if (message && !message.includes('No audio data')) {
        console.error('❌ Socket error received:', message);
        setStatusMessage(`Error: ${message}`);
      }
    });

    socket.on('stream_ready', (data) => {
      console.log('✅ Stream ready:', data);
    });

    return () => {
      // Clean up socket for this component instance only
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Empty dependency array - socket should only initialize once on mount

  // Setup media devices
  useEffect(() => {
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 1  // Mono audio
          }
        });

        // Store stream in ref so cleanup can access it even if component unmounts
        mediaStreamRef.current = stream;
        setMediaStream(stream);

        // Set video stream when ref is available
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setStatusMessage('Camera and microphone ready');
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setStatusMessage('Error: Could not access camera/microphone');
      }
    }

    setupMedia();

    // Cleanup media stream when component unmounts or before setting new stream
    return () => {
      // Use ref to access stream - this works even if component unmounts before async completes
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []); // Empty dependency array - setup media once on mount

  // Update video srcObject when mediaStream changes
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Ensure video stream is attached when entering interview mode
  useEffect(() => {
    if (uiState === 'interview' && videoRef.current && mediaStream) {
      console.log('🎥 Attaching video stream to interview room video element');
      videoRef.current.srcObject = mediaStream;
      // Force play
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    }
  }, [uiState, mediaStream]);

  // Start interview
  const handleStartInterview = () => {
    if (!selectedPosition || selectedPosition.trim() === '') {
      alert('Please enter an interview position');
      return;
    }

    if (!socketRef.current || !connected) {
      alert('Not connected to server. Please wait...');
      return;
    }

    console.log('🎬 Starting interview...');
    socketRef.current.emit('start_interview', { position: selectedPosition.trim() });
    setInterviewStarted(true);
    setUiState('interview');
    setStatusMessage('Interview started - Waiting for AI...');
  };

  // Start recording user response
  const handleStartRecording = () => {
    if (!mediaStream || !connected || !socketRef.current) return;

    try {
      audioChunksRef.current = [];
      let totalSamplesSent = 0;  // Track total samples sent
      let pendingProcessing = 0;  // Track pending audio processing tasks

      // Emit stream start
      console.log('📤 Emitting audio_stream_start...');
      socketRef.current.emit('audio_stream_start');

      // Create MediaRecorder with audio only
      const audioStream = new MediaStream(mediaStream.getAudioTracks());
      
      // Try to find the best supported mime type
      let mimeType = 'audio/webm;codecs=opus';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      console.log('🎙️ Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: mimeType
      });

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          pendingProcessing++;  // Increment counter
          
          console.log(`Received audio chunk: ${event.data.size} bytes, total chunks: ${audioChunksRef.current.length}`);
          
          // Skip very small chunks (likely metadata or empty frames)
          // WebM/Opus chunks should typically be at least a few KB
          const MIN_CHUNK_SIZE = 100; // bytes
          if (event.data.size < MIN_CHUNK_SIZE) {
            console.log(`⚠️ Skipping small chunk (${event.data.size} bytes) - likely metadata`);
            pendingProcessing--;  // Decrement since we're skipping
            return;
          }
          
          // Convert chunk to PCM and send to backend immediately
          try {
            const audioBlob = event.data;
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            if (arrayBuffer.byteLength === 0) {
              console.warn('⚠️ Empty audio buffer, skipping...');
              pendingProcessing--;  // Decrement since we're skipping
              return;
            }
            
            console.log(`Processing chunk ${audioChunksRef.current.length}: ${arrayBuffer.byteLength} bytes`);
            
            // Create audio context with native sample rate to preserve quality
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Decode audio data with error handling
            let audioBuffer;
            try {
              // Clone the array buffer to avoid issues if it's already been read
              audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
            } catch (decodeError) {
              // Some chunks might be incomplete or invalid (e.g., partial frames)
              // This is normal for streaming audio - just skip invalid chunks
              console.log(`⚠️ Skipping chunk ${audioChunksRef.current.length} - decode failed (likely incomplete frame): ${decodeError.message}`);
              pendingProcessing--;  // Decrement since we're skipping
              // Close audio context and return early
              audioContext.close().catch(() => {}); // Ignore close errors
              return;
            }
            
            // Close audio context after decoding (we have the buffer, don't need context anymore)
            audioContext.close().catch(() => {}); // Ignore close errors
            
            if (!audioBuffer || audioBuffer.length === 0) {
              console.warn('Audio buffer is empty after decode');
              pendingProcessing--;  // Decrement since we're skipping
              return;
            }

            // Resample to 16kHz for speech recognition
            const targetSampleRate = 16000;
            const sourceSampleRate = audioBuffer.sampleRate;
            const ratio = sourceSampleRate / targetSampleRate;
            
            const pcmData = audioBuffer.getChannelData(0);
            const targetLength = Math.floor(pcmData.length / ratio);
            const resampledData = new Float32Array(targetLength);
            
            // Simple linear resampling
            for (let i = 0; i < targetLength; i++) {
              const sourceIndex = Math.floor(i * ratio);
              resampledData[i] = pcmData[sourceIndex];
            }
            
            // Convert Float32 to Int16
            const pcmInt16 = new Int16Array(resampledData.length);
            for (let i = 0; i < resampledData.length; i++) {
              const s = Math.max(-1, Math.min(1, resampledData[i]));
              pcmInt16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            
            console.log(`Chunk ${audioChunksRef.current.length}: ${pcmInt16.length} samples at 16kHz (from ${pcmData.length} at ${sourceSampleRate}Hz)`);
            
            totalSamplesSent += pcmInt16.length;
            
            // Send PCM data to backend
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('audio_stream_data', { audio: Array.from(pcmInt16) });
              console.log(`Sent chunk ${audioChunksRef.current.length}: ${pcmInt16.length} samples to backend (total: ${totalSamplesSent}, ${(totalSamplesSent/16000).toFixed(2)}s)`);
            } else {
              console.error('Socket not connected, cannot send audio data');
            }
            
            pendingProcessing--;  // Decrement after successful processing
          } catch (err) {
            console.error('❌ Error processing audio chunk:', err);
          }
        } else {
          console.warn('⚠️ Received chunk with 0 size');
        }
      };      mediaRecorder.onstop = () => {
        if (!socketRef.current) {
          console.error('Socket not available');
          setStatusMessage('Connection lost');
          return;
        }

        const totalChunks = audioChunksRef.current.length;
        
        console.log(`Recording stopped - received ${totalChunks} audio chunks`);
        
        if (totalChunks === 0) {
          console.error('No audio data recorded');
          setStatusMessage('Error: No audio captured. Please check your microphone.');
          return;
        }

        console.log('🔚 Sending audio_stream_end to backend...');
        
        // Give a small delay for the final ondataavailable to process
        setTimeout(() => {
          socketRef.current.emit('audio_stream_end');
          setStatusMessage('🔄 Processing your response...');
          console.log(`✅ Audio stream end signal sent - total samples sent: ${totalSamplesSent} (${(totalSamplesSent/16000).toFixed(2)}s)`);
        }, 100);
      };

      mediaRecorderRef.current = mediaRecorder;
      
      // Start recording - no timeslice, will collect all data until stop()
      mediaRecorder.start();
      setIsRecording(true);
      setUserTranscript(''); // Clear previous transcript
      setStatusMessage('Recording... Speak clearly into your microphone');
      
      console.log('Recording started successfully (will capture all audio until stopped)');

    } catch (err) {
      console.error('Error starting recording:', err);
      setStatusMessage('Error starting recording. Please check microphone permissions.');
    }
  };

  // Stop recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording...');
      
      // Request any remaining data before stopping
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData(); // Force flush of any buffered data
      }
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatusMessage('Processing your answer... Please wait');
    }
  };

  // End interview
  const handleEndInterview = () => {
    if (socketRef.current) {
      socketRef.current.emit('end_interview');
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    setInterviewStarted(false);
    setIsRecording(false);
    setUiState('lobby');
    setStatusMessage('Interview ended');
    setSelectedPosition('');
  };

  // Toggle video
  const handleToggleVideo = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle audio mute
  const handleToggleAudio = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioMuted(!audioTrack.enabled);
      }
    }
  };

  // Audio player callbacks
  function playerEnded(e) {
    console.log('🎵 Audio ended');
    setAudioSource(null);
    setPlaying(false);  // This will trigger the reset in the useEffect above
    setStatusMessage('Your turn to speak');
  }

  function playerReady(e) {
    console.log('🎧 Audio ready');
    if (audioPlayer.current) {
      audioPlayer.current.audioEl.current.play().catch(err => {
        console.error('❌ Error playing audio:', err);
        setStatusMessage('Error: Could not play audio. Please check console.');
      });
      setPlaying(true);
    }
  }
  
  // Handle audio loading errors
  useEffect(() => {
    if (audioSource && audioPlayer.current) {
      const audioEl = audioPlayer.current.audioEl?.current;
      if (audioEl) {
        const handleError = (e) => {
          console.error('❌ Audio loading error:', e);
          console.error('   Audio source:', audioSource);
          console.error('   Error details:', audioEl.error);
          setStatusMessage('Error: Could not load audio. Check backend audio route.');
        };
        
        audioEl.addEventListener('error', handleError);
        return () => audioEl.removeEventListener('error', handleError);
      }
    }
  }, [audioSource]);

  // Lobby UI
  if (uiState === 'lobby') {
    return (
      <div style={{...STYLES.container, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {/* Background Avatar */}
        <div style={{position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none'}}>
          <Canvas dpr={2} onCreated={(ctx) => {
            ctx.gl.physicallyCorrectLights = true;
          }}>
            <OrthographicCamera 
              makeDefault
              zoom={2200}
              position={[0, 1.75, 1.2]}
            />
            <Suspense fallback={null}>
              <Environment background={false} files="/images/photo_studio_loft_hall_1k.hdr" />
            </Suspense>
            <Suspense fallback={null}>
              <Bg />
            </Suspense>
            <Suspense fallback={null}>
              <Avatar 
                avatar_url="/model.glb" 
                speak={false} 
                setSpeak={() => {}}
                text={''}
                setAudioSource={setAudioSource}
                playing={playing}
                blendData={blendData}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Setup Modal */}
        <Card className="relative z-10 w-full max-w-lg p-8 space-y-6 bg-background/95 backdrop-blur shadow-2xl mx-4">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Ready to Start?</h2>
            <p className="text-muted-foreground">Prepare for your AI interview</p>
          </div>

          {/* Camera Preview */}
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* Status Indicators */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className={`w-4 h-4 ${mediaStream ? 'text-green-500' : 'text-muted-foreground'}`} />
              <span className={mediaStream ? 'text-green-500' : 'text-muted-foreground'}>
                {mediaStream ? 'Microphone Ready' : 'Initializing microphone...'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className={`w-4 h-4 ${mediaStream ? 'text-green-500' : 'text-muted-foreground'}`} />
              <span className={mediaStream ? 'text-green-500' : 'text-muted-foreground'}>
                {mediaStream ? 'Camera Ready' : 'Initializing camera...'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className={`w-4 h-4 ${connected ? 'text-green-500' : 'text-muted-foreground'}`} />
              <span className={connected ? 'text-green-500' : 'text-muted-foreground'}>
                {connected ? 'Server Connected' : 'Connecting to server...'}
              </span>
            </div>
          </div>

          {/* Position Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Enter Interview Position</label>
            <Input
              type="text"
              placeholder="e.g., Software Engineer, Product Manager, Data Scientist..."
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Enter the specific role you want to practice for
            </p>
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStartInterview}
            disabled={!connected || !mediaStream || !selectedPosition}
            size="lg"
            className="w-full text-lg"
          >
            Start Interview
          </Button>
        </Card>
      </div>
    );
  }

  // Interview Room UI - Google Meet Style Layout
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Main Video Area - Interviewer fills the screen */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#1a1a1a',
        marginRight: showTranscript ? '400px' : '0',
        transition: 'margin-right 0.3s ease-out'
      }}>
        {/* Interviewer Video - Full Screen with padding on left side only */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '100px',
          right: 0,
          bottom: 0,
          height: '100%',
          backgroundColor: '#1a1a1a',
          overflow: 'hidden'
        }}>
          <Canvas 
            dpr={2} 
            style={{ 
              width: '100%', 
              height: '100%',
              display: 'block',
              margin: 0,
              padding: 0
            }}
            gl={{ 
              antialias: true,
              alpha: false,
              powerPreference: "high-performance"
            }}
            onCreated={({ scene, gl }) => {
              gl.physicallyCorrectLights = true;
              // Set scene background to match container (dark gray to eliminate black spaces)
              scene.background = new THREE.Color(0x1a1a1a);
            }}
          >
            <OrthographicCamera 
              makeDefault
              zoom={1900}
              position={[0, 1.65, 1.3]}
            />

            <Suspense fallback={null}>
              <Environment background={false} files="/images/photo_studio_loft_hall_1k.hdr" />
            </Suspense>

            <Suspense fallback={null}>
              <Bg />
            </Suspense>

            <Suspense fallback={null}>
              <Avatar 
                avatar_url="/model.glb" 
                speak={playing} 
                setSpeak={setPlaying}
                text={''}
                setAudioSource={setAudioSource}
                playing={playing}
                blendData={blendData}
              />
            </Suspense>
          </Canvas>

          <Loader dataInterpolation={(p) => `Loading AI Interviewer... ${Math.round(p)}%`} />
        </div>
        
        {/* Status Message - Overlay on Interviewer */}
        {statusMessage && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: isRecording ? 'rgba(239, 68, 68, 0.9)' : 'rgba(139, 92, 246, 0.9)',
            padding: '10px 24px',
            borderRadius: '24px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '500',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: isRecording ? 'pulse 1.5s ease-in-out infinite' : 'none'
          }}>
            {isRecording && (
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#fff',
                animation: 'blink 1s ease-in-out infinite'
              }} />
            )}
            {statusMessage}
          </div>
        )}
      </div>

      {/* User Video Feed - Small box in bottom-right corner (Picture-in-Picture) - Positioned at root level */}
      <div style={{
        position: 'absolute',
        bottom: '100px', // Above control bar (control bar is ~80px + padding)
        right: showTranscript ? '420px' : '24px', // Adjust when transcript is open
        width: '240px',
        height: '180px',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#000',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        zIndex: 15, // Above interviewer but below status message
        transition: 'right 0.3s ease-out'
      }}>
        <video 
          ref={videoRef}
          autoPlay 
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000',
            display: videoEnabled ? 'block' : 'none'
          }}
        />
        {!videoEnabled && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1a1a1a',
            color: '#666'
          }}>
            <VideoOff className="w-8 h-8" />
          </div>
        )}
        <div style={{
          position: 'absolute',
          bottom: '6px',
          left: '6px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '3px 8px',
          borderRadius: '4px',
          color: '#fff',
          fontSize: '11px',
          fontWeight: '500'
        }}>
          You
        </div>
      </div>

      {/* Control Panel - Bottom Bar */}
      <div style={{
        width: '100%',
        minHeight: '80px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 24px',
        zIndex: 100,
        backdropFilter: 'blur(10px)'
      }}>
        {/* Microphone Mute/Unmute Button */}
        <button
          onClick={handleToggleAudio}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: audioMuted ? '#ef4444' : '#374151',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: audioMuted ? '0 4px 20px rgba(239, 68, 68, 0.4)' : 'none'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = audioMuted ? '#dc2626' : '#4b5563';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = audioMuted ? '#ef4444' : '#374151';
          }}
          title={audioMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {audioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* Respond Button (Push to Talk) */}
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            disabled={!connected || playing || audioMuted}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: 'none',
              background: (connected && !playing && !audioMuted) ? '#10b981' : '#4b5563',
              color: '#fff',
              cursor: (connected && !playing && !audioMuted) ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: (connected && !playing && !audioMuted) ? '0 4px 20px rgba(16, 185, 129, 0.4)' : 'none'
            }}
            onMouseOver={(e) => {
              if (connected && !playing && !audioMuted) {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = '#059669';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              if (connected && !playing && !audioMuted) e.currentTarget.style.background = '#10b981';
            }}
            title="Respond (Push to Talk)"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              animation: 'pulse 1.5s ease-in-out infinite',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.6)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.background = '#dc2626';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#ef4444';
            }}
            title="Stop Responding"
          >
            <Check className="w-6 h-6" />
          </button>
        )}

        {/* Camera Toggle Button */}
        <button
          onClick={handleToggleVideo}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: videoEnabled ? '#374151' : '#ef4444',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: videoEnabled ? 'none' : '0 4px 20px rgba(239, 68, 68, 0.4)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = videoEnabled ? '#4b5563' : '#dc2626';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = videoEnabled ? '#374151' : '#ef4444';
          }}
          title={videoEnabled ? "Turn Off Camera" : "Turn On Camera"}
        >
          {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

        {/* Chat/Transcript Button */}
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: showTranscript ? '#8b5cf6' : '#374151',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: showTranscript ? '0 4px 20px rgba(139, 92, 246, 0.4)' : 'none'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = showTranscript ? '#7c3aed' : '#4b5563';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = showTranscript ? '#8b5cf6' : '#374151';
          }}
          title="Toggle Transcript"
        >
          <FileText className="w-6 h-6" />
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndInterview}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#ef4444',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.background = '#dc2626';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = '#ef4444';
          }}
          title="End Interview"
        >
          <Phone className="w-6 h-6 rotate-135" />
        </button>
      </div>

      {/* Audio Player */}
      <ReactAudioPlayer
        src={audioSource}
        ref={audioPlayer}
        onEnded={playerEnded}
        onCanPlayThrough={playerReady}
      />

      {/* Transcript Sidebar - Slides in from right */}
      {showTranscript && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '400px',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.95)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.3s ease-out',
          zIndex: 50,
          overflow: 'hidden'
        }}>
          {/* Fixed Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            flexShrink: 0
          }}>
            <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '600', margin: 0 }}>
              Interview Transcript
            </h3>
            <button
              onClick={() => setShowTranscript(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Messages Container */}
          <div 
            ref={transcriptScrollRef}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '24px',
              minHeight: 0
            }}>
            {conversationHistory.length > 0 ? (
              <>
                {conversationHistory.map((message, index) => (
                  <div key={index}>
                    <div style={{ 
                      color: message.role === 'ai' ? '#8b5cf6' : '#3b82f6', 
                      fontSize: '12px', 
                      marginBottom: '6px', 
                      fontWeight: '600' 
                    }}>
                      {message.role === 'ai' ? 'AI Interviewer:' : 'You:'}
                    </div>
                    <div style={{ 
                      background: message.role === 'ai' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)', 
                      padding: '12px 16px', 
                      borderRadius: '12px',
                      border: `1px solid ${message.role === 'ai' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                      color: '#fff',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
                      {message.text}
                    </div>
                  </div>
                ))}
                {/* Spacer at bottom to ensure last message is fully visible */}
                <div style={{ height: '24px', flexShrink: 0 }} />
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: '60px 20px', fontSize: '14px' }}>
                The conversation will appear here...
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function Bg() {
  const texture = useTexture('/images/bg.webp');

  return (
    <mesh position={[0, 1.6, -2.5]} scale={[4, 4, 1]}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

export default AppInterviewer;