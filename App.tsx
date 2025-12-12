import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Stage, OrbitControls } from '@react-three/drei';
import { TestSubject } from './components/TestSubject';
import { ShapeType, RotationState, LlmResponse, RotationComplexity, RotationMagnitude, ImageQuality } from './types';
import { analyzeSpatialTask } from './services/geminiService';
import JSZip from 'jszip';
import { 
  Dna,
  Play,
  BrainCircuit, 
  RotateCcw, 
  FlaskConical,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Move3d,
  Download,
  Camera,
  Settings2,
  ChevronRight,
  Layers,
  Eye,
  Grid2X2,
  Repeat,
  Loader2,
  Image as ImageIcon,
  FolderArchive,
  Key
} from 'lucide-react';

// --- Helper Component for Screen Capture ---
const SceneCapture = ({ id, quality, onCapture }: { id: string, quality: ImageQuality, onCapture: (blob: string) => void }) => {
  const { gl, scene, camera } = useThree();
  
  useEffect(() => {
    const handleCapture = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === id) {
        
        // --- 1. Resolution Boost Strategy ---
        // Store original renderer settings
        const originalPixelRatio = gl.getPixelRatio();
        const cssWidth = gl.domElement.clientWidth;
        const cssHeight = gl.domElement.clientHeight;

        // Determine target density for capture
        // We boost the internal resolution regardless of screen size to ensure clear downloads.
        // Screen canvases are often small (e.g., 300px), so 1x or 2x DPR is insufficient for good analysis/viewing.
        let capturePixelRatio = Math.max(originalPixelRatio, 2); 

        if (quality === ImageQuality.HIGH) {
            capturePixelRatio = 4; // High density (e.g. 300px * 4 = 1200px)
        } else if (quality === ImageQuality.STANDARD) {
            capturePixelRatio = 3; // Enhanced (e.g. 300px * 3 = 900px)
        } else {
             capturePixelRatio = 2; // Base for AI Optimized
        }

        // Apply temporary boost
        gl.setPixelRatio(capturePixelRatio);
        gl.setSize(cssWidth, cssHeight, false); // Update drawing buffer size, keep CSS size
        
        // Force a render to the resized buffer
        gl.render(scene, camera);
        
        try {
          // --- 2. Process Capture ---
          
          // If High Quality, return the raw high-res buffer immediately
          if (quality === ImageQuality.HIGH) {
             const dataUrl = gl.domElement.toDataURL('image/png', 1.0);
             onCapture(dataUrl);
             
             // Restore and exit
             gl.setPixelRatio(originalPixelRatio);
             gl.setSize(cssWidth, cssHeight, false);
             return;
          }

          const tempCanvas = document.createElement('canvas');
          let w = gl.domElement.width;
          let h = gl.domElement.height;
          
          // AI Optimized: Resize to 448px (efficient for LLM vision tokens)
          if (quality === ImageQuality.AI_OPTIMIZED) {
            const MAX_SIZE = 448;
            if (w > h) {
                if (w > MAX_SIZE) {
                    h = h * (MAX_SIZE / w);
                    w = MAX_SIZE;
                }
            } else {
                if (h > MAX_SIZE) {
                    w = w * (MAX_SIZE / h);
                    h = MAX_SIZE;
                }
            }
          }
          // Standard: Allow larger images (up to 1600px) for better visibility while keeping reasonable file size
          else if (quality === ImageQuality.STANDARD) {
             const MAX_SIZE = 1600; 
             if (w > MAX_SIZE || h > MAX_SIZE) {
                 const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h);
                 w = w * ratio;
                 h = h * ratio;
             }
          }

          tempCanvas.width = w;
          tempCanvas.height = h;
          const ctx = tempCanvas.getContext('2d');
          
          if (ctx) {
            // Apply Post-Processing based on Quality
            if (quality === ImageQuality.AI_OPTIMIZED) {
               // Stronger contrast for machine vision
               ctx.filter = 'contrast(1.3) brightness(1.05) grayscale(0.1)';
            } else if (quality === ImageQuality.STANDARD) {
               // Mild enhancement
               ctx.filter = 'contrast(1.05)';
            }
            
            // Draw from the boosted WebGL canvas to the temp canvas
            ctx.drawImage(gl.domElement, 0, 0, w, h);
            
            // Encode
            const mimeType = 'image/jpeg';
            const qualityValue = quality === ImageQuality.AI_OPTIMIZED ? 0.65 : 0.90;
            
            const dataUrl = tempCanvas.toDataURL(mimeType, qualityValue);
            onCapture(dataUrl);
          } else {
             // Fallback if context fails
             onCapture(gl.domElement.toDataURL('image/png'));
          }

        } catch (err) {
          console.warn("Capture processing failed, falling back to raw capture", err);
          onCapture(gl.domElement.toDataURL('image/png'));
        } finally {
            // --- 3. Restore Renderer State ---
            gl.setPixelRatio(originalPixelRatio);
            gl.setSize(cssWidth, cssHeight, false);
        }
      }
    };
    window.addEventListener('trigger-capture', handleCapture);
    return () => window.removeEventListener('trigger-capture', handleCapture);
  }, [gl, scene, camera, onCapture, id, quality]);

  return null;
};

// --- Helper Component for Tooltips ---
const LabelWithTooltip = ({ label, description, children }: { label: string, description: string, children?: React.ReactNode }) => (
  <div className="group relative flex flex-col items-start mb-1.5 w-full z-20">
    {label && (
      <div className="flex items-center gap-2 w-max mb-1">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider cursor-help flex items-center gap-1.5 transition-colors group-hover:text-blue-300">
          {label}
          <Info size={10} className="opacity-40 group-hover:opacity-100 transition-opacity" />
        </label>
      </div>
    )}
    <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-md text-[11px] leading-relaxed text-slate-300 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 translate-y-1 group-hover:translate-y-0">
      {description}
      <div className="absolute left-3 -bottom-1 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
    </div>
    {children}
  </div>
);

// --- Types for Active Trial State ---
interface TargetObject {
  id: string;      // "A", "B", "C"
  rotation: RotationState;
  variant: number; // 0 = Correct, 1-4 = Distractors
  isCorrect: boolean;
}

interface ActiveTrialData {
  shape: ShapeType;
  complexity: RotationComplexity;
  magnitude: RotationMagnitude;
  refRotation: RotationState;
  targets: TargetObject[];
  correctTargetId: string; // "A", "B", "C"
}

// Data structure to hold a completed trial for batch processing
interface StoredTrialData {
  trialIndex: number;
  metadata: any;
  images: { name: string; data: string }[];
}

export default function App() {
  // --- 1. Experiment Configuration State (Sidebar) ---
  const [configShape, setConfigShape] = useState<ShapeType>(ShapeType.HIGH_SYMMETRY);
  const [configComplexity, setConfigComplexity] = useState<RotationComplexity>(RotationComplexity.ONE_AXIS);
  const [configMagnitude, setConfigMagnitude] = useState<RotationMagnitude>(RotationMagnitude.LOW);
  const [configQuality, setConfigQuality] = useState<ImageQuality>(ImageQuality.AI_OPTIMIZED);

  // --- 2. Active Trial State (Canvas & Analysis) ---
  const [activeTrial, setActiveTrial] = useState<ActiveTrialData>({
    shape: ShapeType.HIGH_SYMMETRY,
    complexity: RotationComplexity.ONE_AXIS,
    magnitude: RotationMagnitude.LOW,
    refRotation: { x: 0, y: 0, z: 0 },
    targets: [],
    correctTargetId: 'A'
  });
  
  // --- 3. Operational State ---
  const [capturedRef1, setCapturedRef1] = useState<string | null>(null);
  const [capturedRef2, setCapturedRef2] = useState<string | null>(null);
  const [capturedTargets, setCapturedTargets] = useState<string[]>([null!, null!, null!]);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [llmResult, setLlmResult] = useState<LlmResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // API Key State
  const [hasApiKey, setHasApiKey] = useState(false);

  // --- 4. Batch Processing State ---
  const [batchSize, setBatchSize] = useState<number>(5);
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number>(0);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  
  // Batch Accumulator
  const batchDataRef = useRef<StoredTrialData[]>([]);

  // Initialize first trial on mount and check API key
  useEffect(() => {
    generateTrial();
    checkApiKeyStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const checkApiKeyStatus = async () => {
    if (window.aistudio) {
      const has = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(has);
    } else {
      // Fallback for local env
      setHasApiKey(!!process.env.API_KEY);
    }
  };

  const handleConnectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // Assume success based on guidelines
        setHasApiKey(true);
        setAnalysisError(null);
      } catch (err) {
        console.error("Key selection failed", err);
      }
    }
  };

  const generateTrial = () => {
    setIsGenerating(true);
    setAnalysisError(null);
    
    setTimeout(() => {
        // 1. Determine Parameters
        const minDeg = configMagnitude === RotationMagnitude.LOW ? 30 : 110;
        const maxDeg = configMagnitude === RotationMagnitude.LOW ? 70 : 150;
        
        const generateRotation = (base: RotationState) => {
          const getDelta = () => {
            const dir = Math.random() > 0.5 ? 1 : -1;
            return dir * (Math.floor(Math.random() * (maxDeg - minDeg + 1)) + minDeg);
          };

          let newRot = { ...base };
          if (configComplexity === RotationComplexity.ONE_AXIS) {
            const axes = ['x', 'y', 'z'] as const;
            const axis = axes[Math.floor(Math.random() * axes.length)];
            newRot[axis] += getDelta();
          } else {
            const axes = ['x', 'y', 'z'] as const;
            const shuffled = [...axes].sort(() => 0.5 - Math.random());
            newRot[shuffled[0]] += getDelta();
            newRot[shuffled[1]] += getDelta();
          }
          return newRot;
        };

        const baseRot: RotationState = { x: 0, y: 0, z: 0 };
        
        // 3 Targets: A, B, C
        const targetIds = ['A', 'B', 'C'];
        const correctIndex = Math.floor(Math.random() * targetIds.length);
        const distractorPool = [1, 2, 3, 4].sort(() => 0.5 - Math.random());
        
        const newTargets: TargetObject[] = targetIds.map((id, index) => {
          const isCorrect = index === correctIndex;
          let variant: number;
          if (isCorrect) {
            variant = 0; 
          } else {
            variant = distractorPool.pop() || 1; 
          }
          return {
            id,
            rotation: generateRotation(baseRot),
            variant: variant,
            isCorrect: isCorrect
          };
        });

        setActiveTrial({
          shape: configShape,
          complexity: configComplexity,
          magnitude: configMagnitude,
          refRotation: baseRot,
          targets: newTargets,
          correctTargetId: targetIds[correctIndex]
        });

        setLlmResult(null);
        setCapturedRef1(null);
        setCapturedRef2(null);
        setCapturedTargets([null!, null!, null!]);
        setIsGenerating(false);
    }, 600);
  };

  useEffect(() => {
    if (!isBatchRunning) return;

    const automateBatch = async () => {
        // If not captured yet, trigger capture
        if (!capturedRef1) {
            triggerCapture();
            return;
        }

        // Wait a moment for state to settle, then save data to accumulator
        await new Promise(r => setTimeout(r, 800));
        saveCurrentTrialToBatch();
        
        if (currentBatchIndex < batchSize - 1) {
            setCurrentBatchIndex(prev => prev + 1);
            generateTrial();
        } else {
            // FINISHED BATCH
            await new Promise(r => setTimeout(r, 500)); // Small delay
            await downloadBatchZip();
            setIsBatchRunning(false);
            setCurrentBatchIndex(0);
            batchDataRef.current = []; // Clear accumulator
        }
    };

    const timeout = setTimeout(automateBatch, 1500); 
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBatchRunning, currentBatchIndex, capturedRef1, batchSize]);


  const triggerCapture = () => {
    setIsCapturing(true);
    setCapturedRef1(null);
    setCapturedRef2(null);
    setCapturedTargets([null!, null!, null!]);

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('trigger-capture', { detail: 'ref-front' }));
      window.dispatchEvent(new CustomEvent('trigger-capture', { detail: 'ref-back' }));
      ['A', 'B', 'C'].forEach(id => {
         window.dispatchEvent(new CustomEvent('trigger-capture', { detail: `target-${id}` }));
      });
      setIsCapturing(false);
    }, 100);
  };

  const runGeminiTest = async () => {
    if (!capturedRef1 || !capturedRef2 || capturedTargets.some(t => !t)) return;
    
    setAnalysisError(null);
    
    // Fallback check if user hasn't clicked connect but env might be empty
    if (!process.env.API_KEY && !hasApiKey) {
      setAnalysisError("Missing API Key. Please click 'Connect API Key' below.");
      return;
    }

    setIsAnalyzing(true);
    setLlmResult(null);

    const prompt = `
    Analyze the Reference Object (Views 1 & 2) and the 3 Candidates (A-C).
    Identify which candidate matches the Reference Object.
    
    Current Trial Config:
    - Shape: ${activeTrial.shape}
    - Rotation Complexity: ${activeTrial.complexity}
    - Rotation Magnitude: ${activeTrial.magnitude}
    
    IMPORTANT: Provide your answer as a JSON object with 'answer', 'confidence', and 'reasoning'.
    `;

    try {
      const result = await Promise.race([
        analyzeSpatialTask(capturedRef1, capturedRef2, capturedTargets, prompt),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Analysis Request Timed Out (300s)")), 300000)
        )
      ]);
      setLlmResult(result);
    } catch (error: any) {
      console.error(error);
      let msg = "An unexpected error occurred during analysis.";
      if (error instanceof Error) {
        // Reset API key state if the server says the entity was not found (invalid key)
        if (error.message.includes("Requested entity was not found") || error.message.includes("API key not valid")) {
            if (window.aistudio) {
                setHasApiKey(false);
                msg = "API Key Invalid or Expired. Please reconnect your key.";
            } else {
                msg = "API Key Invalid. Please check your environment variables.";
            }
        } else if (error.message.toLowerCase().includes("timed out")) {
            msg = "The request timed out. Please try again or use 'AI Optimized' quality.";
        } else if (error.message.includes("API Key")) {
            msg = "Invalid or missing API Key.";
        } else if (error.message.includes("400") || error.message.includes("429")) {
            msg = "API Error: The request was rejected (Bad Request or Quota Exceeded).";
        } else if (error.message.includes("500") || error.message.includes("503")) {
             msg = "API Error: Server encountered an error (500/503). Retrying might work.";
        } else if (error.message.includes("fetch")) {
            msg = "Network Error: Could not connect to Gemini API.";
        } else {
            msg = error.message;
        }
      }
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- Helper to prepare data for a single trial ---
  const prepareTrialData = (prefix = "") => {
     if (!capturedRef1 || !capturedRef2 || capturedTargets.some(t => !t)) return null;

     const getExt = (data: string) => data.startsWith('data:image/jpeg') ? 'jpg' : 'png';

     const metadata = {
        trial_id: Date.now(),
        timestamp: new Date().toISOString(),
        config: {
            shape: activeTrial.shape,
            complexity: activeTrial.complexity,
            magnitude: activeTrial.magnitude,
            image_quality: configQuality
        },
        reference: {
            shape: activeTrial.shape,
            rotation: activeTrial.refRotation
        },
        targets: activeTrial.targets.map(t => ({
            id: t.id,
            is_correct: t.isCorrect,
            variant: t.variant,
            rotation_values_deg: t.rotation,
        }))
    };

    const images = [
        { name: `${prefix}1_Reference_Front.${getExt(capturedRef1)}`, data: capturedRef1 },
        { name: `${prefix}2_Reference_Back.${getExt(capturedRef2)}`, data: capturedRef2 },
        ...capturedTargets.map((img, idx) => {
            const target = activeTrial.targets[idx];
            const suffix = target.isCorrect ? "_CORRECT" : "";
            return { name: `${prefix}3_Target_${target.id}${suffix}.${getExt(img)}`, data: img };
        })
    ];

    return { metadata, images };
  };

  // --- Save current trial to batch accumulator ---
  const saveCurrentTrialToBatch = () => {
    const data = prepareTrialData();
    if (data) {
        batchDataRef.current.push({
            trialIndex: currentBatchIndex + 1,
            metadata: data.metadata,
            images: data.images
        });
    }
  };

  // --- Download Single Trial as ZIP ---
  const downloadSingleTrialZip = async () => {
    const data = prepareTrialData();
    if (!data) return;

    const zip = new JSZip();
    zip.file("Metadata.json", JSON.stringify(data.metadata, null, 2));
    
    data.images.forEach(img => {
        // Remove header
        const base64Data = img.data.split(',')[1];
        zip.file(img.name, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SpatialTrial_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
  };

  // --- Download Batch as Master ZIP ---
  const downloadBatchZip = async () => {
    if (batchDataRef.current.length === 0) return;

    const zip = new JSZip();
    const batchFolder = zip.folder(`BatchRun_${Date.now()}`);

    if (batchFolder) {
        batchDataRef.current.forEach(trial => {
            const trialFolder = batchFolder.folder(`Trial_${trial.trialIndex}`);
            if (trialFolder) {
                trialFolder.file("Metadata.json", JSON.stringify(trial.metadata, null, 2));
                trial.images.forEach(img => {
                    const base64Data = img.data.split(',')[1];
                    trialFolder.file(img.name, base64Data, { base64: true });
                });
            }
        });
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SpatialBatch_${batchSize}_Trials.zip`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
  };

  const updateRefRotation = (axis: keyof RotationState, value: number) => {
    setActiveTrial(prev => ({
      ...prev,
      refRotation: { ...prev.refRotation, [axis]: value }
    }));
  };

  const allCaptured = capturedRef1 && capturedRef2 && !capturedTargets.includes(null!);
  const isCorrect = llmResult?.answer === activeTrial.correctTargetId;

  return (
    <div className="flex w-full h-full bg-[#0b0f19] text-slate-200 font-sans overflow-hidden">
      
      {/* --- LEFT SIDEBAR: CONTROL CENTER --- */}
      <div className="w-80 flex-shrink-0 bg-[#0f172a] border-r border-slate-800 flex flex-col h-full z-10 shadow-xl">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-600 rounded-lg">
                <Move3d className="text-white" size={18} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">Spatial Lab</h1>
          </div>
          <p className="text-xs text-slate-400 ml-9">Mental Rotation Task Generator</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
          
          {/* Section 1: Protocol Design */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-blue-400">
                <Settings2 size={16} />
                <h2 className="text-xs font-bold uppercase tracking-widest">Protocol Design</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <LabelWithTooltip 
                    label="Stimulus Shape" 
                    description="The base 3D object type. High Symmetry objects (like the Propeller) are regular but chiral. Low Symmetry objects (like the Snake) are irregular blocks."
                />
                <div className="relative">
                  <select 
                    value={configShape}
                    onChange={(e) => setConfigShape(e.target.value as ShapeType)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-md py-2.5 px-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none appearance-none transition-all hover:bg-slate-800"
                  >
                    <option value={ShapeType.HIGH_SYMMETRY}>Chiral Propeller (High Sym)</option>
                    <option value={ShapeType.LOW_SYMMETRY}>Shepard-Metzler Snake (Low Sym)</option>
                  </select>
                  <ChevronRight size={14} className="absolute right-3 top-3 text-slate-500 rotate-90 pointer-events-none" />
                </div>
              </div>

              <div>
                <LabelWithTooltip 
                    label="Task Difficulty" 
                    description="Defines the rotation parameters for the trial." 
                />
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <LabelWithTooltip label="Complexity" description="Number of axes (X/Y/Z) the object is rotated around." />
                        <div className="flex p-1 bg-slate-800/50 rounded-md border border-slate-700">
                            {[RotationComplexity.ONE_AXIS, RotationComplexity.TWO_AXIS].map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setConfigComplexity(opt)}
                                    className={`flex-1 py-1.5 text-[10px] font-medium rounded transition-all ${
                                        configComplexity === opt ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {opt === RotationComplexity.ONE_AXIS ? '1-Axis' : '2-Axis'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1">
                         <LabelWithTooltip label="Angle Deviation" description="Magnitude of rotation. Low: ~30-70°. High: ~110-150°." />
                        <div className="flex p-1 bg-slate-800/50 rounded-md border border-slate-700">
                            {[RotationMagnitude.LOW, RotationMagnitude.HIGH].map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setConfigMagnitude(opt)}
                                    className={`flex-1 py-1.5 text-[10px] font-medium rounded transition-all ${
                                        configMagnitude === opt ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
              </div>

              <div>
                <LabelWithTooltip 
                    label="Image Quality" 
                    description="Standard: Enhanced (1600px). High: Max Density (Very Slow). AI Optimized: 448px (Fastest for LLM)."
                />
                <div className="relative">
                  <select 
                    value={configQuality}
                    onChange={(e) => setConfigQuality(e.target.value as ImageQuality)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-md py-2 px-3 text-xs text-slate-200 focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none hover:bg-slate-800"
                  >
                    <option value={ImageQuality.STANDARD}>Standard (High Detail)</option>
                    <option value={ImageQuality.HIGH}>High Resolution (Native Raw)</option>
                    <option value={ImageQuality.AI_OPTIMIZED}>AI Optimized (Low Res)</option>
                  </select>
                  <ImageIcon size={14} className="absolute right-3 top-2.5 text-slate-500 pointer-events-none" />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Stimulus Manipulation */}
          <section>
            <div className="flex items-center gap-2 mb-4 text-purple-400">
                <RotateCcw size={16} />
                <h2 className="text-xs font-bold uppercase tracking-widest">Reference Calibration</h2>
            </div>
            
            <div className="p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg space-y-3">
                <p className="text-[10px] text-slate-400 mb-2">Manual Base Orientation (Deg)</p>
                {(['x', 'y', 'z'] as const).map(axis => (
                    <div key={axis} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500 uppercase w-2">{axis}</span>
                        <input 
                            type="range" min="0" max="360" step="5"
                            value={activeTrial.refRotation[axis]}
                            onChange={(e) => updateRefRotation(axis, parseInt(e.target.value))}
                            className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <span className="text-[10px] font-mono w-6 text-right text-slate-400">{activeTrial.refRotation[axis]}°</span>
                    </div>
                ))}
            </div>
          </section>

          {/* Section 3: Batch Automation */}
           <section>
            <div className="flex items-center gap-2 mb-4 text-amber-400">
                <Layers size={16} />
                <h2 className="text-xs font-bold uppercase tracking-widest">Batch Automation</h2>
            </div>
            <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg space-y-4">
                 <div className="flex items-center justify-between">
                     <LabelWithTooltip label="Batch Size" description="Number of trials to generate and capture automatically." />
                     <select 
                        value={batchSize}
                        onChange={(e) => setBatchSize(Number(e.target.value))}
                        disabled={isBatchRunning}
                        className="bg-slate-800 border border-slate-600 text-xs rounded px-2 py-1 outline-none focus:border-amber-500"
                     >
                         <option value={5}>5 Trials</option>
                         <option value={10}>10 Trials</option>
                         <option value={20}>20 Trials</option>
                     </select>
                 </div>
                 
                 {isBatchRunning ? (
                     <div className="space-y-2">
                        <div className="flex justify-between text-xs text-amber-300 font-mono">
                            <span>{currentBatchIndex >= batchSize ? 'Archiving...' : 'Progress'}</span>
                            <span>{Math.min(currentBatchIndex + 1, batchSize)} / {batchSize}</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-amber-500 transition-all duration-300" 
                                style={{ width: `${((currentBatchIndex + 1) / batchSize) * 100}%` }}
                            />
                        </div>
                        <button 
                            onClick={() => setIsBatchRunning(false)}
                            className="w-full py-2 mt-2 text-xs font-bold text-red-400 bg-red-900/20 border border-red-900/50 rounded hover:bg-red-900/30 transition-colors"
                        >
                            STOP BATCH
                        </button>
                     </div>
                 ) : (
                     <LabelWithTooltip label="" description="Runs automated sequence. At the end, downloads a single MASTER ZIP containing subfolders for each trial.">
                        <button 
                            onClick={() => { setIsBatchRunning(true); setCurrentBatchIndex(0); batchDataRef.current = []; generateTrial(); }}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wide rounded transition-all shadow-lg shadow-amber-900/20"
                        >
                            <Play size={12} fill="currentColor" />
                            Start Batch Run
                        </button>
                     </LabelWithTooltip>
                 )}
            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900 z-20 space-y-3 relative">
             {analysisError && (
                 <div className="absolute bottom-full left-0 w-full p-3 bg-red-900/90 backdrop-blur border-t border-red-800 text-xs text-red-200 animate-in slide-in-from-bottom-2 fade-in">
                     <div className="flex items-start gap-2">
                         <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                         <span className="flex-1">{analysisError}</span>
                         <button onClick={() => setAnalysisError(null)} className="text-red-400 hover:text-white"><XCircle size={14}/></button>
                     </div>
                 </div>
             )}

             <button
                onClick={generateTrial}
                disabled={isBatchRunning || isAnalyzing}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-wide rounded-md transition-all shadow-lg shadow-blue-900/20 group"
            >
                {isGenerating ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Repeat size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                )}
                {isGenerating ? 'Generating...' : 'Generate Single Trial'}
            </button>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={triggerCapture}
                    disabled={isBatchRunning}
                    className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wide rounded-md transition-all"
                >
                    <Camera size={14} />
                    Capture
                </button>
                 <button
                    onClick={() => downloadSingleTrialZip()}
                    disabled={!allCaptured || isBatchRunning}
                    className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-slate-300 text-xs font-bold uppercase tracking-wide rounded-md transition-all"
                >
                    <FolderArchive size={14} />
                    Download ZIP
                </button>
            </div>
            
            <button
                onClick={!hasApiKey ? handleConnectKey : runGeminiTest}
                disabled={isAnalyzing || isBatchRunning || (hasApiKey && (capturedTargets.some(t => !t) || !allCaptured))}
                className={`w-full flex items-center justify-center gap-2 py-3 border text-sm font-bold uppercase tracking-wide rounded-md transition-all shadow-lg ${
                    isAnalyzing 
                    ? 'bg-purple-900/50 border-purple-800 text-purple-300' 
                    : !hasApiKey
                        ? 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white shadow-amber-900/20'
                        : allCaptured 
                            ? 'bg-purple-600 hover:bg-purple-500 border-purple-500 text-white shadow-purple-900/20' 
                            : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
            >
                {isAnalyzing ? (
                    <Loader2 className="animate-spin" size={18}/>
                ) : !hasApiKey ? (
                    <Key size={18} />
                ) : (
                    <BrainCircuit size={18} />
                )}
                
                {isAnalyzing ? 'Analyzing...' : (!hasApiKey ? 'Connect API Key' : 'Analyze with Gemini')}
            </button>
        </div>
      </div>

      {/* --- RIGHT: VISUALIZATION & ANALYSIS --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0b0f19]">
        
        {/* --- MAIN VISUALIZATION AREA (SCROLLABLE) --- */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="p-6 space-y-6">
                
                {/* 1. REFERENCE ROW */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Reference Object (Ground Truth)</h3>
                        <div className="h-px bg-slate-800 flex-1"></div>
                    </div>
                    
                    <div className="flex gap-4 h-[280px]">
                         {/* Ref View 1: Front */}
                        <div className="flex-1 min-w-0 bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden relative group">
                            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                                <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-1 rounded shadow-sm">VIEW 1 (FRONT)</span>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur">
                                    {activeTrial.refRotation.x}°, {activeTrial.refRotation.y}°, {activeTrial.refRotation.z}°
                                </span>
                            </div>
                            {/* preserveDrawingBuffer set to true to ensure capture works even if called after render loop */}
                            <Canvas gl={{ preserveDrawingBuffer: true }} camera={{ position: [6, 6, 6], fov: 30 }} dpr={[1, 2]}>
                                <color attach="background" args={['#0f172a']} />
                                <ambientLight intensity={0.6} />
                                <pointLight position={[10, 10, 10]} intensity={1} />
                                <Stage intensity={0.7} environment="city" adjustCamera={false}>
                                    <TestSubject shape={activeTrial.shape} rotation={[activeTrial.refRotation.x, activeTrial.refRotation.y, activeTrial.refRotation.z]} />
                                </Stage>
                                <OrbitControls makeDefault />
                                <SceneCapture id="ref-front" quality={configQuality} onCapture={setCapturedRef1} />
                            </Canvas>
                        </div>
                        
                         {/* Ref View 2: Back */}
                        <div className="flex-1 min-w-0 bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden relative group">
                             <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                                <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-1 rounded shadow-sm">VIEW 2 (BACK)</span>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur">
                                    {activeTrial.refRotation.x}°, {activeTrial.refRotation.y + 180}°, {activeTrial.refRotation.z}°
                                </span>
                            </div>
                            <Canvas gl={{ preserveDrawingBuffer: true }} camera={{ position: [6, 6, 6], fov: 30 }} dpr={[1, 2]}>
                                <color attach="background" args={['#0f172a']} />
                                <ambientLight intensity={0.6} />
                                <pointLight position={[10, 10, 10]} intensity={1} />
                                <Stage intensity={0.7} environment="city" adjustCamera={false}>
                                    <TestSubject shape={activeTrial.shape} rotation={[activeTrial.refRotation.x, activeTrial.refRotation.y + 180, activeTrial.refRotation.z]} />
                                </Stage>
                                <OrbitControls makeDefault />
                                <SceneCapture id="ref-back" quality={configQuality} onCapture={setCapturedRef2} />
                            </Canvas>
                        </div>
                    </div>
                </div>

                {/* 2. TARGET ROW */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest">Candidate Objects (Select Match)</h3>
                        <div className="h-px bg-slate-800 flex-1"></div>
                    </div>
                    
                    <div className="flex gap-3 h-[240px]">
                        {activeTrial.targets.map((target, idx) => (
                            <div 
                                key={target.id} 
                                className={`flex-1 min-w-0 flex flex-col bg-[#0f172a] rounded-lg overflow-hidden relative group transition-all duration-500
                                  ${target.isCorrect ? 'border-2 border-green-500/50 bg-green-900/10' : 'border border-slate-800'}
                                `}
                            >
                                <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shadow-sm ${
                                        target.isCorrect ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
                                    }`}>
                                        {target.id}
                                    </span>
                                </div>

                                <div className="flex-1 relative w-full">
                                    <Canvas gl={{ preserveDrawingBuffer: true }} camera={{ position: [6, 6, 6], fov: 30 }} dpr={[1, 2]}>
                                        <color attach="background" args={['#0f172a']} />
                                        <ambientLight intensity={0.6} />
                                        <pointLight position={[10, 10, 10]} intensity={1} />
                                        <Stage intensity={0.7} environment="city" adjustCamera={false}>
                                            <TestSubject 
                                                shape={activeTrial.shape} 
                                                rotation={[target.rotation.x, target.rotation.y, target.rotation.z]} 
                                                variant={target.variant}
                                            />
                                        </Stage>
                                        <OrbitControls makeDefault />
                                        <SceneCapture id={`target-${target.id}`} quality={configQuality} onCapture={(data) => {
                                            setCapturedTargets(prev => {
                                                const next = [...prev];
                                                next[idx] = data;
                                                return next;
                                            });
                                        }} />
                                    </Canvas>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. GEMINI RESULT PANEL */}
                {llmResult && (
                    <div className="mt-2 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex">
                            {/* Result Left: Score */}
                            <div className={`w-32 p-6 flex flex-col items-center justify-center border-r border-slate-800 ${isCorrect ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                                <div className={`text-4xl font-bold mb-1 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                    {llmResult.answer}
                                </div>
                                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                    {isCorrect ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                    {isCorrect ? 'Correct' : 'Incorrect'}
                                </div>
                            </div>

                            {/* Result Right: Details */}
                            <div className="flex-1 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                                        <BrainCircuit size={16} className="text-purple-400" />
                                        Model Analysis
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400">Confidence</span>
                                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-purple-500" 
                                                style={{ width: `${llmResult.confidence}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-mono text-purple-300">{llmResult.confidence}</span>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                                    <p className="text-xs leading-relaxed text-slate-300 font-mono whitespace-pre-wrap">
                                        {llmResult.reasoning}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}