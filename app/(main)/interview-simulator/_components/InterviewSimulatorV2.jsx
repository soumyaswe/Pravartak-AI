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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Mic, MicOff, VideoOff, Phone, MessageSquare, X, Check } from 'lucide-react';

const _ = require('lodash');

// Use environment variable for backend URL (Cloud Run or local development)
// IMPORTANT: This env var is set at BUILD time from Secret Manager
const host = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5000'
console.log('🔗 Backend URL:', host); // Debug log to verify URL

// Initialize Socket.IO connection
let socket = null;

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
  const mixer = new THREE.AnimationMixer(gltf.scene);

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

  let idleFbx = useFBX('/idle.fbx');
  let { clips: idleClips } = useAnimations(idleFbx.animations);

  idleClips[0].tracks = _.filter(idleClips[0].tracks, track => {
    return track.name.includes("Head") || track.name.includes("Neck") || track.name.includes("Spine2");
  });

  useEffect(() => {
    let idleClipAction = mixer.clipAction(idleClips[0]);
    idleClipAction.play();

    let blinkClip = createAnimation(blinkData, morphTargetDictionaryBody, 'HG_Body');
    let blinkAction = mixer.clipAction(blinkClip);
    blinkAction.play();
  }, []);

  useEffect(() => {
    if (playing === false) return;

    clips.forEach((clip) => {
      let clipAction = mixer.clipAction(clip);
      clipAction.setLoop(THREE.LoopOnce);
      clipAction.play();
    });

  }, [playing, clips]);

  useFrame((state, delta) => {
    mixer.update(delta);
  });

  return (
    <group name="avatar">
      <primitive object={gltf.scene} dispose={null} />
    </group>
  );
}

const INTERVIEW_POSITIONS = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'UX/UI Designer',
  'DevOps Engineer',
  'Marketing Manager',
  'Sales Representative',
  'Business Analyst',
  'Project Manager',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
];

export default function InterviewSimulatorV2() {
  // UI States
  const [uiState, setUiState] = useState('lobby'); // 'lobby' | 'interview'
  const [selectedPosition, setSelectedPosition] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  
  // Connection & Interview States
  const [connected, setConnected] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Media States
  const [audioSource, setAudioSource] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  
  // Initialize with neutral blend data (mouth closed)
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
    
    const neutralFrame = blendShapes.reduce((acc, shape) => {
      acc[shape] = shape === 'mouthClose' ? 1.0 : 0.0;
      return acc;
    }, {});
    
    return [{ time: 0, blendshapes: neutralFrame }];
  }, []);
  
  const [blendData, setBlendData] = useState(neutralBlendData);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');

  const videoRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    socket = io(host, {
      transports: ['websocket', 'polling'], // Include polling fallback for Cloud Run compatibility
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 600000,  // 600 seconds (10 minutes) connection timeout for very long audio processing
      pingTimeout: 600000,  // 600 seconds ping timeout
      pingInterval: 120000,  // Ping every 120 seconds to keep connection alive
      forceNew: true // Force new connection to avoid reusing stale connections
    });

    socket.on('connect', () => {
      console.log('✅ Connected to server');
      setConnected(true);
      setStatusMessage('Connected - Ready to start');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setConnected(false);
      setStatusMessage('Disconnected from server');
    });

    socket.on('connection_response', (data) => {
      console.log('🔗 Connection response:', data);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      // Safely handle undefined error or missing message property
      const errorMessage = (error && error.message) ? error.message : 'Connection failed';
      setStatusMessage(`Connection error: ${errorMessage}. Check backend URL: ${host}`);
      setConnected(false);
    });

    socket.on('avatar_speaks', (data) => {
      console.log('🗣️ Avatar speaking:', data);
      setBlendData(data.blendData);
      setAudioSource(host + data.filename);
      setAiTranscript(data.transcript || '');
      setStatusMessage('AI Interviewer is speaking...');
    });

    socket.on('avatar_speaks_chunk', (data) => {
      console.log('🗣️ Avatar chunk:', data.text_chunk);
      
      if (data.blendData) {
        setBlendData(prevData => {
          if (!prevData) return data.blendData;
          return [...prevData, ...data.blendData];
        });
      }
      
      if (data.filename) {
        setAudioSource(host + data.filename);
      }
      
      setAiTranscript(prev => prev + data.text_chunk);
      setStatusMessage('AI is streaming response...');
    });

    socket.on('transcription_result', (data) => {
      console.log('📝 Transcription:', data);
      setUserTranscript(data.transcript);
      setStatusMessage(`You said: "${data.transcript}"`);
    });

    socket.on('error', (data) => {
      let message = 'An unknown error occurred';
      try {
        if (!data) {
          message = 'Unknown server error';
        } else if (typeof data === 'string') {
          message = data;
        } else if (data.message) {
          message = data.message;
        } else if (data.error && data.error.message) {
          message = data.error.message;
        } else {
          message = JSON.stringify(data).slice(0, 200);
        }
      } catch (err) {
        message = 'Error parsing server error payload';
      }

      try {
        logError(new Error(message), { source: 'socket.error', payload: data });
      } catch (e) {
        if (process.env.NODE_ENV === 'development') console.error('Socket error logging failed', e);
      }

      setStatusMessage(`Error: ${message}`);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Setup media devices
  useEffect(() => {
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 48000
          }
        });
        
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setStatusMessage('Camera and microphone ready');
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setStatusMessage('Could not access camera/microphone');
      }
    }
    
    setupMedia();
  }, []);

  const handleStartInterview = () => {
    if (!connected || !selectedPosition) {
      alert('Please select an interview position and ensure you are connected to the server');
      return;
    }

    setUiState('interview');
    setInterviewStarted(true);
    socket.emit('start_session', { 
      sessionId: Date.now().toString(),
      position: selectedPosition 
    });
    setStatusMessage('Interview started - AI will greet you shortly');
  };

  const handleEndInterview = () => {
    if (socket) {
      socket.emit('end_session');
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    setInterviewStarted(false);
    setIsRecording(false);
    setUiState('lobby');
    setStatusMessage('Interview ended');
  };

  const startRecording = () => {
    if (!mediaStream || !interviewStarted) return;
    
    setIsRecording(true);
    setStatusMessage('Recording your answer...');
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
    const source = audioContext.createMediaStreamSource(mediaStream);
    const processor = audioContext.createScriptProcessor(8192, 1, 1);  // Larger buffer (8192) for longer recordings
    
    source.connect(processor);
    processor.connect(audioContext.destination);
    
    socket.emit('audio_stream_start');
    
    let chunkCount = 0;
    processor.onaudioprocess = (e) => {
      if (!isRecording) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = new Int16Array(inputData.length);
      
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
      }
      
      socket.emit('audio_stream_data', { audio: Array.from(pcmData) });
      
      // Log progress every ~1 second for long recordings
      chunkCount++;
      if (chunkCount % 6 === 0) {  // ~1 second at 48kHz with 8192 buffer
        console.log(`📊 Recording in progress... ${(chunkCount * 8192 / 48000).toFixed(1)}s`);
      }
    };
    
    window.audioProcessor = processor;
    window.audioContext = audioContext;
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStatusMessage('Processing your answer...');
    
    if (window.audioProcessor) {
      window.audioProcessor.disconnect();
    }
    if (window.audioContext) {
      window.audioContext.close();
    }
    
    socket.emit('audio_stream_end');
  };

  const toggleMic = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraEnabled(videoTrack.enabled);
      }
    }
  };

  // Lobby UI
  if (uiState === 'lobby') {
    return (
      <div className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        {/* Background Avatar Preview */}
        <div className="absolute inset-0 opacity-20">
          <Canvas
            camera={{ fov: 20, position: [0, 0, 4] }}
            style={{ width: '100%', height: '100%' }}
          >
            <Suspense fallback={null}>
              <OrthographicCamera makeDefault position={[0, 1.65, 1]} zoom={600} />
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <Avatar
                avatar_url="/model.glb"
                speak={false}
                setSpeak={() => {}}
                text=""
                setAudioSource={setAudioSource}
                playing={playing}
                blendData={blendData}
              />
              <Environment preset="sunset" />
            </Suspense>
          </Canvas>
        </div>

        {/* Setup Modal */}
        <Card className="relative z-10 w-full max-w-lg p-8 space-y-6 bg-background/95 backdrop-blur shadow-2xl">
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
            {!isCameraEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <VideoOff className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Status Indicators */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span className={connected ? 'text-green-500' : 'text-muted-foreground'}>
                {connected ? 'Microphone Ready' : 'Connecting...'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span className={mediaStream ? 'text-green-500' : 'text-muted-foreground'}>
                {mediaStream ? 'Camera Ready' : 'Initializing...'}
              </span>
            </div>
          </div>

          {/* Position Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Interview Position</label>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a position..." />
              </SelectTrigger>
              <SelectContent>
                {INTERVIEW_POSITIONS.map((position) => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

  // Interview Room UI
  return (
    <div className="relative h-[calc(100vh-8rem)] bg-black flex">
      {/* Main Avatar Viewport */}
      <div className={`relative transition-all duration-300 ${showTranscript ? 'w-[70%]' : 'w-full'}`}>
        <Canvas
          camera={{ fov: 20, position: [0, 0, 4] }}
          style={{ width: '100%', height: '100%' }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <Suspense fallback={null}>
            <OrthographicCamera makeDefault position={[0, 1.65, 1]} zoom={600} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Avatar
              avatar_url="/model.glb"
              speak={false}
              setSpeak={() => {}}
              text=""
              setAudioSource={setAudioSource}
              playing={playing}
              blendData={blendData}
            />
            <Environment preset="sunset" />
          </Suspense>
        </Canvas>

        {/* User Video Picture-in-Picture (Top-Right) */}
        <div className="absolute top-6 right-6 w-48 h-36 rounded-lg overflow-hidden border-2 border-primary/50 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isCameraEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90">
              <VideoOff className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Status Badge (Top-Left) */}
        <div className="absolute top-6 left-6">
          <div className="bg-background/90 backdrop-blur px-4 py-2 rounded-full border border-primary/20 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">{statusMessage}</span>
          </div>
        </div>

        {/* Control Bar (Bottom-Center) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <Card className="flex items-center gap-2 p-2 bg-background/95 backdrop-blur shadow-2xl">
            <Button
              variant={isMicEnabled ? "default" : "destructive"}
              size="icon"
              className="rounded-full w-12 h-12"
              onClick={toggleMic}
            >
              {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
            
            <Button
              variant={isCameraEnabled ? "default" : "destructive"}
              size="icon"
              className="rounded-full w-12 h-12"
              onClick={toggleCamera}
            >
              {isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>

            {!isRecording ? (
              <Button
                variant="default"
                size="lg"
                className="px-6 rounded-full"
                onClick={startRecording}
              >
                <Mic className="w-4 h-4 mr-2" />
                Respond
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="lg"
                className="px-6 rounded-full animate-pulse"
                onClick={stopRecording}
              >
                Stop
              </Button>
            )}

            <Button
              variant="destructive"
              size="icon"
              className="rounded-full w-12 h-12"
              onClick={handleEndInterview}
            >
              <Phone className="w-5 h-5 rotate-135" />
            </Button>

            <Button
              variant={showTranscript ? "default" : "outline"}
              size="icon"
              className="rounded-full w-12 h-12"
              onClick={() => setShowTranscript(!showTranscript)}
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          </Card>
        </div>
      </div>

      {/* Transcript Sidebar (Right, Slides In) */}
      {showTranscript && (
        <div className="w-[30%] bg-background border-l border-border flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold">Interview Transcript</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTranscript(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {aiTranscript && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-primary">AI Interviewer:</div>
                <div className="bg-primary/10 rounded-lg p-3 text-sm">
                  {aiTranscript}
                </div>
              </div>
            )}

            {userTranscript && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-blue-500">You:</div>
                <div className="bg-blue-500/10 rounded-lg p-3 text-sm">
                  {userTranscript}
                </div>
              </div>
            )}

            {!aiTranscript && !userTranscript && (
              <div className="text-center text-muted-foreground text-sm py-8">
                The conversation will appear here...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden Audio Player */}
      <ReactAudioPlayer
        ref={audioPlayerRef}
        src={audioSource}
        autoPlay
        onPlay={() => setPlaying(true)}
        onEnded={() => setPlaying(false)}
        style={{ display: 'none' }}
      />
    </div>
  );
}
