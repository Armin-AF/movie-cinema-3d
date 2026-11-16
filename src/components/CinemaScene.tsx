import { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  MeshReflectorMaterial,
  Sparkles,
  useTexture,
  useCursor,
} from '@react-three/drei';
import * as THREE from 'three';
import type { MovieEntry } from '../types/movie';

interface PosterMonolithProps {
  movie: MovieEntry;
  index: number;
  activeIndex: number;
  isPortrait: boolean;
  onSelect: (index: number) => void;
  onInspect: (movie: MovieEntry) => void;
}

function PosterMonolith({
  movie,
  index,
  activeIndex,
  isPortrait,
  onSelect,
  onInspect,
}: PosterMonolithProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const posterPath = `${import.meta.env.BASE_URL}${movie.poster.replace(/^\//, '')}`;
  const texture = useTexture(posterPath);
  texture.colorSpace = THREE.SRGBColorSpace;

  const isFocused = index === activeIndex;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const offset = index - activeIndex;
    const spacing = isPortrait ? 2.65 : 3.15;

    const targetX = offset * spacing;
    const targetZ = isFocused ? 0.55 : -Math.abs(offset) * 0.45;
    const floatY = Math.sin(state.clock.elapsedTime * 1.4 + index * 0.9) * 0.05;
    const baseHeight = isPortrait ? 0.62 : 0.25;
    const targetY = (isFocused ? baseHeight : baseHeight - 0.12) + floatY;

    const targetRotY = THREE.MathUtils.clamp(-offset * 0.16, -0.55, 0.55);
    const focusScale = isPortrait ? 0.9 : 1.04;
    const idleScale = isPortrait ? 0.76 : 0.88;
    const targetScale = isFocused
      ? hovered
        ? focusScale + 0.03
        : focusScale
      : hovered
        ? idleScale + 0.05
        : idleScale;

    const damp = 1 - Math.exp(-7 * delta);
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, damp);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, damp);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, damp);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, damp);

    const nextScale = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, damp);
    groupRef.current.scale.setScalar(nextScale);
  });

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (isFocused) {
          onInspect(movie);
        } else {
          onSelect(index);
        }
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2.24, 3.34, 0.09]} />
        <meshStandardMaterial
          color={isFocused ? '#2a2218' : '#12141c'}
          metalness={0.75}
          roughness={0.25}
          emissive={isFocused ? '#e2b06e' : '#000000'}
          emissiveIntensity={isFocused ? 0.18 : 0}
        />
      </mesh>

      <mesh position={[0, 0, 0.048]}>
        <planeGeometry args={[2.16, 3.26]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

function ResponsiveStage({
  movies,
  activeIndex,
  onSelectIndex,
  onInspectMovie,
}: CinemaSceneProps) {
  const { viewport } = useThree();
  const isPortrait = viewport.aspect < 0.85;

  useFrame((state, delta) => {
    const damp = 1 - Math.exp(-4 * delta);
    const targetZ = isPortrait ? 7.2 : 5.8;
    const targetX = isPortrait ? 0 : state.pointer.x * 0.55;
    const targetY = 0.45 + (isPortrait ? 0 : state.pointer.y * 0.25);

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, damp);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, damp);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, damp);
    state.camera.lookAt(0, isPortrait ? 0.42 : 0.2, 0);
  });

  return (
    <>
      <color attach="background" args={['#07080b']} />
      <fog attach="fog" args={['#07080b', 7, 21]} />

      <ambientLight intensity={0.65} />
      <spotLight
        position={[0, 6.5, 5]}
        angle={0.45}
        penumbra={0.85}
        intensity={38}
        color="#ffe3bd"
      />
      <pointLight position={[-5, 2, 3]} intensity={6} color="#6b8cce" />
      <pointLight position={[5, 2, 3]} intensity={6} color="#e2b06e" />

      <Sparkles
        count={isPortrait ? 55 : 90}
        scale={[16, 6, 8]}
        size={1.6}
        speed={0.25}
        opacity={0.45}
        color="#e2b06e"
      />

      {movies.map((movie, idx) => (
        <PosterMonolith
          key={movie.slug}
          movie={movie}
          index={idx}
          activeIndex={activeIndex}
          isPortrait={isPortrait}
          onSelect={onSelectIndex}
          onInspect={onInspectMovie}
        />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.65, 0]}>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={512}
          mixBlur={1}
          mixStrength={35}
          roughness={0.85}
          depthScale={1.1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0b0d13"
          metalness={0.5}
          mirror={0.35}
        />
      </mesh>
    </>
  );
}

interface CinemaSceneProps {
  movies: MovieEntry[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onInspectMovie: (movie: MovieEntry) => void;
}

export function CinemaScene(props: CinemaSceneProps) {
  return (
    <div className="canvas-wrapper">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.45, 5.8], fov: 44 }}
        gl={{ antialias: true }}
      >
        <ResponsiveStage {...props} />
      </Canvas>
    </div>
  );
}