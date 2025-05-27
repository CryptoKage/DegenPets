// api/ask-docs-agent.js
import OpenAI from 'openai';
import fetch from 'node-fetch'; // Still needed for OpenAI API calls
import fs from 'fs/promises';   // For file system access
import path from 'path';      // For path manipulation
import { fileURLToPath } from 'url';


// --- Configuration ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_CHAT_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';

let vectorStore = null; // Will hold embeddings loaded from JSON

// --- Helper Functions ---
// splitIntoChunks and extractTextFromGitBookNodes are NO LONGER NEEDED HERE
// as they are only used by the local generate-embeddings.mjs script.

// Cosine similarity helper
function cosine(a, b) {
  if (!a || !b || !Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) {
    console.warn("DEBUG COSINE: Invalid or mismatched vectors provided.");
    return 0;
  }
  const dot = a.reduce((sum, v, i) => sum + (v * b[i]), 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + (v * v), 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + (v * v), 0));

  if (isNaN(dot) || isNaN(magA) || isNaN(magB)) {
    console.warn("DEBUG COSINE: NaN detected in dot product or magnitudes.");
    return 0;
  }
  if (magA === 0 || magB === 0) {
    console.warn("DEBUG COSINE: Zero magnitude vector detected.");
    return 0;
  }
  const similarity = dot / (magA * magB);
  if (isNaN(similarity)) {
      console.warn("DEBUG COSINE: Resulting similarity is NaN. Inputs:", {dot, magA, magB});
      return 0;
  }
  return similarity;
}


async function loadVectorStore() {
    if (vectorStore !== null) { /* ... */ return; }
    console.log("DEBUG: Loading pre-generated embeddings from local JSON file...");
    vectorStore = [];

    try {
        const __filenameCurrent = fileURLToPath(import.meta.url);
        const __dirnameCurrent = path.dirname(__filenameCurrent); // This will be /var/task/api/ (or similar)

        // The docs_embeddings.json should be in a subdirectory 'ai-data'
        // RELATIVE to where this ask-docs-agent.js script is.
        // So, if script is api/ask-docs-agent.js and JSON is api/ai-data/docs_embeddings.json
        const filePath = path.resolve(__dirnameCurrent, 'ai-data', 'docs_embeddings.json');

        console.log("DEBUG: Attempting to read embeddings file from resolved path:", filePath);
        console.log("DEBUG: Current Lambda working directory (process.cwd()):", process.cwd()); // Usually /var/task
        console.log("DEBUG: __dirname for current module (derived):", __dirnameCurrent); // Should be /var/task/api

        await fs.access(filePath); // Check if file exists at this path
        console.log("DEBUG: Embeddings file confirmed to exist at path via fs.access.");

        const fileContent = await fs.readFile(filePath, 'utf-8');
        const loadedEmbeddings = JSON.parse(fileContent);

        if (Array.isArray(loadedEmbeddings)) {
            vectorStore = loadedEmbeddings;
            console.log(`Successfully loaded ${vectorStore.length} embeddings from bundled JSON file.`);
        } else {
            throw new Error("Embeddings JSON is not an array or is malformed.");
        }
    } catch (error) {
        console.error("CRITICAL Error loading vector store from JSON file:", error);
        if (error.code === 'ENOENT') {
            const currentModuleDir = path.dirname(fileURLToPath(import.meta.url));
            console.error("DEBUG: File not found (ENOENT). Path attempted:", path.resolve(currentModuleDir, 'ai-data', 'docs_embeddings.json'));
            try {
                const apiDirContents = await fs.readdir(currentModuleDir);
                console.log("DEBUG: Contents of current module's directory (__dirname derived):", apiDirContents);
                if (apiDirContents.includes('ai-data')) {
                    const aiDataDirContents = await fs.readdir(path.resolve(currentModuleDir, 'ai-data'));
                    console.log("DEBUG: Contents of 'ai-data' directory (relative to current module):", aiDataDirContents);
                } else {
                     console.log("DEBUG: 'ai-data' directory NOT FOUND directly next to ask-docs-agent.js.");
                }
            } catch (dirReadError) { console.warn("DEBUG: Could not read directory contents.", dirReadError); }
        }
    }
}

// --- Main Handler Function ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log(`Handler: Non-POST request: ${req.method}`);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Load vector store on first request to this function instance
  if (vectorStore === null) {
    await loadVectorStore();
  }

  if (!vectorStore || vectorStore.length === 0) {
    console.error("Handler: Vector store empty. Cannot answer questions.");
    let internalErrorDetail = "Knowledge base initialization failed or is empty.";
    if (!process.env.OPENAI_API_KEY) internalErrorDetail = "OpenAI API Key missing in environment.";
    else if (vectorStore === null) internalErrorDetail = "Vector store loading was not attempted or failed critically.";
    else if (vectorStore.length === 0) internalErrorDetail = "Vector store loaded but is empty (no embeddings found/processed).";
    console.error("Internal Error Detail for empty vector store:", internalErrorDetail);
    return res.status(503).json({ error: "AI agent knowledge base is unavailable. This might be due to an issue fetching/processing documentation. Please try again shortly." });
  }

  const { question, history = [] } = req.body;
  if (!question || typeof question !== 'string' || question.trim() === "") {
    return res.status(400).json({ error: "Question missing or empty." });
  }

  console.log(`Handler: Received question: "${question}"`);

  try {
    const qEmbResponse = await openai.embeddings.create({ input: question, model: OPENAI_EMBEDDING_MODEL });
    if (!qEmbResponse.data?.[0]?.embedding) { throw new Error("Failed question embedding from OpenAI."); }
    const qEmb = qEmbResponse.data[0].embedding;

    const topContextChunks = vectorStore
        .map(c => ({ ...c, score: cosine(qEmb, c.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3); // Get top 3 most relevant chunks

    console.log("DEBUG: Top context scores:", topContextChunks.map(c =>
        (typeof c.score === 'number' && !isNaN(c.score)) ? c.score.toFixed(4) : 'Invalid Score'
    ));

    let contextText = "";
    let useContext = false;
    let mostRelevantSourcePath = null;
    let mostRelevantSourceTitle = null;
    const RELEVANCE_THRESHOLD = 0.35; // Adjust this threshold based on testing

    if (topContextChunks.length > 0 && topContextChunks[0].score > RELEVANCE_THRESHOLD) {
        useContext = true;
        contextText = topContextChunks.map(c => `Source Document: ${c.sourceTitle}\nContent:\n${c.text}`).join('\n---\n'); // Slightly changed context format
        mostRelevantSourcePath = topContextChunks[0].sourcePath;
        mostRelevantSourceTitle = topContextChunks[0].sourceTitle;
        console.log("DEBUG: Using context from docs for chat completion.");
    } else {
        console.log("DEBUG: No sufficiently relevant context found. Top score was:", topContextChunks[0]?.score?.toFixed(4) || "N/A");
        contextText = "The Degen Pets documentation doesn't seem to contain a specific answer to this query. I can only answer based on that information."; // More direct fallback
    }

    const messages = [
        { role: 'system', content: 'You are DegenBot, an AI assistant for the Degen Pets game. Answer questions strictly based on the provided "Context from Degen Pets Docs". If the context doesn\'t directly answer the question, state that the information was not found in the provided documentation. Do not speculate or use external knowledge. Be concise and helpful.' },
        { role: 'system', content: `Context from Degen Pets Docs:\n${contextText}` },
        ...history.flatMap(h => [ { role: 'user', content: h.user }, { role: 'assistant', content: h.ai } ]),
        { role: 'user', content: question }
    ];

    const chat = await openai.chat.completions.create({ model: OPENAI_CHAT_MODEL, messages, temperature: 0.1, max_tokens: 700 });
    if (!chat.choices?.[0]?.message?.content) { throw new Error("OpenAI chat completion returned unexpected structure."); }

    let finalAnswer = chat.choices[0].message.content;

    // Append source link IF specific context was used and deemed relevant
    if (useContext && mostRelevantSourcePath && mostRelevantSourceTitle && topContextChunks[0].score > RELEVANCE_THRESHOLD) {
        const gitbookBaseUrl = "https://degen-pets-1.gitbook.io/degen-pets/"; // Your GitBook URL
        const fullSourceUrl = gitbookBaseUrl + mostRelevantSourcePath.replace(/^\//, '');
        finalAnswer += `\n\nSource: [${mostRelevantSourceTitle}](${fullSourceUrl})`;
        console.log(`DEBUG: Appended source link: ${fullSourceUrl}`);
    }

    res.status(200).json({ answer: finalAnswer });

  } catch (error) {
      console.error("Error in AI handler execution:", error);
      let errorMessage = "Sorry, I encountered an error processing your request.";
      if (error.status === 429) { errorMessage = "AI assistant is currently overloaded. Please try again later."; }
      else if (error.message?.includes("embedding")) { errorMessage = "Issue processing question with AI. Try rephrasing." }
      if (!res.headersSent) { // Check if headers already sent
        res.status(500).json({ error: errorMessage, details: error.message });
      }
  }
}