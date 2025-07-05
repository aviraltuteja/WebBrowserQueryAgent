export async function summarize(content: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_KEY;

  // Moderation call equivalent — OpenRouter doesn't have one by default
  // so we'll skip it, or you can add your own if needed via a different endpoint

  // Main summarization request
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openrouter/cypher-alpha:free", // or pick any supported model from https://openrouter.ai/docs#models
        messages: [
          { role: "system", content: "Summarize this webpage content." },
          { role: "user", content },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error response:", errorText);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}
