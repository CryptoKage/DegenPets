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

// api/ask-docs-agent.js

// ... (OpenAI, fetch, SPACE_ID, TOKEN, vectorStore, OPENAI_EMBEDDING_MODEL etc. defined above) ...
// ... (splitIntoChunks, extractTextFromGitBookNodes, cosine - all defined above) ...

async function initVectorStore() {
  if (vectorStore !== null) {
    console.log("DEBUG: Vector store already initialized or initialization attempt completed.");
    return;
  }
  console.log("DEBUG: Initializing vector store (cold start or first attempt)...");
  vectorStore = []; // Mark as "attempting initialization" and ensure it's an array

  try {
    const hierarchyUrl = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content`;
    console.log("DEBUG: Fetching GitBook page hierarchy from:", hierarchyUrl);
    const hierarchyRes = await fetch(hierarchyUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });

    if (!hierarchyRes.ok) {
        const errorText = await hierarchyRes.text();
        console.error(`GitBook Hierarchy API Error: ${hierarchyRes.status} - ${errorText}`);
        return; // Exit initVectorStore
    }

    const hierarchyJson = await hierarchyRes.json();
    // console.log("DEBUG: Full GitBook Hierarchy Response:", JSON.stringify(hierarchyJson, null, 2)); // Keep for deep debug if needed

    let pagesToFetchContentFor = [];

    // --- MODIFIED collectPages function ---
    function collectPages(pageObject) {
        if (!pageObject || !pageObject.id) return; // Basic check for a valid page object with an ID

        // Add any page that has an ID and isn't explicitly an 'assets' or 'images' folder path from root.
        // Also skip pages explicitly marked as hidden by GitBook.
        if (pageObject.id && pageObject.path !== 'readme/assets' && pageObject.path !== 'images' && !pageObject.hidden) {
            // Check if it's already added to avoid duplicates if structure is weird
            if (!pagesToFetchContentFor.some(p => p.id === pageObject.id)) {
                 pagesToFetchContentFor.push({ id: pageObject.id, title: pageObject.title || 'Untitled', path: pageObject.path });
            }
        }

        // Still recurse for sub-pages
        if (pageObject.pages && Array.isArray(pageObject.pages) && pageObject.pages.length > 0) {
            for (const subPage of pageObject.pages) {
                collectPages(subPage);
            }
        }
    }
    // --- END MODIFIED collectPages function ---

    if (hierarchyJson && Array.isArray(hierarchyJson.pages)) {
        for (const topLevelPage of hierarchyJson.pages) {
            collectPages(topLevelPage);
        }
    } else {
        console.error("GitBook API Error: Root 'pages' array missing from hierarchy.");
        // vectorStore is already [], so just return
        return;
    }

    console.log(`DEBUG: Found ${pagesToFetchContentFor.length} potential content pages in hierarchy to fetch individually.`);
    if (pagesToFetchContentFor.length === 0) {
        console.warn("DEBUG: No content pages identified from hierarchy after collection.");
        // vectorStore is already [], so just return
        return;
    }

    // --- STEP 2: Fetch Content for Each Page and Collect Texts ---
    let tempVectorStore = [];
    let pagesSuccessfullyProcessed = 0;
    let allChunksToEmbed = []; // Collect all text items {text, sourceTitle, sourcePath}

    for (let i = 0; i < pagesToFetchContentFor.length; i++) {
        const pageInfo = pagesToFetchContentFor[i];
        try {
            const pageContentUrl = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content/page/${pageInfo.id}`;
            console.log(`DEBUG: Fetching content for page "${pageInfo.title}" (${i+1}/${pagesToFetchContentFor.length})`);
            const pageRes = await fetch(pageContentUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });

            if (!pageRes.ok) {
                console.warn(`Failed to fetch content for page "${pageInfo.title}" (ID: ${pageInfo.id}): ${pageRes.status}`);
                continue; // Skip this page
            }
            const pageContentJson = await pageRes.json();
            // Uncomment to log the structure of the first successfully fetched individual page
            // if (pagesSuccessfullyProcessed < 1 && i < 5) { // Log first few attempts
            //      console.log(`DEBUG: Raw content for page "${pageInfo.title}":`, JSON.stringify(pageContentJson, null, 2).substring(0,1000));
            // }

            let text = '';
            if (pageContentJson && pageContentJson.document && Array.isArray(pageContentJson.document.nodes)) {
                text = extractTextFromGitBookNodes(pageContentJson.document.nodes);
            } else {
                console.warn(`No 'document.nodes' found for page "${pageInfo.title}".`);
            }

            if (text.trim()) {
                console.log(`DEBUG: Extracted text for "${pageInfo.title}" (first 100 chars): ${text.substring(0,100)}`);
                const chunks = splitIntoChunks(text);
                for (const chunk of chunks) {
                    if (chunk.trim()) {
                        allChunksToEmbed.push({ text: chunk, sourceTitle: pageInfo.title, sourcePath: pageInfo.path });
                    }
                }
                pagesSuccessfullyProcessed++;
            } else {
                console.log(`DEBUG: SKIPPING page "${pageInfo.title}" (no text after extraction).`);
            }
        } catch (pageError) {
            console.error(`Error processing page "${pageInfo.title}" (ID: ${pageInfo.id}):`, pageError);
        }
    } // End loop for pagesToFetchContentFor


    // --- BATCH EMBEDDING ---
    if (allChunksToEmbed.length > 0) {
        console.log(`DEBUG: Starting to embed ${allChunksToEmbed.length} text chunks using batching...`);
        const OPENAI_EMBEDDING_BATCH_SIZE = 2048; // Max for text-embedding-3-small
        let embeddingOverallSuccess = true;

        for (let i = 0; i < allChunksToEmbed.length; i += OPENAI_EMBEDDING_BATCH_SIZE) {
            const batchItems = allChunksToEmbed.slice(i, i + OPENAI_EMBEDDING_BATCH_SIZE);
            const batchTexts = batchItems.map(item => item.text);
            console.log(`DEBUG: Embedding batch ${Math.floor(i / OPENAI_EMBEDDING_BATCH_SIZE) + 1} of ${Math.ceil(allChunksToEmbed.length / OPENAI_EMBEDDING_BATCH_SIZE)}, size: ${batchTexts.length} chunks`);

            try {
                const embResponse = await openai.embeddings.create({
                    input: batchTexts, model: OPENAI_EMBEDDING_MODEL
                });
                if (embResponse.data && embResponse.data.length === batchTexts.length) {
                    embResponse.data.forEach((embeddingData, index) => {
                        const originalItem = batchItems[index];
                        if (embeddingData.embedding) {
                            tempVectorStore.push({ text: originalItem.text, embedding: embeddingData.embedding, sourceTitle: originalItem.sourceTitle, sourcePath: originalItem.sourcePath });
                        } else { console.warn(`OpenAI embedding missing for chunk from "${originalItem.sourceTitle}" in batch.`); }
                    });
                } else { console.warn("OpenAI batch embedding response issue. Batch items:", batchItems.length, "Response items:", embResponse.data?.length); embeddingOverallSuccess = false; }
            } catch (embeddingError) {
                console.error(`Embedding error for batch starting with chunk from "${batchItems[0]?.sourceTitle}":`, embeddingError);
                embeddingOverallSuccess = false;
                if (embeddingError.status === 429) { console.error("OpenAI API quota/rate limit hit. Stopping further embeddings."); break; }
            }
            // Optional: await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between batches if needed
        }
        if (!embeddingOverallSuccess) { console.warn("Some embedding batches may have failed."); }
    }
    // --- End of Batch Embedding ---

    vectorStore = tempVectorStore;
    console.log(`Successfully initialized ${vectorStore.length} chunks from ${pagesSuccessfullyProcessed} GitBook page(s) with content.`);

  } catch (error) {
    console.error("Critical Error in initVectorStore:", error);
    vectorStore = []; // Ensure it's at least an empty array on critical error
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