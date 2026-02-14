"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function LiquidEther({
  colors = ['#5227FF', '#FF9FFC', '#B19EEF'],
  style = {},
  className = ''
}) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create scene and camera
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Create animated gradient plane
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
        mouse: { value: new THREE.Vector2(0.5, 0.5) },
        color1: { value: new THREE.Color(colors[0] || '#5227FF') },
        color2: { value: new THREE.Color(colors[1] || '#FF9FFC') },
        color3: { value: new THREE.Color(colors[2] || '#B19EEF') }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 resolution;
        uniform vec2 mouse;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        varying vec2 vUv;

        void main() {
          vec2 st = gl_FragCoord.xy / resolution.xy;
          vec2 m = mouse;
          
          float t = time * 0.5;
          
          // Create flowing patterns
          float wave1 = sin(st.x * 10.0 + t) * cos(st.y * 8.0 + t * 1.2);
          float wave2 = sin(st.x * 6.0 + t * 1.5) * cos(st.y * 12.0 + t * 0.8);
          float wave3 = sin(st.x * 8.0 + t * 0.7) * cos(st.y * 10.0 + t * 1.3);
          
          // Mouse influence
          float dist = distance(st, m);
          float influence = 1.0 - smoothstep(0.0, 0.3, dist);
          
          // Mix colors based on waves and mouse
          vec3 finalColor = mix(color1, color2, (wave1 + 1.0) * 0.5);
          finalColor = mix(finalColor, color3, (wave2 + 1.0) * 0.5);
          finalColor = mix(finalColor, color1 * 1.3, influence * (wave3 + 1.0) * 0.5);
          
          // Create alpha gradient for transparency
          float alpha = 0.7 + 0.3 * sin(wave1 + wave2);
          alpha *= influence * 0.5 + 0.5;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Mouse tracking
    const mouse = new THREE.Vector2(0.5, 0.5);
    
    const onMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      mouse.x = (event.clientX - rect.left) / rect.width;
      mouse.y = 1.0 - (event.clientY - rect.top) / rect.height;
      material.uniforms.mouse.value.copy(mouse);
    };

    container.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const animate = () => {
      material.uniforms.time.value = performance.now() * 0.001;
      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      material.uniforms.resolution.value.set(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      container.removeEventListener('mousemove', onMouseMove);
      resizeObserver.disconnect();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [colors]);

  return (
    <div
      ref={mountRef}
      className={`w-full h-full relative overflow-hidden ${className}`}
      style={style}
    />
  );
}
