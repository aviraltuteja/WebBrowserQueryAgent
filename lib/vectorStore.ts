import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Embeddings } from "@langchain/core/embeddings";
import { GoogleGenAI } from "@google/genai";
import { Document } from "@langchain/core/documents";

// ✅ Gemini Embeddings Class (unchanged)
class GeminiEmbeddings extends Embeddings {
  private ai: GoogleGenAI;

  constructor() {
    super();
    const apiKey = process.env.GEMINI_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_KEY not set in environment variables");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async embedQuery(text: string): Promise<number[]> {
    const response = await this.ai.models.embedContent({
      model: "gemini-embedding-exp-03-07",
      contents: [{ parts: [{ text }] }],
    });

    if (
      !response.embeddings ||
      !Array.isArray(response.embeddings) ||
      response.embeddings.length === 0
    ) {
      throw new Error("No embeddings returned from Gemini.");
    }

    const values = response.embeddings[0].values;

    const embedding = Array.from(values as Iterable<unknown>).map(Number);

    if (!embedding.every((v) => typeof v === "number" && isFinite(v))) {
      throw new Error("Embedding contains invalid or non-numeric values.");
    }

    return embedding;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embedQuery(text)));
  }
}

// ✅ Vector Store setup with MemoryVectorStore
let vectorStore: MemoryVectorStore | null = null;

async function getVectorStore() {
  if (!vectorStore) {
    const embeddings = new GeminiEmbeddings();
    const texts = ["Hello world", "Random message"];
    const vectors = await embeddings.embedDocuments(texts);

    console.log("Embeddings generated:", vectors);

    vectorStore = new MemoryVectorStore(embeddings);

    const documents = texts.map(
      (text) =>
        new Document({
          pageContent: text,
          metadata: { source: "seed" },
        })
    );

    await vectorStore.addVectors(vectors, documents);

    console.log("Memory vector store initialized.");
  }

  return vectorStore;
}

// ✅ Utility: Get embedding independently
export async function getEmbedding(text: string): Promise<number[]> {
  const embeddings = new GeminiEmbeddings();
  return await embeddings.embedQuery(text);
}

// ✅ Similarity search
export async function findSimilar(queryEmbedding: number[], threshold = 0.85) {
  // Validate input
  if (!Array.isArray(queryEmbedding)) {
    throw new Error("Invalid queryEmbedding: Expected a number array.");
  }
  if (!queryEmbedding.every((v) => typeof v === "number" && isFinite(v))) {
    throw new Error(
      "Invalid queryEmbedding: Contains non-numeric or invalid values."
    );
  }

  // Log the queryEmbedding for debugging

  const store = await getVectorStore();
  console.log(store);

  try {
    const result = await store.similaritySearchVectorWithScore(
      queryEmbedding,
      1
    );
    console.log("Similarity Search Result:", result);

    if (!result || result.length === 0) {
      console.log("No similar results found.");
      return null;
    }

    const [doc, score] = result[0];
    console.log("Top match score:", score, "Document:", doc);

    if (typeof score !== "number" || isNaN(score)) {
      console.error("Invalid score from vector search:", score);
      return null;
    }

    if (score >= threshold) {
      return doc.pageContent;
    }

    return null;
  } catch (error) {
    console.error("Error in similarity search:", error);
    throw error;
  }
}

// ✅ Add new data to store
export async function addToStore(
  query: string,
  embedding: number[],
  content: any
) {
  const store = await getVectorStore();

  const doc = new Document({
    pageContent: JSON.stringify(content),
    metadata: { query },
  });

  await store.addVectors([embedding], [doc]);
}
