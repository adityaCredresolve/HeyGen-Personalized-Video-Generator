import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, MeshDistortMaterial, Sparkles, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1.5, 64, 64]}>
        <MeshDistortMaterial
          color="#8b5cf6" // Purple-500
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      <Sparkles count={100} scale={5} size={2} speed={0.4} opacity={0.5} color="#c084fc" />
    </Float>
  );
}

interface ProcessingScreenProps {
  status: "submitting" | "styling" | "idle" | "completed" | "failed";
  estimatedTime?: string;
  isLongVideo?: boolean;
  videoType?: "avatar" | "remotion";
}

export function ProcessingScreen({ status, estimatedTime, isLongVideo, videoType = "avatar" }: ProcessingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[400px] bg-background/50 rounded-xl border border-border overflow-hidden relative">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#4f46e5" />
          <AnimatedSphere />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      <div className="z-10 mt-32 flex flex-col items-center gap-4">
        <div className="rounded-full border border-primary/25 bg-background/75 px-4 py-2 backdrop-blur-md shadow-xl">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        </div>
        <div className="rounded-full border border-border/50 bg-background/70 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-md">
          {status === "styling" ? "Finalizing" : videoType === "remotion" ? "ScriptMotion" : "Processing"}
        </div>
      </div>
    </div>
  );
}
