"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { Group, InstancedMesh, Object3D } from "three";

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

export const PARTICLE_COUNT = 56;

export const FIELD = {
  width: 16,
  height: 9,
  depth: 6,
} as const;

export type Particle = {
  x: number;
  y: number;
  z: number;
  scale: number;
  speed: number;
  phase: number;
};

export function createParticles(
  count: number,
  random: () => number = Math.random,
): Particle[] {
  return Array.from({ length: count }, () => ({
    x: (random() - 0.5) * FIELD.width,
    y: (random() - 0.5) * FIELD.height,
    z: (random() - 0.5) * FIELD.depth,
    scale: 0.5 + random() * 1.2,
    speed: 0.3 + random() * 0.5,
    phase: random() * Math.PI * 2,
  }));
}

function usePointerParallax() {
  const groupRef = useRef<Group>(null);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      target.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const k = 1 - Math.exp(-delta * 1.8);
    const targetX = -target.current.y * 0.06;
    const targetY = target.current.x * 0.07;
    group.rotation.x += (targetX - group.rotation.x) * k;
    group.rotation.y += (targetY - group.rotation.y) * k;
  });

  return groupRef;
}

const dummy = new Object3D();

function ParticleField({ dark }: { dark: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  const particles = useMemo(() => createParticles(PARTICLE_COUNT), []);

  useFrame(({ clock }) => {
    const instanced = mesh.current;
    if (!instanced) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      const sway = Math.sin(t * p.speed + p.phase);
      const bob = Math.cos(t * p.speed * 0.8 + p.phase);
      dummy.position.set(
        p.x + sway * 0.6,
        p.y + bob * 0.7,
        p.z + sway * 0.3,
      );
      dummy.scale.setScalar(p.scale);
      dummy.rotation.set(sway * 0.35, bob * 0.35, 0);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, particles.length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        color={dark ? "#34d399" : "#059669"}
        emissive={dark ? "#2dd4bf" : "#0d9488"}
        emissiveIntensity={0.5}
        metalness={0.1}
        roughness={0.3}
        transparent
        opacity={dark ? 0.55 : 0.4}
      />
    </instancedMesh>
  );
}

function AmbientOrb({
  position,
  scale,
  color,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
}) {
  return (
    <Float speed={1.4} rotationIntensity={0.5} floatIntensity={1.4}>
      <mesh position={position} scale={scale}>
        <icosahedronGeometry args={[1, 8]} />
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          transparent
          opacity={0.16}
          roughness={0.35}
          distort={0.4}
          speed={1.5}
        />
      </mesh>
    </Float>
  );
}

function Scene() {
  const dark = useDarkMode();
  const parallaxRef = usePointerParallax();

  const primary = dark ? "#34d399" : "#059669";
  const accent = dark ? "#2dd4bf" : "#0d9488";

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 6]} intensity={0.8} />
      <pointLight position={[-6, -4, 3]} intensity={2} color={accent} />

      <group ref={parallaxRef}>
        <ParticleField dark={dark} />
        <AmbientOrb position={[-5.5, 3.4, -3]} scale={2.3} color={primary} />
        <AmbientOrb position={[6, -3.6, -4]} scale={3.1} color={accent} />
        <AmbientOrb position={[0.5, -5.2, -2]} scale={2.6} color={primary} />
      </group>
    </>
  );
}

export function BackgroundScene({ className }: { className?: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      className={className}
      style={{ pointerEvents: "none" }}
    >
      <Scene />
    </Canvas>
  );
}