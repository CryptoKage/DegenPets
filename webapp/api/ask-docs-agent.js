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

// api/ask-docs-agent.js

// ... (OpenAI, fetch, SPACE_ID, TOKEN, vectorStore, splitIntoChunks, cosine - all same) ...

// api/ask-docs-agent.js

// ... (OpenAI, fetch, SPACE_ID, TOKEN, vectorStore, splitIntoChunks, cosine - all same) ...

// --- NEW: Recursive function to extract text from GitBook document nodes ---
function extractTextFromGitBookNodes(nodes) {
    let fullText = "";
    if (!Array.isArray(nodes)) {
        return fullText;
    }

    for (const node of nodes) {
        if (node.object === 'text' && node.leaves) {
            for (const leaf of node.leaves) {
                if (leaf.text) {
                    fullText += leaf.text + " "; // Add space between leaves
                }
            }
        } else if (node.object === 'block' || node.object === 'inline') {
            // Common block types that contain text or further nodes
            if (node.type === 'paragraph' || node.type === 'heading-1' || node.type === 'heading-2' || node.type === 'heading-3' || node.type === 'list-item' || node.type === 'table-cell') {
                if (node.nodes) {
                    fullText += extractTextFromGitBookNodes(node.nodes); // Recurse
                }
            } else if (node.type === 'code') { // Handle code blocks
                if (node.data && node.data.code) {
                    fullText += node.data.code + "\n"; // Add code block content
                }
            } else if (node.nodes) { // Generic recursion for other block types with nodes
                 fullText += extractTextFromGitBookNodes(node.nodes);
            }
        }
        fullText += "\n"; // Add a newline after processing a main node for better separation
    }
    return fullText.replace(/\s+/g, ' ').trim(); // Normalize whitespace
}
// --- END NEW FUNCTION ---

let text = '';
if (pageContentJson && pageContentJson.document && Array.isArray(pageContentJson.document.nodes)) {
    text = extractTextFromGitBookNodes(pageContentJson.document.nodes);
    console.log(`DEBUG: Extracted text for "${pageInfo.title}" (first 100): ${text.substring(0, 100)}`);
} else {
    console.warn(`No 'document.nodes' found for page "${pageInfo.title}". Structure:`, JSON.stringify(pageContentJson, null, 2).substring(0, 300));
}

async function initVectorStore() {
  if (vectorStore !== null) { /* ... */ return; }
  console.log("DEBUG: Initializing vector store..."); vectorStore = [];
  try {
    const hierarchyUrl = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content`;
    console.log("DEBUG: Fetching GitBook hierarchy:", hierarchyUrl);
    const hierarchyRes = await fetch(hierarchyUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!hierarchyRes.ok) { const errorText = await hierarchyRes.text(); console.error(`GitBook Hierarchy API Error: ${hierarchyRes.status} - ${errorText}`); return; }
    const hierarchyJson = await hierarchyRes.json();
    // console.log("DEBUG: Full GitBook Hierarchy Response:", JSON.stringify(hierarchyJson, null, 2)); // Keep for deep debug

    let pagesToFetchContentFor = [];
    function collectPages(pageObject) { if (!pageObject) return; if (pageObject.type === 'document' && pageObject.id) { pagesToFetchContentFor.push({ id: pageObject.id, title: pageObject.title, path: pageObject.path }); } if (pageObject.pages && Array.isArray(pageObject.pages)) { for (const subPage of pageObject.pages) { collectPages(subPage); } } }
    if (hierarchyJson && Array.isArray(hierarchyJson.pages)) { for (const topLevelPage of hierarchyJson.pages) { collectPages(topLevelPage); } }
    else { console.error("GitBook API Error: Root 'pages' array missing."); return; }
    console.log(`DEBUG: Found ${pagesToFetchContentFor.length} potential content pages.`);
    if (pagesToFetchContentFor.length === 0) return;

    let tempVectorStore = []; let pagesSuccessfullyProcessed = 0;
    for (const pageInfo of pagesToFetchContentFor) {
        try {
            const pageContentUrl = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content/page/${pageInfo.id}`;
            console.log(`DEBUG: Fetching content for page "${pageInfo.title}" from ${pageContentUrl}`);
            const pageRes = await fetch(pageContentUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });
            if (!pageRes.ok) { console.warn(`Failed to fetch "${pageInfo.title}": ${pageRes.status}`); continue; }
            const pageContentJson = await pageRes.json();

            // ---> USE NEW TEXT EXTRACTION FUNCTION <---
            let text = '';
            if (pageContentJson && pageContentJson.document && Array.isArray(pageContentJson.document.nodes)) {
                text = extractTextFromGitBookNodes(pageContentJson.document.nodes);
                console.log(`DEBUG: Extracted text for "${pageInfo.title}" (first 100): ${text.substring(0, 100)}`);
            } else {
                console.warn(`No 'document.nodes' found for page "${pageInfo.title}". Structure:`, JSON.stringify(pageContentJson, null, 2).substring(0, 300));
            }
            // ---> END TEXT EXTRACTION <---

            if (text.trim()) {
                for (const chunk of splitIntoChunks(text)) { /* ... embedding logic ... */ }
                pagesSuccessfullyProcessed++;
            } else { console.log(`DEBUG: SKIPPING "${pageInfo.title}" (no text after extraction).`); }
        } catch (pageError) { console.error(`Error processing page "${pageInfo.title}":`, pageError); }
    }
    vectorStore = tempVectorStore;
    console.log(`Successfully initialized ${vectorStore.length} chunks from ${pagesSuccessfullyProcessed} GitBook page(s) with content.`);
  } catch (error) { console.error("Error in initVectorStore:", error); vectorStore = []; }
}

// ... (cosine function and export default async function handler remain the same) ...



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