import type { EmbeddingProvider } from "./types";

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-4";

interface VoyageResponse {
  data: { embedding: number[] }[];
}

async function embed(texts: string[], inputType: "query" | "document"): Promise<number[][]> {
  const response = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: texts,
      model: MODEL,
      input_type: inputType,
    }),
  });

  if (!response.ok) {
    throw new Error(`Voyage AI embeddings request failed: ${response.status}`);
  }

  const body: VoyageResponse = await response.json();
  return body.data.map((d) => d.embedding);
}

export const voyageProvider: EmbeddingProvider = {
  async embedText(text, inputType) {
    const [embedding] = await embed([text], inputType);
    return embedding;
  },
  async embedTexts(texts, inputType) {
    if (texts.length === 0) return [];
    return embed(texts, inputType);
  },
};
