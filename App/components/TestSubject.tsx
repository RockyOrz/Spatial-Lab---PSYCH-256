import React, { useRef, useLayoutEffect } from 'react';
import { Center, Edges } from '@react-three/drei';
import { ShapeType } from '../types';

interface TestSubjectProps {
  shape: ShapeType;
  rotation: [number, number, number];
  variant?: number; // 0 = Standard (Correct), 1-4 = Distractors (Structural variations)
}

// Single uniform material for all objects (Lighter Slate for better visibility)
const UniformMaterial = () => (
  <meshStandardMaterial 
    color="#cbd5e1" 
    roughness={0.4} 
    metalness={0.1}
  />
);

// Helper component for consistent blocks with edges
const Block = ({ position }: { position: [number, number, number] }) => (
  <mesh position={position}>
    <boxGeometry args={[1, 1, 1]} />
    <UniformMaterial />
    <Edges color="black" threshold={15} />
  </mesh>
);

export const TestSubject: React.FC<TestSubjectProps> = ({ shape, rotation, variant = 0 }) => {
  const groupRef = useRef<any>(null);

  // Instant rotation update for precise capturing
  useLayoutEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.set(
        rotation[0] * (Math.PI / 180),
        rotation[1] * (Math.PI / 180),
        rotation[2] * (Math.PI / 180)
      );
    }
  }, [rotation]);

  const renderShape = () => {
    // Variant 0 is the "Correct" shape.
    // Variants 1-4 are "Distractors" - they look similar but have 1 feature changed.

    switch (shape) {
      case ShapeType.HIGH_SYMMETRY:
        // "Chiral Propeller"
        // 4 Arms. 
        // Standard (0): Top(+X), Bottom(-X), Front(-Y), Back(+Y) bends relative to axis.
        return (
          <group>
            {/* Center Hub */}
            <Block position={[0, 0, 0]} />
            
            {/* Arm +Y (Top) */}
            <Block position={[0, 1, 0]} />
            {/* Distractor 1: Top arm bends -X instead of +X */}
            <Block position={[variant === 1 ? -1 : 1, 1, 0]} />

            {/* Arm -Y (Bottom) */}
            <Block position={[0, -1, 0]} />
            {/* Distractor 2: Bottom arm bends +X instead of -X */}
            <Block position={[variant === 2 ? 1 : -1, -1, 0]} />

            {/* Arm +Z (Front) */}
            <Block position={[0, 0, 1]} />
            {/* Distractor 3: Front arm bends +Y instead of -Y */}
            <Block position={[0, variant === 3 ? 1 : -1, 1]} />

            {/* Arm -Z (Back) */}
            <Block position={[0, 0, -1]} />
            {/* Distractor 4: Back arm bends -Y instead of +Y */}
            <Block position={[0, variant === 4 ? -1 : 1, -1]} />
          </group>
        );

      case ShapeType.LOW_SYMMETRY:
        // "Shepard-Metzler Snake"
        return (
          <group>
             {/* Base Vertical Column */}
            <Block position={[0, 0, 0]} />
            <Block position={[0, 1, 0]} />
            <Block position={[0, 2, 0]} />

            {/* Side Leg 1 (+X) */}
            <Block position={[1, 0, 0]} />
            {/* Distractor 1: Leg 1 tip bends UP (+Y) instead of extending +X */}
            {variant === 1 ? (
               <Block position={[1, 1, 0]} /> 
            ) : (
               <Block position={[2, 0, 0]} />
            )}

            {/* Side Leg 2 (+Z, from top) */}
            <Block position={[0, 2, 1]} />
            <Block position={[0, 2, 2]} />
            
            {/* Distractor 2: Leg 2 tip bends DOWN (-Y) instead of right (+X) */}
            {variant === 2 ? (
                <Block position={[0, 1, 2]} />
            ) : (
                /* Distractor 3: Leg 2 tip bends LEFT (-X) instead of right (+X) */
                variant === 3 ? (
                    <Block position={[-1, 2, 2]} />
                ) : (
                    <Block position={[1, 2, 2]} /> // Standard
                )
            )}
            
            {/* Distractor 4: Add an extra block at base -Z to change topology */}
             {variant === 4 && <Block position={[0, 0, -1]} />}
          </group>
        );
        
      default:
        return null;
    }
  };

  return (
    <group ref={groupRef}>
      <Center>
        {renderShape()}
      </Center>
    </group>
  );
};
