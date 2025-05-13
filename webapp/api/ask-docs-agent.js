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
    // Log the entire response to see its full structure
    console.log("DEBUG: Full GitBook API Response JSON:", JSON.stringify(responseJson, null, 2));

    // Check if the response has a 'pages' array directly
    if (!responseJson || !Array.isArray(responseJson.pages)) {
        console.error("GitBook API Error: Response missing 'pages' array or is not an array. Structure might be different.");
        // Alternative: Does it have a root page object with sub-pages?
        // Example: if (responseJson.type === 'document' && responseJson.document && Array.isArray(responseJson.document.nodes)) { ... }
        // We need to inspect the Full GitBook API Response to know for sure.
        return;
    }

    const pagesToProcess = responseJson.pages; // Assuming 'pages' is the array of page objects
    console.log(`DEBUG: Found ${pagesToProcess.length} page(s) in the initial GitBook response.`);

    let tempVectorStore = [];
    if (pagesToProcess.length === 0) {
        console.warn("DEBUG: No pages found in GitBook response to process.");
    }

    for (const page of pagesToProcess) {
      console.log(`DEBUG: Processing page - Title: "${page.title || 'Untitled'}", ID: ${page.id}, Path: ${page.path || 'N/A'}`);
      // Determine the best field for text content: page.markdown, then page.document.text, then page.html
      let text = '';
      if (page.markdown) {
          text = page.markdown;
          console.log(`DEBUG: Using markdown for page "${page.title || 'Untitled'}"`);
      } else if (page.document && page.document.text) { // Some GitBook API versions might nest text here
          text = page.document.text;
          console.log(`DEBUG: Using document.text for page "${page.title || 'Untitled'}"`);
      } else if (page.html) {
          text = page.html; // As a fallback, might need stripping HTML tags later
          console.log(`DEBUG: Using html (fallback) for page "${page.title || 'Untitled'}"`);
      } else {
          console.log(`DEBUG: No markdown, document.text, or html content found for page "${page.title || 'Untitled'}"`);
      }

      console.log(`DEBUG: Extracted text (first 100 chars) for "${page.title || 'Untitled'}":`, text.substring(0, 100));

      if (!text.trim()) {
          console.log(`DEBUG: SKIPPING page "${page.title || 'Untitled'}" due to empty/whitespace text content.`);
          continue;
      }

      for (const chunk of splitIntoChunks(text)) {
        // ... (rest of chunking and embedding logic - keep as is) ...
      }
    }
    vectorStore = tempVectorStore;
    console.log(`Successfully initialized ${vectorStore.length} chunks from GitBook.`);

  } catch (error) { /* ... error handling ... */ }
}

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