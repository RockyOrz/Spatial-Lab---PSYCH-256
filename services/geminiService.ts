import { GoogleGenAI, Type } from "@google/genai";
import { LlmResponse } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert participant in a "Mental Rotation" cognitive test.

**Task:**
You are presented with a **Reference Object** (shown in two views) and **3 Candidate Objects** (labeled A, B, C).
Your goal is to identify which ONE of the 3 candidates is the **SAME** object as the Reference Object, just rotated in 3D space.
The other 2 candidates are "distractors" (they are structurally different, e.g., have parts bent in the wrong direction or mirrored).

**Input Data:**
1. **Reference View 1 (Front):** The Reference Object from a standard angle.
2. **Reference View 2 (Back):** The SAME Reference Object rotated 180 degrees. Use this to build a complete 3D mental model.
3. **Candidates A, B, C:** Three images of 3D objects at various rotations.

**Process:**
1. **Model Construction:** Combine Reference View 1 & 2 to understand the 3D structure of the correct object. Note unique features (e.g., "The top arm bends to the right", "The bottom leg extends forward").
2. **Elimination:** Look at each candidate (A-C). mentally rotate them. If a candidate has a feature that structurally disagrees with the Reference (e.g., an arm bending left instead of right), eliminate it.
3. **Selection:** Identify the single candidate that matches the Reference structure perfectly, regardless of its rotation.

**Output:**
- **answer**: The letter of the correct candidate ("A", "B", or "C").
- **confidence**: 0 to 100.
- **reasoning**: Briefly explain why the selected candidate is the match and point out a structural flaw in one or two distractors.
`;

const getInlineData = (dataUrl: string) => {
  const [header, base64] = dataUrl.split(",");
  const mimeType = header.match(/:(.*?);/)?.[1] || "image/png";
  return { inlineData: { mimeType, data: base64 } };
};

// Helper to wrap a promise with a timeout
const timeoutPromise = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export const analyzeSpatialTask = async (
  ref1: string,
  ref2: string,
  targets: string[], // Expecting 3 base64 strings
  prompt: string
): Promise<LlmResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  const parts: any[] = [
    { text: "Reference Object - View 1 (Front):" },
    getInlineData(ref1),
    { text: "Reference Object - View 2 (Back - 180°):" },
    getInlineData(ref2),
    { text: "--- CANDIDATES ---" }
  ];

  const labels = ['A', 'B', 'C'];
  targets.forEach((img, idx) => {
    parts.push({ text: `Candidate ${labels[idx]}:` });
    parts.push(getInlineData(img));
  });

  parts.push({ text: prompt });

  const commonConfig = {
    systemInstruction: SYSTEM_INSTRUCTION,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        reasoning: { type: Type.STRING, description: "Step-by-step elimination and selection." },
        answer: { type: Type.STRING, enum: ["A", "B", "C"], description: "The letter of the matching object." },
        confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 100" },
      },
      required: ["reasoning", "answer", "confidence"],
    },
  };

  try {
    // Attempt: Gemini 3 Pro (Best for reasoning)
    // Removed fallback to Flash as requested.
    // Set timeout to 300s (300000ms) to allow complex reasoning time.
    const response = await timeoutPromise(
      ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: { parts },
        config: commonConfig,
      }),
      300000 
    );

    if (response.text) {
      return JSON.parse(response.text) as LlmResponse;
    }
    throw new Error("Empty response from model");
  } catch (error: any) {
    console.error("Model analysis failed:", error);
    if (error.message.includes("Empty response")) {
        throw new Error("Model analyzed the images but returned no content. This may be due to safety filters or image clarity.");
    }
    throw error;
  }
};