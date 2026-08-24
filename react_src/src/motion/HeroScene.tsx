import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import { useReducedMotion } from 'framer-motion';
import { MOTION } from '@/motion/config';

export function HeroScene() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="pointer-events-none absolute inset-0 -z-0 opacity-80">
      <Canvas camera={{ position: [0, 0, 4.4], fov: 42 }} dpr={[1, 1.6]}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[3, 4, 5]} intensity={1.15} />
        {reduceMotion ? (
          <mesh>
            <icosahedronGeometry args={[1.2, 1]} />
            <meshStandardMaterial
              color={MOTION.primary}
              roughness={0.25}
              metalness={0.15}
            />
          </mesh>
        ) : (
          <Float speed={1.8} rotationIntensity={0.55} floatIntensity={0.7}>
            <mesh>
              <icosahedronGeometry args={[1.2, 1]} />
              <MeshDistortMaterial
                color={MOTION.primary}
                distort={0.32}
                speed={1.6}
                roughness={0.25}
                metalness={0.15}
              />
            </mesh>
          </Float>
        )}
      </Canvas>
    </div>
  );
}
