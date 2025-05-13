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
// Inside initVectorStore in api/ask-docs-agent.js

// Inside api/ask-docs-agent.js

async function initVectorStore() {
  if (vectorStore !== null) {
    console.log("DEBUG: Vector store already initialized or initialization attempted.");
    return;
  }
  console.log("DEBUG: Initializing vector store...");
  vectorStore = []; // Initialize to empty array

  try {
    const gitbookContentUrl = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content`;
    console.log("DEBUG: Fetching GitBook content from:", gitbookContentUrl);
    const res = await fetch(
        gitbookContentUrl,
        { headers: { Authorization: `Bearer ${TOKEN}` } }
    );

    if (!res.ok) {
        const errorText = await res.text();
        console.error(`GitBook API Error: ${res.status} - ${errorText}`);
        return;
    }

    const responseJson = await res.json();
    console.log("DEBUG: Full GitBook API Response JSON (structure check - first 500 chars):", JSON.stringify(responseJson, null, 2).substring(0, 500));

    let tempVectorStore = [];
    let pagesProcessedCount = 0;

    // --- Recursive function to process pages and their sub-pages ---
    async function processPage(pageObject) {
        if (!pageObject) return;

        console.log(`DEBUG: Processing page candidate - Title: "${pageObject.title || 'Untitled'}", Path: ${pageObject.path || 'N/A'}`);

        // Attempt to get text content for the current page object
        // The actual content might be in different fields depending on GitBook's structure for that page type
        // The API response you showed doesn't have markdown/html at higher levels, it's usually on leaf nodes.
        // We need to find where the actual content is stored.
        // GitBook API sometimes returns page content in a 'document' object within the page object.
        // Let's assume for now content is in 'page.document.markdown' or 'page.document.content' or similar for detailed pages.
        // The structure you provided shows NO direct markdown/html on the parent pages.
        // THIS MEANS THE CURRENT `/content` ENDPOINT GIVES A HIERARCHY, NOT FLAT PAGE CONTENT.

        // We need to fetch individual page content if this endpoint only gives hierarchy.
        // For now, let's try to extract what we can.
        // If a page object HAS content directly (unlikely for hierarchical nodes):
        let text = pageObject.markdown || pageObject.html || (pageObject.document ? pageObject.document.text : '') || '';

        if (text.trim()) {
            pagesProcessedCount++;
            console.log(`DEBUG: Page "${pageObject.title}" HAS text content (first 100): ${text.substring(0,100)}`);
            for (const chunk of splitIntoChunks(text)) {
                if (!chunk.trim()) continue;
                try {
                    const emb = await openai.embeddings.create({ input: chunk, model: 'text-embedding-3-small' });
                    if (emb.data && emb.data[0] && emb.data[0].embedding) {
                        tempVectorStore.push({ text: chunk, embedding: emb.data[0].embedding, sourceTitle: pageObject.title, sourcePath: pageObject.path });
                    }
                } catch (embeddingError) { console.error(`Embedding error for chunk from "${pageObject.title}":`, embeddingError); }
            }
        } else {
             console.log(`DEBUG: Page "${pageObject.title}" has NO direct text content in this object.`);
        }

        // Recursively process sub-pages if they exist
        if (pageObject.pages && Array.isArray(pageObject.pages) && pageObject.pages.length > 0) {
            console.log(`DEBUG: Page "${pageObject.title}" has ${pageObject.pages.length} sub-pages. Processing them...`);
            for (const subPage of pageObject.pages) {
                await processPage(subPage); // Recursive call
            }
        }
    }
    // --- End of recursive function ---

    // Start processing from the top-level pages array from the API response
    if (responseJson && Array.isArray(responseJson.pages)) {
        for (const topLevelPage of responseJson.pages) {
            await processPage(topLevelPage);
        }
    } else {
        console.error("GitBook API Error: Root 'pages' array missing or not an array.");
    }

    vectorStore = tempVectorStore;
    console.log(`Successfully initialized ${vectorStore.length} chunks from ${pagesProcessedCount} GitBook page(s) with content.`);

  } catch (error) {
    console.error("Error in initVectorStore:", error);
    vectorStore = [];
  }
} // End initVectorStore


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