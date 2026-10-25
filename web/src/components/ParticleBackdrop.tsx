import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

interface ParticleBackdropProps {
  scrollProgress?: number;
  mode?: 'vortex' | 'terrain' | 'network';
}

export const ParticleBackdrop: React.FC<ParticleBackdropProps> = ({
  scrollProgress = 0,
  mode = 'vortex',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Target positions for morphing
  const positionsVortex = useRef<Float32Array | null>(null);
  const positionsTerrain = useRef<Float32Array | null>(null);
  const positionsNetwork = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x07090e, 0.007);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 15, 80);
    cameraRef.current = camera;

    // 2. Renderer with High Dynamic Range & Bloom Aesthetics
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // 2.5 GPU Post-Processing Bloom Pipeline (Extra 3)
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.95, // Bloom intensity
      0.45, // Bloom radius
      0.22  // Luminous threshold
    );

    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // 3. 3D Holographic Topographic Wireframe Relief Mesh for Awash Valley
    const terrainGeo = new THREE.PlaneGeometry(180, 180, 36, 36);
    terrainGeo.rotateX(-Math.PI / 2);
    terrainGeo.translate(0, -22, 0);

    const posArray = terrainGeo.attributes.position.array as Float32Array;
    const initialY = new Float32Array(posArray.length / 3);
    for (let i = 0; i < posArray.length; i += 3) {
      const x = posArray[i];
      const z = posArray[i + 2];
      // River basin depression and undulating mountain ridges
      const distFromRiver = Math.abs(x - Math.sin(z * 0.04) * 20);
      const elev =
        Math.sin(x * 0.06) * 5 +
        Math.cos(z * 0.05) * 6 -
        Math.max(0, 16 - distFromRiver * 0.7);
      posArray[i + 1] = elev;
      initialY[i / 3] = elev;
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    scene.add(terrainMesh);

    // 4. Generate 3D Particle Datasets (3,600 Particles with Multi-spectral Luminous Colors)
    const count = 3600;
    const posVortex = new Float32Array(count * 3);
    const posTerrain = new Float32Array(count * 3);
    const posNetwork = new Float32Array(count * 3);
    const currentPositions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const cyan = new THREE.Color('#38bdf8');
    const emerald = new THREE.Color('#34d399');
    const amber = new THREE.Color('#fbbf24');
    const rose = new THREE.Color('#f43f5e');
    const starlight = new THREE.Color('#f8fafc');
    const deepBlue = new THREE.Color('#0369a1');

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Shape A: Atmospheric Cyclone / Storm Moisture Vortex
      const radius = 6 + Math.pow(Math.random(), 1.4) * 85;
      const spinAngle = radius * 0.16 + (i % 8) * ((Math.PI * 2) / 8);
      posVortex[i3] = Math.cos(spinAngle) * radius + (Math.random() - 0.5) * 12;
      posVortex[i3 + 1] = Math.sin(spinAngle) * radius * 0.75 + (Math.random() - 0.5) * 14;
      posVortex[i3 + 2] = (Math.random() - 0.5) * 45 - radius * 0.3;

      // Shape B: Digital Elevation Basin Terrain (Awash River Valley)
      const gridSize = Math.floor(Math.sqrt(count));
      const gx = (i % gridSize) - gridSize / 2;
      const gz = Math.floor(i / gridSize) - gridSize / 2;
      const tx = gx * 3.4;
      const tz = gz * 3.4;
      const riverbedDist = Math.abs(tx - Math.sin(tz * 0.05) * 18);
      const elevation =
        Math.sin(tx * 0.07) * 8 +
        Math.cos(tz * 0.06) * 8 -
        Math.max(0, 15 - riverbedDist * 0.85) -
        15;

      posTerrain[i3] = tx;
      posTerrain[i3 + 1] = elevation;
      posTerrain[i3 + 2] = tz;

      // Shape C: Spatial Healthcare Network Graph (14 Regional Clusters)
      const cluster = i % 14;
      const clusterCenters = [
        [-28, 10, 8],
        [24, 14, -10],
        [-14, -16, 14],
        [20, -14, -6],
        [0, 24, -20],
        [-22, -8, -14],
        [14, 8, 20],
        [-6, 6, 4],
        [34, -6, 16],
        [-34, 16, -16],
        [8, -24, 6],
        [-16, 20, 16],
        [4, -4, 2],
        [0, 0, 0],
      ];
      const center = clusterCenters[cluster];
      const clusterRad = Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      posNetwork[i3] = center[0] + clusterRad * Math.sin(phi) * Math.cos(theta);
      posNetwork[i3 + 1] = center[1] + clusterRad * Math.sin(phi) * Math.sin(theta);
      posNetwork[i3 + 2] = center[2] + clusterRad * Math.cos(phi);

      // Initial coordinates
      currentPositions[i3] = posVortex[i3];
      currentPositions[i3 + 1] = posVortex[i3 + 1];
      currentPositions[i3 + 2] = posVortex[i3 + 2];

      // Luxury palette gradient
      const rnd = Math.random();
      let c: THREE.Color;
      if (rnd > 0.88) c = amber;
      else if (rnd > 0.82) c = rose;
      else if (rnd > 0.65) c = emerald;
      else if (rnd > 0.35) c = cyan;
      else if (rnd > 0.15) c = deepBlue;
      else c = starlight;

      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
      sizes[i] = 1.4 + Math.random() * 2.6;
    }

    positionsVortex.current = posVortex;
    positionsTerrain.current = posTerrain;
    positionsNetwork.current = posNetwork;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Texture with Specular Halo & Multi-stop Soft Bloom
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.18, 'rgba(125, 211, 252, 0.95)');
      grad.addColorStop(0.42, 'rgba(14, 165, 233, 0.45)');
      grad.addColorStop(0.72, 'rgba(2, 132, 199, 0.12)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 2.6,
      vertexColors: true,
      map: texture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    pointsRef.current = points;

    // 5. Gyroscope Orientation & Parallax: Mobile, Tablet & Desktop Tracking
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    // Interactive Shockwave Pulse Ripple
    let rippleOrigin = new THREE.Vector3(0, 0, 0);
    let rippleActive = false;
    let rippleStartTime = 0;

    const triggerRipple = (clientX: number, clientY: number) => {
      const xNorm = (clientX / window.innerWidth - 0.5) * 60;
      const yNorm = -(clientY / window.innerHeight - 0.5) * 45;
      rippleOrigin.set(xNorm, yNorm, 0);
      rippleActive = true;
      rippleStartTime = clock.getElapsedTime();
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 16;
      targetY = (e.clientY / window.innerHeight - 0.5) * 12;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        targetX = (e.touches[0].clientX / window.innerWidth - 0.5) * 22;
        targetY = (e.touches[0].clientY / window.innerHeight - 0.5) * 16;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      triggerRipple(e.clientX, e.clientY);
    };

    // Mobile & Tablet Device Orientation Gyroscope
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // gamma is left-to-right tilt in [-90, 90]
        // beta is front-to-back tilt in [-180, 180]
        targetX = (e.gamma / 45) * 14;
        targetY = ((e.beta - 45) / 45) * 10;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    }

    // 6. Window Resize
    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      composerRef.current?.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. Animation Loop with Organic Undulation & Ripple Perturbations
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera interpolation
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      if (pointsRef.current) {
        pointsRef.current.rotation.y = elapsed * 0.03 + currentX * 0.035;
        pointsRef.current.rotation.x = Math.sin(elapsed * 0.02) * 0.07 - currentY * 0.035;
        pointsRef.current.rotation.z = Math.cos(elapsed * 0.015) * 0.03;
      }

      // Animate terrain wireframe with breathing waves
      if (terrainMesh) {
        terrainMesh.rotation.y = elapsed * 0.012;
        const pos = terrainGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < pos.length; i += 3) {
          const idx = i / 3;
          pos[i + 1] = initialY[idx] + Math.sin(elapsed * 1.5 + idx * 0.2) * 1.2;
        }
        terrainGeo.attributes.position.needsUpdate = true;
      }

      // GPU Post-Processing Bloom Render
      if (composerRef.current) {
        composerRef.current.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (rendererRef.current?.domElement && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      composerRef.current?.dispose();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      terrainGeo.dispose();
    };
  }, []);

  // Smooth Morphing between 3D Topographic States
  useEffect(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    if (!posAttr) return;

    let targetPositions: Float32Array | null = null;
    if (mode === 'terrain') targetPositions = positionsTerrain.current;
    else if (mode === 'network') targetPositions = positionsNetwork.current;
    else targetPositions = positionsVortex.current;

    if (!targetPositions) return;

    const currentArray = posAttr.array as Float32Array;
    const startArray = new Float32Array(currentArray);
    const tweenObj = { val: 0 };

    gsap.killTweensOf(tweenObj);
    gsap.to(tweenObj, {
      val: 1,
      duration: 1.6,
      ease: 'expo.inOut',
      onUpdate: () => {
        const p = tweenObj.val;
        for (let i = 0; i < currentArray.length; i++) {
          currentArray[i] = startArray[i] + (targetPositions![i] - startArray[i]) * p;
        }
        posAttr.needsUpdate = true;
      },
    });
  }, [mode, scrollProgress]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-75 transition-opacity duration-1000"
      aria-hidden="true"
    />
  );
};
