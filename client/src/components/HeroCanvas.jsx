import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, Float } from '@react-three/drei';
import * as THREE from 'three';

const COLORS = ['#5b8dee', '#a78bfa', '#f472b6', '#34d399', '#38bdf8'];
const N = 38;
const SPREAD = 9;
const CONNECT_DIST = 2.8;

function Network() {
  const groupRef = useRef();

  const { positions, bonds } = useMemo(() => {
    const rng = () => (Math.random() - 0.5) * SPREAD;
    const positions = Array.from({ length: N }, () => [rng(), rng(), rng()]);
    const bonds = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const [ax, ay, az] = positions[i];
        const [bx, by, bz] = positions[j];
        const d = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2);
        if (d < CONNECT_DIST) bonds.push([positions[i], positions[j]]);
      }
    }
    return { positions, bonds };
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.055;
    groupRef.current.rotation.x = Math.sin(t * 0.032) * 0.14;
  });

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => (
        <Float
          key={i}
          speed={0.6 + (i % 5) * 0.2}
          rotationIntensity={0}
          floatIntensity={0.4}
        >
          <mesh position={pos}>
            <sphereGeometry args={[i % 6 === 0 ? 0.18 : 0.09, 10, 10]} />
            <meshStandardMaterial
              color={COLORS[i % COLORS.length]}
              emissive={COLORS[i % COLORS.length]}
              emissiveIntensity={0.45}
              roughness={0.15}
              metalness={0.65}
            />
          </mesh>
        </Float>
      ))}
      {bonds.map(([a, b], i) => (
        <Line
          key={i}
          points={[a, b]}
          color="#818cf8"
          lineWidth={0.7}
          transparent
          opacity={0.2}
        />
      ))}
    </group>
  );
}

export default function HeroCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 14], fov: 48 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.55} />
      <pointLight position={[10, 10, 10]} intensity={2.5} color="#5b8dee" />
      <pointLight position={[-10, -6, -5]} intensity={2} color="#a78bfa" />
      <pointLight position={[0, -12, 10]} intensity={1} color="#f472b6" />
      <Network />
    </Canvas>
  );
}
