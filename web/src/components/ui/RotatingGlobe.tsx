"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/* ── Precise Simplified Continent Vector Polygons (lon, lat) ── */
const CONTINENTS: [number, number][][] = [
  // Africa
  [
    [-17, 15], [-17, 21], [-13, 27], [-10, 30], [-5, 36], [0, 36], [10, 37],
    [15, 33], [25, 32], [32, 31], [33, 27], [37, 22], [43, 12], [51, 11],
    [45, 5], [41, -4], [35, -12], [33, -26], [28, -34], [18, -34], [15, -28],
    [12, -15], [9, -1], [10, 4], [2, 6], [-5, 5], [-12, 5], [-17, 11], [-17, 15],
  ],
  // Eurasia
  [
    [-9, 36], [-9, 43], [0, 43], [3, 47], [-4, 48], [-2, 53], [8, 55], [10, 58],
    [18, 59], [25, 60], [28, 70], [40, 68], [60, 70], [80, 73], [100, 76],
    [120, 73], [140, 72], [160, 69], [170, 65], [160, 55], [142, 50], [130, 42],
    [122, 38], [121, 31], [115, 22], [105, 20], [103, 10], [98, 12], [90, 22],
    [80, 16], [75, 12], [70, 22], [62, 25], [55, 25], [50, 15], [44, 13],
    [36, 27], [35, 33], [26, 38], [20, 40], [14, 41], [12, 44], [0, 41],
    [-5, 36], [-9, 36],
  ],
  // North America
  [
    [-168, 65], [-160, 71], [-140, 70], [-120, 70], [-100, 70], [-80, 74],
    [-65, 60], [-55, 50], [-60, 44], [-70, 42], [-75, 35], [-80, 25], [-82, 23],
    [-88, 30], [-97, 26], [-97, 20], [-87, 13], [-80, 8], [-85, 11], [-95, 16],
    [-105, 20], [-110, 25], [-117, 32], [-124, 40], [-125, 49], [-135, 56],
    [-150, 60], [-165, 60], [-168, 65],
  ],
  // South America
  [
    [-75, 10], [-62, 10], [-50, 0], [-35, -5], [-35, -12], [-40, -22], [-48, -28],
    [-58, -35], [-65, -42], [-66, -55], [-75, -50], [-72, -40], [-71, -30],
    [-76, -18], [-81, -5], [-77, 2], [-75, 10],
  ],
  // Australia
  [
    [114, -22], [113, -26], [115, -34], [120, -34], [130, -32], [138, -35],
    [147, -38], [151, -33], [153, -28], [150, -20], [143, -13], [136, -12],
    [130, -13], [124, -16], [118, -20], [114, -22],
  ],
];

/* ── Point in Polygon Test ── */
function isPointInContinent(lon: number, lat: number): boolean {
  for (const poly of CONTINENTS) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0];
      const yi = poly[i][1];
      const xj = poly[j][0];
      const yj = poly[j][1];
      const intersect =
        yi > lat !== yj > lat &&
        lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

/* ── Spherical Coordinate Conversion ── */
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

/* ── Humanitarian Logistics Corridors (from Awash / Addis) ── */
const CORRIDORS = [
  // Awash to Port of Djibouti (Ethiopia's primary maritime freight artery)
  { from: { lat: 9.35, lon: 40.35 }, to: { lat: 11.59, lon: 43.15 }, label: 'Djibouti Supply Lifeline' },
  // Awash to Nairobi (Regional UN Logistics Depot)
  { from: { lat: 9.35, lon: 40.35 }, to: { lat: -1.29, lon: 36.82 }, label: 'Nairobi Airlift Depot' },
  // Awash to Dubai (International Humanitarian City)
  { from: { lat: 9.35, lon: 40.35 }, to: { lat: 25.20, lon: 55.27 }, label: 'Dubai Emergency Stockpile' },
  // Awash to Geneva (UN-OCHA Global Emergency Center)
  { from: { lat: 9.35, lon: 40.35 }, to: { lat: 46.20, lon: 6.14 }, label: 'Geneva OCHA Coordination' },
];

export function RotatingGlobe({ className = '' }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 500;
    let height = container.clientHeight || 500;

    // ── Three.js Scene Setup ──
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 1000);
    camera.position.z = 250;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const globeRadius = 82;
    const globeGroup = new THREE.Group();
    // Default orientation showcasing East Africa / Awash Basin clearly
    globeGroup.rotation.x = 0.22;
    globeGroup.rotation.y = -1.1;
    scene.add(globeGroup);

    // ── 1. Inner Sphere (Deep Opaque Ocean Silhouette) ──
    const sphereGeo = new THREE.SphereGeometry(globeRadius - 0.5, 48, 48);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x060a14,
      transparent: true,
      opacity: 0.96,
    });
    const innerSphere = new THREE.Mesh(sphereGeo, sphereMat);
    globeGroup.add(innerSphere);

    // ── 2. Latitude & Longitude Graticule Rings ──
    const gridMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.07,
    });

    // Parallels (Latitudes)
    const latSteps = [-60, -30, 0, 30, 60];
    for (const lat of latSteps) {
      const ringRadius = globeRadius * Math.cos((lat * Math.PI) / 180);
      const ringY = globeRadius * Math.sin((lat * Math.PI) / 180);
      const ringPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        ringPts.push(new THREE.Vector3(Math.cos(theta) * ringRadius, ringY, Math.sin(theta) * ringRadius));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
      const ringLine = new THREE.Line(ringGeo, gridMat);
      globeGroup.add(ringLine);
    }

    // Meridians (Longitudes)
    const lonSteps = [0, 45, 90, 135, 180, 225, 270, 315];
    for (const lon of lonSteps) {
      const meridianPts: THREE.Vector3[] = [];
      for (let i = -64; i <= 64; i++) {
        const lat = (i / 64) * 90;
        meridianPts.push(latLonToVector3(lat, lon, globeRadius));
      }
      const mGeo = new THREE.BufferGeometry().setFromPoints(meridianPts);
      const mLine = new THREE.Line(mGeo, gridMat);
      globeGroup.add(mLine);
    }

    // ── 3. Continent Hairline Vector Outlines ──
    const coastMat = new THREE.LineBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.32,
    });

    for (const poly of CONTINENTS) {
      const pts: THREE.Vector3[] = [];
      for (const [lon, lat] of poly) {
        pts.push(latLonToVector3(lat, lon, globeRadius + 0.3));
      }
      const coastGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const coastLine = new THREE.Line(coastGeo, coastMat);
      globeGroup.add(coastLine);
    }

    // ── 4. Fibonacci Dot Cloud (Landmass Dotted Pattern) ──
    const numPoints = 2800;
    const landPositions: number[] = [];
    const oceanPositions: number[] = [];

    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / numPoints);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const lat = 90 - (phi * 180) / Math.PI;
      const lon = (((theta * 180) / Math.PI) % 360) - 180;

      const pos = latLonToVector3(lat, lon, globeRadius + 0.5);

      if (isPointInContinent(lon, lat)) {
        landPositions.push(pos.x, pos.y, pos.z);
      } else if (i % 5 === 0) {
        oceanPositions.push(pos.x, pos.y, pos.z);
      }
    }

    // Land Points Mesh (Warm White Glow)
    const landGeo = new THREE.BufferGeometry();
    landGeo.setAttribute('position', new THREE.Float32BufferAttribute(landPositions, 3));
    const landPointsMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 1.8,
      transparent: true,
      opacity: 0.65,
    });
    const landPoints = new THREE.Points(landGeo, landPointsMat);
    globeGroup.add(landPoints);

    // Ocean Points Mesh (Subtle hairline texture)
    const oceanGeo = new THREE.BufferGeometry();
    oceanGeo.setAttribute('position', new THREE.Float32BufferAttribute(oceanPositions, 3));
    const oceanPointsMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 1.1,
      transparent: true,
      opacity: 0.12,
    });
    const oceanPoints = new THREE.Points(oceanGeo, oceanPointsMat);
    globeGroup.add(oceanPoints);

    // ── 5. Awash River Basin Focal Target (Pulsing Center Marker) ──
    const awashPos = latLonToVector3(9.35, 40.35, globeRadius + 1.2);

    // Center illuminated pin
    const pinGeo = new THREE.SphereGeometry(1.6, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.position.copy(awashPos);
    globeGroup.add(pinMesh);

    // Target concentric ring
    const ringGeo = new THREE.RingGeometry(2.4, 3.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const pulseRing = new THREE.Mesh(ringGeo, ringMat);
    pulseRing.position.copy(awashPos);
    pulseRing.lookAt(awashPos.clone().multiplyScalar(2));
    globeGroup.add(pulseRing);

    // ── 6. Relief Corridor Arcs (Great-Circle 3D Bezier Curves) ──
    const arcLines: THREE.Line[] = [];
    for (const corr of CORRIDORS) {
      const vFrom = latLonToVector3(corr.from.lat, corr.from.lon, globeRadius + 0.5);
      const vTo = latLonToVector3(corr.to.lat, corr.to.lon, globeRadius + 0.5);

      // Midpoint projected outward to form an elevated parabolic arc
      const vMid = vFrom.clone().add(vTo).multiplyScalar(0.5);
      const distance = vFrom.distanceTo(vTo);
      vMid.setLength(globeRadius + distance * 0.28);

      const curve = new THREE.QuadraticBezierCurve3(vFrom, vMid, vTo);
      const curvePoints = curve.getPoints(40);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const arcMat = new THREE.LineBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.45,
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      globeGroup.add(arcLine);
      arcLines.push(arcLine);
    }

    // ── 7. Soft Atmosphere Outer Rim ──
    const atmoGeo = new THREE.SphereGeometry(globeRadius + 4, 32, 32);
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          gl_FragColor = vec4(0.96, 0.75, 0.45, 1.0) * intensity * 0.45;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    globeGroup.add(atmo);

    // ── 8. Interactive Mouse & Touch Drag Controls ──
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let velocity = { x: 0.0018, y: 0 };
    let lastInteractionTime = Date.now();

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      previousMousePosition = { x: clientX, y: clientY };
      velocity = { x: 0, y: 0 };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      lastInteractionTime = Date.now();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - previousMousePosition.x;
      const deltaY = clientY - previousMousePosition.y;

      globeGroup.rotation.y += deltaX * 0.005;
      globeGroup.rotation.x = Math.max(-0.6, Math.min(0.6, globeGroup.rotation.x + deltaY * 0.005));

      velocity = { x: deltaX * 0.003, y: deltaY * 0.003 };
      previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // ── 9. Animation & Render Loop ──
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Pulse target ring at Awash Basin
      const pulseScale = 1 + Math.sin(elapsed * 2.5) * 0.25;
      pulseRing.scale.set(pulseScale, pulseScale, 1);
      (pulseRing.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.cos(elapsed * 2.5) * 0.3;

      if (!isDragging) {
        // Natural inertia and slow ambient rotation
        if (Date.now() - lastInteractionTime > 1200) {
          velocity.x = velocity.x * 0.95 + 0.0015 * 0.05;
          velocity.y = velocity.y * 0.95;
        } else {
          velocity.x *= 0.96;
          velocity.y *= 0.96;
        }
        globeGroup.rotation.y += velocity.x;
        globeGroup.rotation.x += velocity.y;
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── 10. Responsive Resize Observer ──
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      renderer.dispose();
      if (dom.parentElement) {
        dom.parentElement.removeChild(dom);
      }
    };
  }, []);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

      {/* Interactive Helper Hint */}
      <div
        className={`pointer-events-none absolute top-4 left-4 text-[10px] text-slate-400 font-mono transition-opacity duration-300 ${
          isHovered ? 'opacity-80' : 'opacity-0'
        }`}
      >
        Drag to inspect basin
      </div>
    </div>
  );
}
export default RotatingGlobe;
