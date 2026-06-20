import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera, Sparkles } from "@react-three/drei";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Folder,
  MessageSquare,
  ShieldCheck,
  Upload
} from "lucide-react";
import type * as THREE from "three";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const heroSignals = [
  { label: "vendor-agreement.pdf", meta: "Uploaded", icon: Upload, tone: "default" as const },
  { label: "Final approval", meta: "Pending", icon: ShieldCheck, tone: "muted" as const },
  { label: "SHA-256 verified", meta: "Match", icon: AlertCircle, tone: "danger" as const },
  { label: "Reviewer note #4", meta: "In review", icon: MessageSquare, tone: "accent" as const }
];

function supportsWebGPUHero() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  const canvas = document.createElement("canvas");
  const hasWebGL = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  const hasWebGPU = "gpu" in navigator;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return hasWebGL && hasWebGPU && !reducedMotion;
}

class HeroSceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("SecureDoc hero scene fell back to CSS rendering.", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function VaultCore() {
  const group = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.16;
      group.current.rotation.x = Math.sin(clock.elapsedTime * 0.35) * 0.08;
    }

    if (scan.current) {
      scan.current.position.y = Math.sin(clock.elapsedTime * 1.35) * 1.25;
      scan.current.scale.x = 1.2 + Math.sin(clock.elapsedTime * 1.35) * 0.05;
    }
  });

  return (
    <group ref={group} position={[0.72, -0.03, -0.25]} scale={0.78}>
      <mesh castShadow receiveShadow position={[0.06, -0.06, -0.045]}>
        <boxGeometry args={[2.16, 1.34, 0.08]} />
        <meshBasicMaterial color="#d8cec7" transparent opacity={0.32} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[2.18, 1.36, 0.16]} />
        <meshStandardMaterial color="#faf7f5" metalness={0.05} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0, 0.105]}>
        <boxGeometry args={[1.82, 0.98, 0.035]} />
        <meshBasicMaterial color="#fdf2d6" transparent opacity={0.92} />
      </mesh>
      <mesh ref={scan} position={[0, 0, 0.16]}>
        <planeGeometry args={[2.26, 0.07]} />
        <meshBasicMaterial color="#9b2c2c" transparent opacity={0.36} />
      </mesh>
      <mesh position={[-0.56, 0.34, 0.16]}>
        <boxGeometry args={[0.78, 0.08, 0.026]} />
        <meshBasicMaterial color="#9b2c2c" />
      </mesh>
      <mesh position={[-0.32, 0.12, 0.16]}>
        <boxGeometry args={[1.18, 0.06, 0.026]} />
        <meshBasicMaterial color="#b45309" />
      </mesh>
      <mesh position={[-0.18, -0.12, 0.16]}>
        <boxGeometry args={[1.34, 0.05, 0.026]} />
        <meshBasicMaterial color="#f5e8d2" />
      </mesh>
      <mesh position={[0.64, -0.42, 0.17]}>
        <boxGeometry args={[0.5, 0.2, 0.045]} />
        <meshBasicMaterial color="#9b2c2c" />
      </mesh>
      {[-0.82, -0.38, 0.06, 0.5, 0.94].map((x) => (
        <mesh key={x} position={[x, 0.6, 0.15]}>
          <boxGeometry args={[0.18, 0.05, 0.025]} />
          <meshBasicMaterial color="#b45309" transparent opacity={0.72} />
        </mesh>
      ))}
    </group>
  );
}

function FloatingDocument({
  position,
  rotation,
  scale = 1,
  variant = "copy"
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
  variant?: "copy" | "upload" | "approval";
}) {
  const accentColor = variant === "approval" ? "#9b2c2c" : variant === "upload" ? "#b45309" : "#7f1d1d";

  return (
    <Float speed={1.25} rotationIntensity={0.18} floatIntensity={0.34}>
      <group position={position} rotation={rotation} scale={scale}>
        <mesh position={[0.05, -0.05, -0.025]}>
          <boxGeometry args={[0.94, 1.14, 0.025]} />
          <meshBasicMaterial color="#d8cec7" transparent opacity={0.28} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[0.9, 1.1, 0.04]} />
          <meshStandardMaterial color="#faf7f5" roughness={0.74} metalness={0.02} />
        </mesh>
        <mesh position={[-0.18, 0.35, 0.031]}>
          <boxGeometry args={[0.42, 0.055, 0.014]} />
          <meshBasicMaterial color={accentColor} />
        </mesh>
        <mesh position={[0.04, 0.17, 0.031]}>
          <boxGeometry args={[0.62, 0.05, 0.014]} />
          <meshBasicMaterial color="#b45309" />
        </mesh>
        <mesh position={[0.02, -0.01, 0.031]}>
          <boxGeometry args={[0.58, 0.04, 0.014]} />
          <meshBasicMaterial color="#f5e8d2" />
        </mesh>
        <mesh position={[0, -0.19, 0.031]}>
          <boxGeometry args={[0.52, 0.04, 0.014]} />
          <meshBasicMaterial color="#f5e8d2" transparent opacity={0.72} />
        </mesh>
        <mesh position={[0.22, -0.39, 0.034]}>
          <boxGeometry args={[0.22, 0.1, 0.018]} />
          <meshBasicMaterial color={variant === "approval" ? "#9b2c2c" : "#fef3c7"} />
        </mesh>
      </group>
    </Float>
  );
}

function HeroScene() {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      shadows
    >
      <PerspectiveCamera makeDefault position={[0, 0.2, 5.5]} fov={43} />
      <ambientLight intensity={1.5} />
      <pointLight position={[3.5, 4, 4]} intensity={35} color="#fef3c7" />
      <pointLight position={[-4, 1.5, 2]} intensity={20} color="#9b2c2c" />
      <Sparkles count={45} scale={[5, 2.8, 2.2]} size={2.3} speed={0.28} color="#b45309" opacity={0.45} />
      <VaultCore />
      <FloatingDocument position={[-0.95, 1.0, -0.18]} rotation={[0.06, 0.34, -0.13]} scale={0.76} variant="upload" />
      <FloatingDocument position={[1.92, 0.74, -0.34]} rotation={[-0.08, -0.34, 0.18]} scale={0.9} />
      <FloatingDocument position={[2.18, -1.08, -0.08]} rotation={[0.12, -0.26, 0.08]} scale={0.86} variant="approval" />
    </Canvas>
  );
}

function HeroCopy() {
  const goToApp = () => {
    window.location.href = "/app";
  };

  const scrollToDemo = () => {
    document.getElementById("demo-portal")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative z-10 mx-auto flex min-h-[720px] w-full max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="max-w-3xl">
        <Badge tone="accent" className="mb-5">
          SecureDoc approval platform
        </Badge>
        <motion.h1
          className="font-display text-5xl font-bold leading-[1.04] text-foreground sm:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          Approve documents with evidence.
        </motion.h1>
        <motion.p
          className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          Upload, review, and approve documents with role-based access, SHA-256 fingerprints, version
          history, signed receipts, and a tamper-evident audit trail.
        </motion.p>
        <motion.div
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Button size="lg" onClick={goToApp}>
            Open the demo app
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={scrollToDemo}>
            See how it works
          </Button>
        </motion.div>
        <p className="mt-7 max-w-2xl text-sm leading-6 text-muted-foreground">
          Built for legal, compliance, security, and operations teams that need a real approval trail.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2.5 lg:hidden">
          {heroSignals.map((signal, index) => (
            <Card
              key={signal.label}
              className={cn("min-w-0 bg-card/88 p-3 shadow-warm backdrop-blur", index > 1 && "hidden sm:block")}
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <signal.icon aria-hidden="true" className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">{signal.label}</p>
                  <Badge tone={signal.tone} className="mt-2 px-2 text-[10px]">
                    {signal.meta}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroSignalCards({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10 hidden lg:block", className)}>
      {heroSignals.map((signal, index) => (
        <motion.div
          key={signal.label}
          className={cn(
            "absolute w-60 rounded-lg border border-border bg-card/90 p-4 shadow-warm backdrop-blur",
            index === 0 && "right-[7%] top-[20%]",
            index === 1 && "right-[16%] top-[39%]",
            index === 2 && "right-[6%] bottom-[28%]",
            index === 3 && "right-[30%] bottom-[12%]"
          )}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
          transition={{ duration: 4.2, repeat: Infinity, delay: index * 0.35, ease: "easeInOut" }}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary">
              <signal.icon aria-hidden="true" className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{signal.label}</p>
              <Badge tone={signal.tone} className="mt-2">
                {signal.meta}
              </Badge>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function FallbackHero() {
  return (
    <section className="relative isolate overflow-hidden bg-background" aria-label="SecureDoc hero">
      <div className="absolute inset-0 warm-grid opacity-70" />
      <motion.div
        aria-hidden="true"
        className="scanline-mask absolute left-0 right-0 top-20 h-24"
        animate={{ y: [0, 520, 0], opacity: [0.25, 0.62, 0.25] }}
        transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute right-0 top-0 h-[520px] w-[520px] rounded-full bg-accent/55 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[420px] w-[420px] rounded-full bg-secondary/70 blur-3xl" />
      <HeroCopy />
      <HeroSignalCards />
      <div className="absolute bottom-8 right-4 z-10 hidden w-[360px] rounded-lg border border-border bg-card/90 p-4 shadow-warm backdrop-blur md:block lg:right-[8%]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-label text-[11px] font-semibold uppercase text-muted-foreground">Integrity scan</p>
            <p className="mt-1 font-semibold text-foreground">Vendor Agreement v2</p>
          </div>
          <Badge>Verified</Badge>
        </div>
        <div className="mt-4 space-y-2">
          {[
            ["SHA-256 match", CheckCircle],
            ["Reviewer assigned", Clock],
            ["Final approval", ShieldCheck]
          ].map(([label, Icon]) => (
            <div key={label as string} className="flex items-center gap-3 rounded-md bg-background p-3">
              <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{label as string}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HeroFuturistic() {
  const [canRenderScene, setCanRenderScene] = useState(false);

  useEffect(() => {
    setCanRenderScene(supportsWebGPUHero());
  }, []);

  if (!canRenderScene) {
    return <FallbackHero />;
  }

  return (
    <HeroSceneBoundary fallback={<FallbackHero />}>
      <section className="relative isolate overflow-hidden bg-background" aria-label="SecureDoc hero">
        <div className="absolute inset-0 warm-grid opacity-55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_42%,color-mix(in_srgb,var(--accent)_72%,transparent),transparent_34%),radial-gradient(circle_at_30%_80%,color-mix(in_srgb,var(--secondary)_82%,transparent),transparent_33%)]" />
        <div className="absolute inset-y-0 right-0 w-full lg:w-[54%] xl:w-[50%]">
          <HeroScene />
        </div>
        <motion.div
          aria-hidden="true"
          className="scanline-mask absolute left-0 right-0 top-16 z-[1] h-20"
          animate={{ y: [0, 560, 0], opacity: [0.18, 0.5, 0.18] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <HeroCopy />
        <HeroSignalCards />
      </section>
    </HeroSceneBoundary>
  );
}
