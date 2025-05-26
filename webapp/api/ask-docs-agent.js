// api/ask-docs-agent.js
import OpenAI from 'openai';
import fetch from 'node-fetch'; // Still needed for OpenAI API calls
import fs from 'fs/promises';   // For file system access
import path from 'path';      // For path manipulation

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_CHAT_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small'; // Embedding model used by generate-embeddings.mjs

let vectorStore = null; // Will hold embeddings loaded from JSON

// Helper functions (assuming these are not needed here anymore as they are in generate-embeddings.mjs)
// If splitIntoChunks or extractTextFromGitBookNodes were needed here for some other reason,
// they would need to be defined or imported. For loading pre-computed embeddings, they aren't.

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
    if (vectorStore !== null) {
        console.log("DEBUG: Vector store already loaded or load attempted.");
        return;
    }
    console.log("DEBUG: Loading pre-generated embeddings from local JSON file...");
    vectorStore = []; // Initialize to ensure it's an array even if loading fails

    try {
        // Construct the path to the JSON file.
        // In Vercel, serverless functions are typically executed from /var/task (project root).
        // Your 'webapp/public' contents are copied to the 'static' output directory,
        // but for reading within the function, we need to find it relative to where Vite builds 'public'.
        // Vite copies `webapp/public/*` to `webapp/dist/*`.
        // When Vercel deploys, it uses `webapp` as the root, so the `dist` folder is at `webapp/dist`.
        // The serverless function in `api/` runs from the project root.
        // So, the path from the function to the file inside the built 'public' (now 'dist') assets is:
        // `webapp/dist/ai-data/docs_embeddings.json`
        // However, Vercel's build output for static files from a Vite project with `root: 'webapp'`
        // and `outDir: 'webapp/dist'` will serve `webapp/public/ai-data/docs_embeddings.json`
        // from `/ai-data/docs_embeddings.json`.
        // For a serverless function to read it from the filesystem after deployment,
        // the path needs to be relative to where Vercel places the *built static assets*.
        // The `process.cwd()` in a Vercel function is the root of your project.
        // Vite builds output to `webapp/dist/`. This `dist` becomes part of the serverless deployment.
        // Vercel might place the `api` folder and the static output (`.vercel/output/static`) separately.

        // The most reliable way for a serverless function to access a bundled static file
        // is to assume it's relative to the function's execution path.
        // Let's try a path that assumes 'webapp/public' contents are available at the root of the static deployment.
        // Vercel copies the contents of `publicDir` (which is `webapp/public`) into the root of the final `static` output.
        // The serverless function runs from `/var/task/api/ask-docs-agent.js`.
        // The static assets are often in a sibling `static` directory or accessible via a path from root.

        // This path assumes that Vercel makes the 'public' directory contents available
        // at the root of the output served by the deployment.
        // Let's try a path relative to the function's working directory.
        // The `generate-embeddings.mjs` script saves it to `webapp/public/ai-data/docs_embeddings.json`.
        // When Vercel builds, this becomes part of the static assets.
        // A common pattern is that static assets are in a directory a function can access.
        const filePath = path.join(process.cwd(), '.vercel', 'output', 'static', 'ai-data', 'docs_embeddings.json');
        // This path is an educated guess for Vercel's build output structure for static assets.
        // If this doesn't work, we may need to log `fs.readdirSync(path.join(process.cwd(), '.vercel', 'output', 'static'))`
        // to see the actual structure, or simplify by placing the JSON directly in the /api folder.

        // --- SAFER ALTERNATIVE: Place JSON in /api folder during build ---
        // If you copy `docs_embeddings.json` to your `api/` folder (e.g., `api/ai-data/docs_embeddings.json`)
        // then the path would be much simpler:
        // const filePath = path.join(__dirname, 'ai-data', 'docs_embeddings.json');
        // For now, let's assume the file is in `webapp/public/ai-data` and we try to construct the path
        // to where Vercel would place it after the build.

        // Let's try the path assuming the `generate-embeddings.mjs` script places it correctly
        // in `webapp/public/ai-data/` and Vercel serves `webapp/public` as the root for static assets.
        // The serverless function itself, when deployed, might have a different CWD.
        // A common pattern for accessing files bundled with a serverless function:
        let resolvedPath = path.resolve(process.cwd(), 'webapp/public/ai-data/docs_embeddings.json');
        if (process.env.VERCEL) { // Vercel specific path adjustment
            resolvedPath = path.resolve(process.env.LAMBDA_TASK_ROOT || process.cwd() , 'webapp/public/ai-data/docs_embeddings.json');
            // Sometimes static assets from a "public" dir are copied to the root of the serverless function's deployment package.
            // Or, if Vite is configured with `webapp` as root, then `public` is relative to that.
            // Vercel copies the output of `webapp/dist` (which includes `webapp/public` contents at its root)
            // Let's try path relative to LAMBDA_TASK_ROOT which is often /var/task
             resolvedPath = path.resolve(process.env.LAMBDA_TASK_ROOT || process.cwd(), 'ai-data/docs_embeddings.json');
             // This assumes that Vite's build process copied webapp/public/ai-data to dist/ai-data,
             // and Vercel makes the contents of 'dist' (our outputDir from webapp) available at LAMBDA_TASK_ROOT.
        }


        console.log("DEBUG: Attempting to read embeddings file from resolved path:", resolvedPath);

        // Check if file exists before trying to read
        try {
            await fs.access(resolvedPath); // Throws error if file doesn't exist
            console.log("DEBUG: Embeddings file found at path.");
        } catch (accessError) {
            console.error("DEBUG: Embeddings file NOT FOUND at resolved path:", resolvedPath);
            console.error("DEBUG: fs.access error:", accessError);
            // Try an alternative common path if using Vercel's output structure directly
            if (process.env.VERCEL) {
                const alternativePath = path.join(process.cwd(), ".vercel/output/static/ai-data/docs_embeddings.json");
                console.log("DEBUG: Trying alternative Vercel path:", alternativePath);
                try {
                    await fs.access(alternativePath);
                    resolvedPath = alternativePath;
                     console.log("DEBUG: Embeddings file found at alternative Vercel path.");
                } catch (altAccessError) {
                    console.error("DEBUG: Embeddings file NOT FOUND at alternative Vercel path either:", alternativePath);
                    console.error("DEBUG: fs.access (alt) error:", altAccessError);
                    throw new Error(`Embeddings file not found. Checked: ${resolvedPath} and ${alternativePath}`);
                }
            } else {
                 throw new Error(`Embeddings file not found at ${resolvedPath}`);
            }
        }


        const fileContent = await fs.readFile(resolvedPath, 'utf-8');
        const loadedEmbeddings = JSON.parse(fileContent);

        if (Array.isArray(loadedEmbeddings)) {
            vectorStore = loadedEmbeddings;
            console.log(`Successfully loaded ${vectorStore.length} embeddings from JSON file.`);
        } else {
            throw new Error("Embeddings JSON is not an array or is malformed.");
        }
    } catch (error) {
        console.error("CRITICAL Error loading vector store from JSON file:", error);
        // vectorStore is already [], so this state persists on error
    }
}


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log(`Handler: Non-POST request: ${req.method}`);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (vectorStore === null) { // Load only if not attempted yet
    await loadVectorStore();
  }

  if (!vectorStore || vectorStore.length === 0) {
    console.error("Handler: Vector store empty. Cannot answer.");
    // More detailed error message for easier debugging on Vercel
    let internalErrorDetail = "Knowledge base initialization failed or is empty.";
    if (!process.env.OPENAI_API_KEY) internalErrorDetail = "OpenAI API Key missing in environment.";
    else if (vectorStore === null) internalErrorDetail = "Vector store loading was not attempted.";
    else if (vectorStore.length === 0) internalErrorDetail = "Vector store loaded but is empty after processing.";

    console.error("Internal Error Detail:", internalErrorDetail);
    return res.status(503).json({ error: "AI agent knowledge base is unavailable. This might be due to an ongoing initialization or an issue fetching/processing documentation. Please try again shortly." });
  }

  const { question, history = [] } = req.body;
  if (!question || typeof question !== 'string' || question.trim() === "") {
    return res.status(400).json({ error: "Question missing or empty." });
  }

  console.log(`Handler: Received question: "${question}"`);

  try {
    const qEmbResponse = await openai.embeddings.create({ input: question, model: OPENAI_EMBEDDING_MODEL });
    if (!qEmbResponse.data?.[0]?.embedding) { throw new Error("Failed question embedding."); }
    const qEmb = qEmbResponse.data[0].embedding;

    const topContextChunks = vectorStore
        .map(c => ({ ...c, score: cosine(qEmb, c.embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    console.log("DEBUG: Top context scores:", topContextChunks.map(c =>
        (typeof c.score === 'number' && !isNaN(c.score)) ? c.score.toFixed(4) : 'Invalid Score'
    ));

    let contextText = "";
    let useContext = false;
    let mostRelevantSourcePath = null;
    let mostRelevantSourceTitle = null;
    const RELEVANCE_THRESHOLD = 0.3; // You can tune this

    if (topContextChunks.length > 0 && topContextChunks[0].score > RELEVANCE_THRESHOLD) {
        useContext = true;
        contextText = topContextChunks.map(c => `Source: ${c.sourceTitle} (Path: ${c.sourcePath})\n${c.text}`).join('\n---\n');
        mostRelevantSourcePath = topContextChunks[0].sourcePath;
        mostRelevantSourceTitle = topContextChunks[0].sourceTitle;
        console.log("DEBUG: Using context from docs for chat.");
    } else {
        console.log("No sufficiently relevant context found. Top score was:", topContextChunks[0]?.score?.toFixed(4) || "N/A");
        contextText = "No specific context for this query in Degen Pets docs. Answer generally or state info isn't available.";
    }

    const messages = [
        { role: 'system', content: 'You are DegenBot, a helpful AI assistant for the Degen Pets game. Strictly answer based on the provided Degen Pets documentation context. If the context doesn\'t have the answer, clearly state you couldn\'t find that specific detail in the Degen Pets documentation and avoid speculation. Be concise and friendly.' },
        { role: 'system', content: `Context from Degen Pets Docs:\n${contextText}` },
        ...history.flatMap(h => [ { role: 'user', content: h.user }, { role: 'assistant', content: h.ai } ]),
        { role: 'user', content: question }
    ];

    const chat = await openai.chat.completions.create({ model: OPENAI_CHAT_MODEL, messages, temperature: 0.1, max_tokens: 700 });
    if (!chat.choices?.[0]?.message?.content) { throw new Error("OpenAI chat completion structure error."); }

    let finalAnswer = chat.choices[0].message.content;

    if (useContext && mostRelevantSourcePath && mostRelevantSourceTitle) {
        const gitbookBaseUrl = "https://degen-pets-1.gitbook.io/degen-pets/";
        const fullSourceUrl = gitbookBaseUrl + mostRelevantSourcePath.replace(/^\//, '');
        finalAnswer += `\n\nSource: [${mostRelevantSourceTitle}](${fullSourceUrl})`;
        console.log(`DEBUG: Appended source link: ${fullSourceUrl}`);
    }

    res.status(200).json({ answer: finalAnswer });

  } catch (error) {
      console.error("Error in AI handler execution:", error);
      let errorMessage = "Sorry, I encountered an error processing your request.";
      if (error.status === 429) { errorMessage = "AI assistant is overloaded. Please try again later."; }
      else if (error.message?.includes("embedding")) { errorMessage = "Issue processing question with AI. Try rephrasing." }
      if (!res.headersSent) {
        res.status(500).json({ error: errorMessage, details: error.message });
      }
  }
}