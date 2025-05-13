// api/ask-docs-agent.js
import OpenAI from 'openai';
import fetch from 'node-fetch'; // Or use global fetch if Node version supports it reliably

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SPACE_ID = process.env.GITBOOK_SPACE_ID;
const TOKEN    = process.env.GITBOOK_TOKEN;

let vectorStore = null; // Initialize once globally

// Split long text into ~1000-char chunks
function splitIntoChunks(text, size = 1000) {
  const paras = text.split(/\n{2,}/), chunks = [];
  let buf = '';
  for (const p of paras) {
    if ((buf + '\n\n' + p).length > size) {
      if (buf) chunks.push(buf);
      buf = p;
    } else {
      buf = buf ? buf + '\n\n' + p : p;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

// On cold start, fetch & embed all GitBook pages
async function initVectorStore() {
  // Only run if vectorStore hasn't been initialized yet for this instance
  if (vectorStore !== null) { // Changed condition to check for null
    console.log("DEBUG: Vector store already initialized or initialization attempted.");
    return;
  }

  console.log("DEBUG: Initializing vector store...");
  vectorStore = []; // Initialize to empty array to indicate attempt started

  try {
    const res = await fetch(
        `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content`,
        { headers: { Authorization: `Bearer ${TOKEN}` } }
    );

    if (!res.ok) {
        const errorText = await res.text();
        console.error(`GitBook API Error: ${res.status} - ${errorText}`);
        // vectorStore remains empty, subsequent calls might retry or fail gracefully
        return; // Exit initVectorStore if GitBook fetch fails
    }

    const responseJson = await res.json();
    console.log("DEBUG: GitBook API Response JSON (first 500 chars):", JSON.stringify(responseJson, null, 2).substring(0, 500));

    if (!responseJson || !responseJson.data || !Array.isArray(responseJson.data.pages)) {
        console.error("GitBook API Error: Unexpected response structure or missing 'data.pages'. Full response logged above (if not too large).");
        // vectorStore remains empty
        return; // Exit initVectorStore
    }

    const { pages } = responseJson.data; // Destructure pages directly
    let tempVectorStore = []; // Build locally then assign

    for (const page of pages) { // Loop through data.pages
      const text = page.markdown || page.html || ''; // Prefer markdown
      if (!text.trim()) continue; // Skip empty pages

      for (const chunk of splitIntoChunks(text)) {
        if (!chunk.trim()) continue; // Skip empty chunks
        try {
            const emb = await openai.embeddings.create({
                input: chunk,
                model: 'text-embedding-3-small' // Ensure this model is available to your key
            });
            if (emb.data && emb.data[0] && emb.data[0].embedding) {
                tempVectorStore.push({
                    text: chunk,
                    embedding: emb.data[0].embedding
                });
            } else {
                 console.warn("OpenAI embedding failed or returned unexpected structure for a chunk.");
            }
        } catch (embeddingError) {
            console.error("Error during OpenAI embedding for a chunk:", embeddingError);
            // Decide if you want to skip this chunk or stop the whole process
            // For now, it will skip the problematic chunk
        }
      }
    }
    vectorStore = tempVectorStore; // Assign after successful processing
    console.log(`Successfully initialized ${vectorStore.length} chunks from GitBook.`);

  } catch (error) {
    console.error("Error in initVectorStore:", error);
    vectorStore = []; // Ensure it's at least an empty array on critical error
    // Depending on the error, you might want to re-throw or handle differently
  }
} // <<< CLOSING BRACE FOR initVectorStore FUNCTION

// Cosine similarity helper
function cosine(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0; // Basic validation
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  if (magA === 0 || magB === 0) return 0; // Avoid division by zero
  return dot / (magA * magB);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log(`Handler received non-POST request: ${req.method}`);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Ensure vector store is initialized (idempotent check)
  if (vectorStore === null) { // Check for null to allow retrying initialization
    await initVectorStore();
  }

  // Check if vector store initialization failed or is empty
  if (!vectorStore || vectorStore.length === 0) {
    console.error("Vector store is not initialized or is empty. Cannot answer questions.");
    return res.status(503).json({ error: "AI agent is not ready, knowledge base unavailable." });
  }

  const { question, history = [] } = req.body;
  if (!question || typeof question !== 'string' || question.trim() === "") {
    return res.status(400).json({ error: "Question is missing or empty." });
  }


  try {
    // 1) Embed the user’s question
    const qEmbResponse = await openai.embeddings.create({
        input: question,
        model: 'text-embedding-3-small'
    });
    if (!qEmbResponse.data || !qEmbResponse.data[0] || !qEmbResponse.data[0].embedding) {
        throw new Error("Failed to get embedding for the question.");
    }
    const qEmb = qEmbResponse.data[0].embedding;

    // 2) Find top 3 relevant chunks
    const topContextChunks = vectorStore
        .map(c => ({ ...c, score: cosine(qEmb, c.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // Keep the chunk objects with scores

    console.log("DEBUG: Top context chunks scores:", topContextChunks.map(c => c.score));
    const topContextText = topContextChunks.map(c => c.text).join('\n---\n');

    if (topContextChunks.length === 0 || topContextChunks[0].score < 0.7) { // Adjust relevance threshold
        console.log("No sufficiently relevant context found in docs.");
        // Fallback response or indicate no context found
        return res.status(200).json({ answer: "I couldn't find specific information about that in the Degen Pets documentation. You might find more at [Your GitBook Link] or ask in our Discord!" });
    }

    // 3) Build the chat messages
    const messages = [
        { role: 'system',    content: 'You are a helpful assistant for the Degen Pets game. Answer based on the provided Degen Pets documentation context. If the context doesn\'t have the answer, say you couldn\'t find it in the docs.' },
        { role: 'system',    content: `Context from Degen Pets documentation:\n${topContextText}` },
        ...history.flatMap(h => [
        { role: 'user',      content: h.user },
        { role: 'assistant', content: h.ai }
        ]),
        { role: 'user',      content: question }
    ];

    // 4) Call OpenAI Chat
    const chat = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages,
        temperature: 0.2,
        max_tokens: 512
    });

    if (!chat.choices || !chat.choices[0] || !chat.choices[0].message || !chat.choices[0].message.content) {
        throw new Error("OpenAI chat completion returned unexpected structure.");
    }

    res.status(200).json({ answer: chat.choices[0].message.content });

  } catch (error) {
      console.error("Error in AI handler:", error);
      let errorMessage = "Sorry, I encountered an error.";
      if (error.status === 429) { // Specific handling for OpenAI quota error
          errorMessage = "The AI assistant is currently overloaded. Please try again later.";
      } else if (error.message?.includes("embedding")) {
           errorMessage = "There was an issue processing the question with the AI. Please try rephrasing."
      }
      res.status(500).json({ error: errorMessage, details: error.message });
  }
}