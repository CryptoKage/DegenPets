// api/ask-docs-agent.js
import OpenAI from 'openai';
import fetch from 'node-fetch'; // Still needed for OpenAI API calls
// We don't need GITBOOK_TOKEN or GITBOOK_SPACE_ID here anymore

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_CHAT_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
// OPENAI_EMBEDDING_MODEL is needed for the user's question embedding
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';


let vectorStore = null; // Will hold embeddings loaded from JSON

// Cosine similarity helper (same as before)
function cosine(a, b) { /* ... same ... */ }

async function loadVectorStore() {
    if (vectorStore !== null) { // null means not attempted, [] means attempt made but maybe empty
        console.log("DEBUG: Vector store already loaded or load attempted.");
        return;
    }
    console.log("DEBUG: Loading pre-generated embeddings from JSON...");
    try {
        // Construct the URL to fetch the JSON from the public folder of the deployed site
        // VERCEL_URL is an environment variable provided by Vercel containing the main deployment URL
        const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'; // Fallback for local dev
        const embeddingsUrl = `${siteUrl}/ai-data/docs_embeddings.json`;

        console.log("DEBUG: Fetching embeddings from:", embeddingsUrl);
        const response = await fetch(embeddingsUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch embeddings JSON: ${response.status} ${response.statusText} from ${embeddingsUrl}`);
        }
        const loadedEmbeddings = await response.json();
        if (Array.isArray(loadedEmbeddings)) {
            vectorStore = loadedEmbeddings;
            console.log(`Successfully loaded ${vectorStore.length} embeddings from JSON.`);
        } else {
            throw new Error("Embeddings JSON is not an array.");
        }
    } catch (error) {
        console.error("CRITICAL Error loading vector store from JSON:", error);
        vectorStore = []; // Set to empty on error to prevent retries this instance
    }
}


export default async function handler(req, res) {
  if (req.method !== 'POST') { return res.status(405).json({ error: "Method Not Allowed" }); }

  if (vectorStore === null) { // Load only if not attempted yet
    await loadVectorStore();
  }

  if (!vectorStore || vectorStore.length === 0) {
    console.error("Handler: Vector store empty. Cannot answer.");
    return res.status(503).json({ error: "AI agent knowledge base is unavailable. Please try again later." });
  }

  const { question, history = [] } = req.body;
  if (!question || typeof question !== 'string' || question.trim() === "") { return res.status(400).json({ error: "Question missing." }); }

  console.log(`Handler: Received question: "${question}"`);

  try {
    const qEmbResponse = await openai.embeddings.create({ input: question, model: OPENAI_EMBEDDING_MODEL });
    if (!qEmbResponse.data?.[0]?.embedding) { throw new Error("Failed question embedding."); }
    const qEmb = qEmbResponse.data[0].embedding;

    const topContextChunks = vectorStore.map(c => ({ ...c, score: cosine(qEmb, c.embedding) })).sort((a, b) => b.score - a.score).slice(0, 3);
    console.log("DEBUG: Top context scores:", topContextChunks.map(c => (typeof c.score === 'number' && !isNaN(c.score)) ? c.score.toFixed(4) : 'Invalid Score'));

    let contextText = ""; let useContext = false; let mostRelevantSourcePath = null; let mostRelevantSourceTitle = null;
    const RELEVANCE_THRESHOLD = 0.35; // Adjust as needed

    if (topContextChunks.length > 0 && topContextChunks[0].score > RELEVANCE_THRESHOLD) {
        useContext = true; contextText = topContextChunks.map(c => `Source: ${c.sourceTitle} (Path: ${c.sourcePath})\n${c.text}`).join('\n---\n');
        mostRelevantSourcePath = topContextChunks[0].sourcePath; mostRelevantSourceTitle = topContextChunks[0].sourceTitle;
        console.log("DEBUG: Using context from docs for chat.");
    } else { console.log("No sufficiently relevant context."); contextText = "No specific context found. Answer generally or state info not available."; }

    const messages = [ { role: 'system', content: 'You are DegenBot... Strict answer... If no context, say so.' }, { role: 'system', content: `Context:\n${contextText}` }, ...history.flatMap(h => [ { role: 'user', content: h.user }, { role: 'assistant', content: h.ai } ]), { role: 'user', content: question } ];
    const chat = await openai.chat.completions.create({ model: OPENAI_CHAT_MODEL, messages, temperature: 0.1, max_tokens: 700 });
    if (!chat.choices?.[0]?.message?.content) { throw new Error("OpenAI chat structure error."); }
    let finalAnswer = chat.choices[0].message.content;
    if (useContext && mostRelevantSourcePath && mostRelevantSourceTitle) { const gitbookBaseUrl = "https://degen-pets-1.gitbook.io/degen-pets/"; const fullSourceUrl = gitbookBaseUrl + mostRelevantSourcePath.replace(/^\//, ''); finalAnswer += `\n\nSource: [${mostRelevantSourceTitle}](${fullSourceUrl})`; console.log(`DEBUG: Appended source: ${fullSourceUrl}`); }
    res.status(200).json({ answer: finalAnswer });
  } catch (error) { console.error("Error in AI handler execution:", error); let errorMessage = "Error processing request."; if (error.status === 429) { errorMessage = "AI assistant overloaded."; } res.status(500).json({ error: errorMessage, details: error.message }); }
}