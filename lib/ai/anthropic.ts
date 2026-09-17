import Anthropic from "@anthropic-ai/sdk";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

import {
  ExtractionResultSchema,
  type AIProvider,
  type BubbleCandidate,
  type ExtractionResult,
} from "./types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = "claude-sonnet-5";

// Cap the candidate list sent to the model. Fine for MVP-scale bubble
// counts; once users accumulate many bubbles, pre-filter this with a
// pgvector similarity search instead of sending everything.
const MAX_CANDIDATES = 300;

const EXTRACTION_TOOL: Tool = {
  name: "record_extraction",
  description:
    "Record the bubbles (concepts, topics, goals, tasks, people, places, ideas, questions, decisions, etc.) and the relationships between them found in the user's thought.",
  input_schema: {
    type: "object",
    properties: {
      entities: {
        type: "array",
        description: "Every distinct bubble mentioned or implied by the thought.",
        items: {
          type: "object",
          properties: {
            tempId: {
              type: "string",
              description:
                "A short local id (e.g. 'e1') used to reference this entity from relationships in this same response.",
            },
            action: {
              type: "string",
              enum: ["reuse", "create"],
              description:
                "'reuse' if this matches one of the existing bubbles listed below, 'create' otherwise.",
            },
            existingBubbleId: {
              type: ["string", "null"],
              description:
                "The id of the matching existing bubble when action is 'reuse'; null when action is 'create'.",
            },
            label: {
              type: "string",
              description: "Short human-readable name for the bubble.",
            },
            type: {
              type: "string",
              description:
                "Free-text category, e.g. goal, task, idea, question, person, place, decision, topic, document, life_area. Invent a fitting one rather than forcing it into a fixed list.",
            },
            description: {
              type: ["string", "null"],
              description: "A short elaboration, or null if the label speaks for itself.",
            },
          },
          required: ["tempId", "action", "existingBubbleId", "label", "type", "description"],
        },
      },
      relationships: {
        type: "array",
        description: "Directed relationships between the entities above.",
        items: {
          type: "object",
          properties: {
            sourceTempId: { type: "string" },
            targetTempId: { type: "string" },
            relationshipType: {
              type: "string",
              description:
                "e.g. related_to, part_of, supports, affects. Invent a fitting one if none of these apply.",
            },
            confidence: {
              type: "number",
              description: "0 to 1, how confident you are this relationship holds.",
            },
          },
          required: ["sourceTempId", "targetTempId", "relationshipType", "confidence"],
        },
      },
    },
    required: ["entities", "relationships"],
  },
};

const SYSTEM_PROMPT = `You are Bubbl.ai's extraction engine. Bubbl turns a user's free-text "thought" into a graph of connected "bubbles" (a thought, topic, goal, project, task, person, place, piece of knowledge, decision, interest, document, or life area).

Given a thought and a list of the user's existing bubbles, identify every distinct entity mentioned or clearly implied, and the relationships between them. For each entity, decide whether it reuses an existing bubble (the same real-world concept, even if worded differently) or needs a new one — never create a duplicate of something that already exists. Keep labels short and human-readable. Bubble "type" is free text, not a fixed category — pick whatever genuinely fits.

Always call the record_extraction tool with your result, even if the thought only implies a single bubble with no relationships.`;

function formatCandidates(existingBubbles: BubbleCandidate[]): string {
  if (existingBubbles.length === 0) return "(none yet)";
  return existingBubbles
    .slice(0, MAX_CANDIDATES)
    .map((b) => `- id: ${b.id} | label: "${b.label}" | type: ${b.type}`)
    .join("\n");
}

export const anthropicProvider: AIProvider = {
  async extractBubblesFromThought(rawText, existingBubbles) {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Existing bubbles for this user:\n${formatCandidates(existingBubbles)}\n\nThought:\n"""\n${rawText}\n"""`,
        },
      ],
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: "tool", name: "record_extraction" },
    });

    const toolUse = message.content.find((block) => block.type === "tool_use");
    if (!toolUse) {
      throw new Error("AI provider did not return a structured extraction.");
    }

    const result: ExtractionResult = ExtractionResultSchema.parse(toolUse.input);
    return result;
  },
};
