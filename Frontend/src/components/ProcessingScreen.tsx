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
}

export function ProcessingScreen({ status, estimatedTime, isLongVideo }: ProcessingScreenProps) {
  const getStatusMessage = () => {
    if (status === "submitting") return "Generating AI Video...";
    if (status === "styling") return "Applying captions & branding...";
    return "Processing...";
  };

  const getSubMessage = () => {
    if (isLongVideo && status === "submitting") {
      return "Your script is quite long, so this might take a bit more time. Feel free to grab a coffee!";
    }
    return `Estimated time: ~${estimatedTime || "3"} mins. We will notify you when it's ready.`;
  };

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
      
      <div className="z-10 bg-background/80 backdrop-blur-md px-8 py-6 rounded-2xl border border-border/50 shadow-xl text-center max-w-sm mt-32">
        <h3 className="font-display text-xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          {getStatusMessage()}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {getSubMessage()}
        </p>
      </div>
    </div>
  );
}
