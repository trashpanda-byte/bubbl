import { anthropicProvider } from "./anthropic";
import type { BubbleCandidate, ExtractionResult } from "./types";

export type {
  BubbleCandidate,
  ExtractionResult,
  ExtractedEntity,
  ExtractedRelationship,
} from "./types";

// The rest of the app calls this generic function and never imports the
// Anthropic SDK directly, so swapping providers later only touches this file.
export function extractBubblesFromThought(
  rawText: string,
  existingBubbles: BubbleCandidate[],
): Promise<ExtractionResult> {
  return anthropicProvider.extractBubblesFromThought(rawText, existingBubbles);
}
