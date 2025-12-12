export enum ShapeType {
  HIGH_SYMMETRY = 'HIGH_SYMMETRY', // Rotational symmetry but chiral
  LOW_SYMMETRY = 'LOW_SYMMETRY'    // Irregular Shepard-Metzler object
}

export enum RotationComplexity {
  ONE_AXIS = 'ONE_AXIS',
  TWO_AXIS = 'TWO_AXIS'
}

export enum RotationMagnitude {
  LOW = 'LOW',   // ~30-60 degrees
  HIGH = 'HIGH'  // ~100-150 degrees
}

export enum ImageQuality {
  STANDARD = 'STANDARD',
  HIGH = 'HIGH',
  AI_OPTIMIZED = 'AI_OPTIMIZED'
}

export interface RotationState {
  x: number;
  y: number;
  z: number;
}

export interface ExperimentConfig {
  shape: ShapeType;
  complexity: RotationComplexity;
  magnitude: RotationMagnitude;
}

export interface LlmResponse {
  answer: 'A' | 'B' | 'C';
  reasoning: string;
  confidence: number; // 0-100
}

// Augment JSX namespace to recognize React Three Fiber intrinsic elements
// And add AIStudio interface for global window.aistudio property
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      group: any;
      meshStandardMaterial: any;
      boxGeometry: any;
      ambientLight: any;
      pointLight: any;
      color: any;
    }
  }
  
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}
