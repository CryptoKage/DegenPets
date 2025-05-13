// api/ask-docs-agent.js
import OpenAI from 'openai';
import fetch from 'node-fetch'; // Or use global fetch if Node version supports it reliably

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SPACE_ID = process.env.GITBOOK_SPACE_ID;
const TOKEN    = process.env.GITBOOK_TOKEN;
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
const OPENAI_CHAT_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

let vectorStore = null; // Initialize once globally

// Split long text into ~1000-char chunks
function splitIntoChunks(text, size = 1000) {
  const paras = text.split(/\n{2,}/); // Split by double newlines (paragraphs)
  const chunks = [];
  let currentChunk = '';

  for (const p of paras) {
    const paragraphWithNewline = p + '\n\n'; // Add newline back for context
    if ((currentChunk + paragraphWithNewline).length > size && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraphWithNewline;
    } else {
      currentChunk += paragraphWithNewline;
    }
  }
  // Add the last remaining chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks;
}

// --- Recursive function to extract text from GitBook document nodes ---
function extractTextFromGitBookNodes(nodes) {
    let fullText = "";
    if (!Array.isArray(nodes)) {
        return fullText;
    }

    for (const node of nodes) {
        if (node.object === 'text' && node.leaves) {
            for (const leaf of node.leaves) {
                if (leaf.text) {
                    fullText += leaf.text; // Don't add extra space here, let paragraph breaks handle it
                }
            }
        } else if (node.object === 'block' || node.object === 'inline') {
            if (node.type === 'paragraph' ||
                node.type === 'heading-1' || node.type === 'heading-2' || node.type === 'heading-3' ||
                node.type === 'list-item' || node.type === 'table-cell' ||
                node.type === 'code-block' || // Treat code-block text as important
                node.type === 'quote') {
                if (node.nodes) {
                    fullText += extractTextFromGitBookNodes(node.nodes);
                }
            } else if (node.type === 'code') { // For inline code
                if (node.data && node.data.code) {
                    fullText += ` \`${node.data.code}\` `; // Add backticks for inline code
                } else if (node.nodes) { // Sometimes inline code also has text nodes
                    fullText += ` \`${extractTextFromGitBookNodes(node.nodes)}\` `;
                }
            } else if (node.nodes && node.nodes.length > 0) { // Generic recursion for other block types with nodes
                 fullText += extractTextFromGitBookNodes(node.nodes);
            }
        }
        // Add a newline after processing a main block-level node for better separation in chunks
        if (node.object === 'block' && (node.type === 'paragraph' || node.type?.startsWith('heading') || node.type === 'list-unordered' || node.type === 'list-ordered' || node.type === 'code-block' || node.type === 'quote' || node.type === 'table')) {
            fullText += "\n\n";
        }
    }
    return fullText.replace(/\s+\n/g, '\n').trim(); // Normalize whitespace slightly better
}
// --- END NEW FUNCTION ---

// On cold start, fetch & embed all GitBook pages
// api/ask-docs-agent.js

// ... (OpenAI, fetch, SPACE_ID, TOKEN, vectorStore, splitIntoChunks, extractTextFromGitBookNodes, cosine - all defined above this) ...
// ... (OPENAI_EMBEDDING_MODEL also defined) ...

// api/ask-docs-agent.js

// ... (OpenAI, fetch, SPACE_ID, TOKEN, vectorStore, OPENAI_EMBEDDING_MODEL etc. defined above) ...
// ... (splitIntoChunks, extractTextFromGitBookNodes, cosine - all defined above) ...

async function initVectorStore() {
  if (vectorStore !== null) {
    console.log("DEBUG: Vector store already initialized or initialization attempt completed.");
    return;
  }
  console.log("DEBUG: Initializing vector store (cold start or first attempt)...");
  vectorStore = []; // Mark as "attempting initialization"

  try {
    const hierarchyUrl = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content`;
    console.log("DEBUG: Fetching GitBook page hierarchy from:", hierarchyUrl);
    const hierarchyRes = await fetch(hierarchyUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });

    if (!hierarchyRes.ok) {
        const errorText = await hierarchyRes.text();
        console.error(`GitBook Hierarchy API Error: ${hierarchyRes.status} - ${errorText}`);
        return;
    }

    const hierarchyJson = await hierarchyRes.json();
    let pagesToFetchContentFor = [];
    function collectPages(pageObject) { /* ... same collectPages recursive function ... */ }
    if (hierarchyJson && Array.isArray(hierarchyJson.pages)) { for (const topLevelPage of hierarchyJson.pages) { collectPages(topLevelPage); } }
    else { console.error("GitBook API Error: Root 'pages' array missing."); return; }

    console.log(`DEBUG: Found ${pagesToFetchContentFor.length} potential content pages in hierarchy.`);
    if (pagesToFetchContentFor.length === 0) { console.warn("DEBUG: No content pages identified from hierarchy."); return; }

    let tempVectorStore = [];
    let pagesSuccessfullyProcessed = 0;
    let allChunksToEmbed = []; // Collect all text items {text, sourceTitle, sourcePath}

    for (let i = 0; i < pagesToFetchContentFor.length; i++) {
        const pageInfo = pagesToFetchContentFor[i];
        try {
            const pageContentUrl = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content/page/${pageInfo.id}`;
            console.log(`DEBUG: Fetching content for page "${pageInfo.title}" (${i+1}/${pagesToFetchContentFor.length})`);
            const pageRes = await fetch(pageContentUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });
            if (!pageRes.ok) { console.warn(`Failed to fetch "${pageInfo.title}": ${pageRes.status}`); continue; }
            const pageContentJson = await pageRes.json();
            let text = '';
            if (pageContentJson?.document?.nodes) { text = extractTextFromGitBookNodes(pageContentJson.document.nodes); }
            else { console.warn(`No 'document.nodes' for page "${pageInfo.title}".`); }

            if (text.trim()) {
                console.log(`DEBUG: Extracted text for "${pageInfo.title}" (first 100): ${text.substring(0,100)}`);
                const chunks = splitIntoChunks(text);
                for (const chunk of chunks) {
                    if (chunk.trim()) {
                        allChunksToEmbed.push({ text: chunk, sourceTitle: pageInfo.title, sourcePath: pageInfo.path });
                    }
                }
                pagesSuccessfullyProcessed++;
            } else { console.log(`DEBUG: SKIPPING page "${pageInfo.title}" (no text).`); }
        } catch (pageError) { console.error(`Error processing page "${pageInfo.title}":`, pageError); }
    }

    // --- BATCH EMBEDDING ---
    if (allChunksToEmbed.length > 0) {
        console.log(`DEBUG: Starting to embed ${allChunksToEmbed.length} text chunks using batching...`);
        // OpenAI's text-embedding-3-small has a max batch size of 2048 input strings
        const OPENAI_EMBEDDING_BATCH_SIZE = 2048; // Check current OpenAI docs for this model
        let embeddingOverallSuccess = true;

        for (let i = 0; i < allChunksToEmbed.length; i += OPENAI_EMBEDDING_BATCH_SIZE) {
            const batchItems = allChunksToEmbed.slice(i, i + OPENAI_EMBEDDING_BATCH_SIZE);
            const batchTexts = batchItems.map(item => item.text);
            console.log(`DEBUG: Embedding batch ${Math.floor(i / OPENAI_EMBEDDING_BATCH_SIZE) + 1}, size: ${batchTexts.length}`);

            try {
                const embResponse = await openai.embeddings.create({
                    input: batchTexts, // Array of strings
                    model: OPENAI_EMBEDDING_MODEL
                });

                if (embResponse.data && embResponse.data.length === batchTexts.length) {
                    embResponse.data.forEach((embeddingData, index) => {
                        const originalItem = batchItems[index];
                        if (embeddingData.embedding) {
                            tempVectorStore.push({
                                text: originalItem.text,
                                embedding: embeddingData.embedding,
                                sourceTitle: originalItem.sourceTitle,
                                sourcePath: originalItem.sourcePath
                            });
                        } else {
                             console.warn(`OpenAI embedding missing for chunk from "${originalItem.sourceTitle}" in batch.`);
                        }
                    });
                } else {
                    console.warn("OpenAI batch embedding response issue: lengths mismatch or no data. Batch items:", batchItems.length, "Response items:", embResponse.data?.length);
                    embeddingOverallSuccess = false; // Mark as partial failure
                }
            } catch (embeddingError) {
                console.error(`Embedding error for batch starting with chunk from "${batchItems[0]?.sourceTitle}":`, embeddingError);
                embeddingOverallSuccess = false; // Mark as partial failure
                if (embeddingError.status === 429) {
                    console.error("OpenAI API quota/rate limit hit during batch embedding. Stopping further embeddings.");
                    break; // Stop trying further batches if quota is hit
                }
                // You might want to implement retries for other types of errors here
            }
            // Optional: Add a small delay between batch API calls if still hitting limits
            // await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
        if (!embeddingOverallSuccess) {
             console.warn("Some embedding batches may have failed. Vector store might be incomplete.");
        }

    }
    // --- End of Batch Embedding ---

    vectorStore = tempVectorStore;
    console.log(`Successfully initialized ${vectorStore.length} chunks from ${pagesSuccessfullyProcessed} GitBook page(s) with content.`);

  } catch (error) {
    console.error("Critical Error in initVectorStore:", error);
    vectorStore = [];
  }
} // End initVectorStore

// Cosine similarity helper
function cosine(a, b) { /* ... same as before ... */ }

export default async function handler(req, res) {
  if (req.method !== 'POST') { return res.status(405).json({ error: "Method Not Allowed" }); }

  if (vectorStore === null) { // Only initialize if not attempted yet
    await initVectorStore();
  }

  if (!vectorStore || vectorStore.length === 0) {
    console.error("Vector store empty. AI cannot answer.");
    // Check if OPENAI_API_KEY is missing or invalid
    if (!process.env.OPENAI_API_KEY) {
        console.error("OpenAI API Key is not configured in environment variables.");
        return res.status(500).json({ error: "AI configuration error. Admin has been notified." });
    }
    return res.status(503).json({ error: "AI agent is not ready, knowledge base unavailable. This might be due to an ongoing initialization or an issue fetching documentation. Please try again shortly." });
  }

  const { question, history = [] } = req.body;
  if (!question || typeof question !== 'string' || question.trim() === "") { return res.status(400).json({ error: "Question missing or empty." }); }

  try {
    const qEmbResponse = await openai.embeddings.create({ input: question, model: OPENAI_EMBEDDING_MODEL });
    if (!qEmbResponse.data?.[0]?.embedding) { throw new Error("Failed to get question embedding."); }
    const qEmb = qEmbResponse.data[0].embedding;

    const topContextChunks = vectorStore.map(c => ({ ...c, score: cosine(qEmb, c.embedding) })).sort((a, b) => b.score - a.score).slice(0, 3);
    console.log("DEBUG: Top context scores:", topContextChunks.map(c => c.score.toFixed(4)));

    let contextText = "";
    if (topContextChunks.length > 0 && topContextChunks[0].score > 0.75) { // Adjust relevance threshold
        contextText = topContextChunks.map(c => `Source: ${c.sourceTitle} (${c.sourcePath})\n${c.text}`).join('\n---\n');
        console.log("DEBUG: Using context from docs for chat completion.");
    } else {
        console.log("No sufficiently relevant context found. Answering generally or indicating lack of info.");
        // Forcing a more generic answer if context isn't strong.
        // You could also return a specific message like "I couldn't find that in the docs."
        contextText = "No specific context found in the documentation for this query. Answer based on general knowledge if possible, or state that the information isn't in the Degen Pets docs.";
    }

    const messages = [
        { role: 'system', content: 'You are a helpful assistant for the Degen Pets game. Strictly answer based on the provided Degen Pets documentation context. If the context doesn\'t have the answer, clearly state you couldn\'t find it in the Degen Pets documentation and avoid speculation. Be concise.' },
        { role: 'system', content: `Context:\n${contextText}` },
        ...history.flatMap(h => [ { role: 'user', content: h.user }, { role: 'assistant', content: h.ai } ]),
        { role: 'user', content: question }
    ];

    const chat = await openai.chat.completions.create({ model: OPENAI_CHAT_MODEL, messages, temperature: 0.1, max_tokens: 512 });
    if (!chat.choices?.[0]?.message?.content) { throw new Error("OpenAI chat completion structure error."); }
    res.status(200).json({ answer: chat.choices[0].message.content });

  } catch (error) {
      console.error("Error in AI handler:", error);
      let errorMessage = "Sorry, I encountered an error processing your request.";
      if (error.status === 429) { errorMessage = "AI assistant is currently overloaded. Please try again later."; }
      else if (error.message?.includes("embedding")) { errorMessage = "Issue processing question with AI. Try rephrasing." }
      res.status(500).json({ error: errorMessage, details: error.message });
  }
}