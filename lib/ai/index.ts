import { anthropicProvider } from "./anthropic";
import type {
  AnswerResult,
  BubbleCandidate,
  ExtractionResult,
  RetrievedBubble,
  RetrievedRelationship,
} from "./types";
import { voyageProvider } from "./voyage";

export type {
  AnswerResult,
  BubbleCandidate,
  BubbleEdit,
  ExtractionResult,
  ExtractedEntity,
  ExtractedRelationship,
  RetrievedBubble,
  RetrievedRelationship,
} from "./types";

// The rest of the app calls these generic functions and never imports the
// Anthropic SDK or Voyage AI directly, so swapping providers later only
// touches this file (and the adapter it points to).

export function extractBubblesFromThought(
  rawText: string,
  existingBubbles: BubbleCandidate[],
): Promise<ExtractionResult> {
  return anthropicProvider.extractBubblesFromThought(rawText, existingBubbles);
}

export function answerQuestion(
  question: string,
  context: { bubbles: RetrievedBubble[]; relationships: RetrievedRelationship[] },
): Promise<AnswerResult> {
  return anthropicProvider.answerQuestion(question, context);
}

export function embedText(
  text: string,
  inputType: "query" | "document",
): Promise<number[]> {
  return voyageProvider.embedText(text, inputType);
}

export function embedTexts(
  texts: string[],
  inputType: "query" | "document",
): Promise<number[][]> {
  return voyageProvider.embedTexts(texts, inputType);
}
