"use client";

import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useRef, useState, useCallback, useEffect } from "react";
import { Group, type Mesh, type MeshStandardMaterial } from "three";

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () =>
      setDark(document.documentElement.classList.contains("dark"));
    check();
    window.addEventListener("theme-change", check);
    return () => window.removeEventListener("theme-change", check);
  }, []);
  return dark;
}

/* ── Coin ── */

function Coin() {
  const ref = useRef<Mesh>(null);
  const mat = useRef<MeshStandardMaterial>(null);
  const target = useRef({ x: 0, y: 0 });
  const dark = useDarkMode();

  const onPointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      target.current = { x: e.point.x * 0.3, y: e.point.y * 0.3 };
    },
    [],
  );

  const onPointerLeave = useCallback(() => {
    target.current = { x: 0, y: 0 };
  }, []);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.4;
    ref.current.rotation.x +=
      (target.current.x - ref.current.rotation.x) * 2.5 * delta;
    ref.current.rotation.z +=
      (target.current.y - ref.current.rotation.z) * 2.5 * delta;
    if (mat.current) {
      mat.current.emissiveIntensity =
        0.3 + Math.sin(Date.now() * 0.002) * 0.15;
    }
  });

  const baseColor = dark ? "#34d399" : "#059669";
  const emissiveColor = dark ? "#10b981" : "#047857";

  return (
    <mesh
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <cylinderGeometry args={[1.1, 1.1, 0.18, 64]} />
      <meshStandardMaterial
        ref={mat}
        color={baseColor}
        metalness={0.85}
        roughness={0.15}
        emissive={emissiveColor}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

/* ── Floating decoration ── */

function FloatingDecor({
  position,
  color,
  speed = 1,
  size = 0.3,
}: {
  position: [number, number, number];
  color: string;
  speed?: number;
  size?: number;
}) {
  const ref = useRef<Mesh>(null);
  const dark = useDarkMode();

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * speed;
    ref.current.rotation.y += delta * speed * 0.7;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.8}>
      <mesh ref={ref} position={position}>
        <octahedronGeometry args={[size]} />
        <meshStandardMaterial
          color={dark ? "#2dd4bf" : color}
          metalness={0.7}
          roughness={0.2}
          transparent
          opacity={0.75}
        />
      </mesh>
    </Float>
  );
}

/* ── Ambient ring ── */

function AmbientRing() {
  const ref = useRef<Group>(null);
  const dark = useDarkMode();

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.15;
    ref.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.1) * 0.1;
  });

  return (
    <group ref={ref} rotation={[0.4, 0, 0]}>
      <mesh>
        <torusGeometry args={[2.2, 0.04, 16, 100]} />
        <meshStandardMaterial
          color={dark ? "#34d399" : "#059669"}
          transparent
          opacity={0.2}
          emissive={dark ? "#34d399" : "#059669"}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

/* ── Scene ── */

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-3, -2, 4]} intensity={0.3} />

      <Float speed={2} rotationIntensity={0.15} floatIntensity={1.2}>
        <Coin />
      </Float>

      <FloatingDecor
        position={[-2, 1.2, -0.5]}
        color="#0d9488"
        speed={1.2}
        size={0.35}
      />
      <FloatingDecor
        position={[1.8, -0.9, -0.3]}
        color="#059669"
        speed={0.8}
        size={0.25}
      />
      <FloatingDecor
        position={[0.5, 1.6, -1]}
        color="#2dd4bf"
        speed={1}
        size={0.2}
      />

      <AmbientRing />
    </>
  );
}

/* ── Exported canvas wrapper ── */

export function HeroScene({ className }: { className?: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      className={className}
      style={{ pointerEvents: "auto" }}
    >
      <Scene />
    </Canvas>
  );
}
