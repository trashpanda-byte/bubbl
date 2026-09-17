import { z } from "zod";

export const ExtractedEntitySchema = z
  .object({
    tempId: z.string().min(1),
    action: z.enum(["reuse", "create"]),
    existingBubbleId: z.string().nullable(),
    label: z.string().min(1),
    type: z.string().min(1),
    description: z.string().nullable(),
  })
  .superRefine((entity, ctx) => {
    if (entity.action === "reuse" && !entity.existingBubbleId) {
      ctx.addIssue("existingBubbleId is required when action is 'reuse'");
    }
  });

export const ExtractedRelationshipSchema = z.object({
  sourceTempId: z.string().min(1),
  targetTempId: z.string().min(1),
  relationshipType: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const ExtractionResultSchema = z.object({
  entities: z.array(ExtractedEntitySchema),
  relationships: z.array(ExtractedRelationshipSchema),
});

export type ExtractedEntity = z.infer<typeof ExtractedEntitySchema>;
export type ExtractedRelationship = z.infer<typeof ExtractedRelationshipSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

export interface BubbleCandidate {
  id: string;
  label: string;
  type: string;
}

export interface RetrievedBubble {
  id: string;
  label: string;
  type: string;
  description: string | null;
  similarity: number;
}

export interface RetrievedRelationship {
  sourceLabel: string;
  targetLabel: string;
  relationshipType: string;
}

export const BubbleEditSchema = z.object({
  bubbleId: z.string().min(1),
  description: z.string().min(1),
});
export type BubbleEdit = z.infer<typeof BubbleEditSchema>;

export interface AnswerResult {
  answer: string;
  edits: BubbleEdit[];
}

export interface AIProvider {
  extractBubblesFromThought(
    rawText: string,
    existingBubbles: BubbleCandidate[],
  ): Promise<ExtractionResult>;

  answerQuestion(
    question: string,
    context: {
      bubbles: RetrievedBubble[];
      relationships: RetrievedRelationship[];
    },
  ): Promise<AnswerResult>;
}

export interface EmbeddingProvider {
  embedText(text: string, inputType: "query" | "document"): Promise<number[]>;
  embedTexts(texts: string[], inputType: "query" | "document"): Promise<number[][]>;
}
