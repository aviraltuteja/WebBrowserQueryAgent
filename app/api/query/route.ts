import { NextRequest } from "next/server";
import { config } from "dotenv";
import { searchDuckDuckGo } from "@/lib/scraper";
import { summarize } from "@/lib/summarizer";
import { addToStore, findSimilar, getEmbedding } from "@/lib/vectorStore";

config();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query } = body;

  if (!query || query.length < 5) {
    return new Response(JSON.stringify({ error: "Invalid query." }), {
      status: 400,
    });
  }
  const queryEmbedding = await getEmbedding(query);

  // 🔍 Check if similar query exists in vector store
  const similarResult = await findSimilar(queryEmbedding, 0.8);

  if (similarResult) {
    // If found similar, return that
    const parsedResults = JSON.parse(similarResult);

    return new Response(JSON.stringify({ results: parsedResults }), {
      status: 200,
    });
  }
  // 🔍 Run scraper
  const urls = await searchDuckDuckGo(query);

  // 📄 Fetch + summarize each page content (simplified)
  const summaries = await Promise.all(
    urls.map(async (url: string) => {
      const content = `Content from: ${url}`; // placeholder (can scrape content)
      const summary = await summarize(content);
      return { url, summary };
    })
  );
  await addToStore(query, queryEmbedding, summaries);

  return new Response(JSON.stringify({ results: summaries }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
