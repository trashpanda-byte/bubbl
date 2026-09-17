import {
  FilesetResolver,
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

// Pinned to match the installed npm package version so the WASM runtime and
// JS bundle stay in sync.
const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

// Standard MediaPipe hand landmark indices.
export const LANDMARK = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
} as const;

export type Hand = NormalizedLandmark[];

let landmarkerPromise: Promise<HandLandmarker> | null = null;

// Loaded once and reused — creating a HandLandmarker downloads/compiles the
// WASM runtime and model, which is too slow to redo per detection call.
function getHandLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = FilesetResolver.forVisionTasks(WASM_BASE_URL).then((vision) =>
      HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 1,
      }),
    );
  }
  return landmarkerPromise;
}

export async function detectHand(
  video: HTMLVideoElement,
  timestampMs: number,
): Promise<Hand | null> {
  const landmarker = await getHandLandmarker();
  const result = landmarker.detectForVideo(video, timestampMs);
  return result.landmarks[0] ?? null;
}

function distance(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const PINCH_THRESHOLD = 0.07;

export function isPinching(hand: Hand): boolean {
  return distance(hand[LANDMARK.THUMB_TIP], hand[LANDMARK.INDEX_TIP]) < PINCH_THRESHOLD;
}

export function pinchMidpoint(hand: Hand): { x: number; y: number } {
  const a = hand[LANDMARK.THUMB_TIP];
  const b = hand[LANDMARK.INDEX_TIP];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function palmCenter(hand: Hand): { x: number; y: number } {
  const p = hand[LANDMARK.MIDDLE_MCP];
  return { x: p.x, y: p.y };
}
