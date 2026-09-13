"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { Group, type Mesh } from "three";

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

export const BAR_COUNT = 6;

export interface ChartBar {
  height: number;
}

/** Deterministic, data-free bar heights for the decorative chart bars. */
export function createChartBars(
  count: number = BAR_COUNT,
  random: () => number = Math.random,
): ChartBar[] {
  return Array.from({ length: count }, () => ({
    height: 0.6 + random() * 1.4,
  }));
}

function FloatingBars({ bars }: { bars: ChartBar[] }) {
  const groupRef = useRef<Group>(null);
  const meshes = useRef<Array<Mesh | null>>([]);
  const pointer = useRef({ x: 0, y: 0 });
  const dark = useDarkMode();

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    group.rotation.y += delta * 0.25;
    group.rotation.x += (pointer.current.y * -0.08 - group.rotation.x) * delta * 1.6;
    group.rotation.z += (pointer.current.x * 0.06 - group.rotation.z) * delta * 1.6;

    meshes.current.forEach((mesh, i) => {
      if (!mesh) return;
      const target = bars[i % bars.length].height + Math.sin(t * 0.9 + i) * 0.08;
      mesh.scale.y += (target - mesh.scale.y) * Math.min(1, delta * 2.4);
    });
  });

  const barColor = dark ? "#34d399" : "#059669";
  const barAccent = dark ? "#10b981" : "#047857";

  return (
    <group ref={groupRef} position={[0, -0.35, 0]}>
      {bars.map((bar, i) => (
        <mesh
          key={i}
          position={[(i - (bars.length - 1) / 2) * 0.52, 0.45, 0]}
          ref={(el) => {
            meshes.current[i] = el;
          }}
        >
          <boxGeometry args={[0.3, 1, 0.3]} />
          <meshStandardMaterial
            color={barColor}
            emissive={barAccent}
            emissiveIntensity={0.35}
            metalness={0.55}
            roughness={0.22}
          />
        </mesh>
      ))}
    </group>
  );
}

function OrbitRing() {
  const dark = useDarkMode();
  return (
    <Float speed={1.6} rotationIntensity={0.35} floatIntensity={0.9}>
      <mesh rotation={[0.6, 0.3, 0]}>
        <torusGeometry args={[2.15, 0.045, 16, 100]} />
        <meshStandardMaterial
          color={dark ? "#2dd4bf" : "#0d9488"}
          transparent
          opacity={0.35}
          emissive={dark ? "#2dd4bf" : "#0d9488"}
          emissiveIntensity={0.3}
        />
      </mesh>
    </Float>
  );
}

function Scene({ bars }: { bars: ChartBar[] }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-3, -2, 4]} intensity={0.25} />
      <FloatingBars bars={bars} />
      <OrbitRing />
    </>
  );
}

/** Decorative 3D accent used on the Reports & Insights heroes. */
export function ChartScene({ className }: { className?: string }) {
  const [bars] = useState<ChartBar[]>(() => createChartBars());
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      className={className}
      style={{ pointerEvents: "none" }}
    >
      <Scene bars={bars} />
    </Canvas>
  );
}