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

async function initVectorStore() {
    if (vectorStore !== null) {
        console.log("DEBUG: Vector store already initialized or initialization attempted.");
        return;
    }
    console.log("DEBUG: Initializing vector store...");
    vectorStore = []; // Initialize to empty array

    try {
        // --- STEP 1: Fetch Page Hierarchy ---
        const hierarchyUrl = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content`;
        console.log("DEBUG: Fetching GitBook page hierarchy from:", hierarchyUrl);
        const hierarchyRes = await fetch(hierarchyUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });

        if (!hierarchyRes.ok) {
            const errorText = await hierarchyRes.text();
            console.error(`GitBook Hierarchy API Error: ${hierarchyRes.status} - ${errorText}`);
            return;
        }
        const hierarchyJson = await hierarchyRes.json();
        console.log("DEBUG: Full GitBook Hierarchy Response (first 500):", JSON.stringify(hierarchyJson, null, 2).substring(0, 500));

        let pagesToFetchContentFor = [];

        // Recursive function to flatten the page tree and collect pages that should have content
        function collectPages(pageObject) {
            if (!pageObject) return;
            // Assume leaf nodes (actual content pages) might not have a 'pages' array,
            // or it's empty. Sections/folders will have a non-empty 'pages' array.
            // We are interested in pages that are documents and likely don't have further sub-pages,
            // OR if your content is on every node, adjust this logic.
            // For now, let's assume ANY 'document' type page MIGHT have content we need to fetch individually.
            if (pageObject.type === 'document' && pageObject.id) { // page.kind === 'sheet' also seen
                pagesToFetchContentFor.push({ id: pageObject.id, title: pageObject.title, path: pageObject.path });
            }

            if (pageObject.pages && Array.isArray(pageObject.pages) && pageObject.pages.length > 0) {
                for (const subPage of pageObject.pages) {
                    collectPages(subPage); // Recursive call
                }
            }
        }

        if (hierarchyJson && Array.isArray(hierarchyJson.pages)) {
            for (const topLevelPage of hierarchyJson.pages) {
                collectPages(topLevelPage);
            }
        } else {
            console.error("GitBook API Error: Root 'pages' array missing from hierarchy.");
            return;
        }

        console.log(`DEBUG: Found ${pagesToFetchContentFor.length} potential content pages in hierarchy.`);
        if (pagesToFetchContentFor.length === 0) {
            console.warn("DEBUG: No content pages identified from hierarchy to fetch content for.");
            return;
        }

        // --- STEP 2: Fetch Content for Each Page and Embed ---
        let tempVectorStore = [];
        let pagesSuccessfullyProcessed = 0;

        for (const pageInfo of pagesToFetchContentFor) {
            try {
                const pageContentUrl = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content/page/${pageInfo.id}`;
                // Alternative if path is more reliable or ID changes:
                // const pageContentUrl = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content/path/${pageInfo.path.replace(/^\//, '')}`; // Ensure path doesn't start with / for this API
                console.log(`DEBUG: Fetching content for page "${pageInfo.title}" from ${pageContentUrl}`);
                const pageRes = await fetch(pageContentUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });

                if (!pageRes.ok) {
                    const errorText = await pageRes.text();
                    console.warn(`Failed to fetch content for page "${pageInfo.title}" (ID: ${pageInfo.id}): ${pageRes.status} - ${errorText}`);
                    continue; // Skip this page
                }

                const pageContentJson = await pageRes.json();
                // Now, inspect pageContentJson to find the actual text.
                // Common fields are 'markdown', 'document.content', or 'content.text'.
                // Let's log its structure for one page to be sure.
                if (pagesSuccessfullyProcessed < 1) { // Log structure for the first successfully fetched page
                     console.log(`DEBUG: Raw content for page "${pageInfo.title}":`, JSON.stringify(pageContentJson, null, 2).substring(0,1000));
                }

                let text = '';
                if (pageContentJson.markdown) {
                    text = pageContentJson.markdown;
                } else if (pageContentJson.document && typeof pageContentJson.document.content === 'string') {
                    text = pageContentJson.document.content; // Adjust based on actual structure
                } else if (typeof pageContentJson.content === 'string') {
                    text = pageContentJson.content;
                } else {
                     console.warn(`No clear text field (markdown, document.content, content) found for page "${pageInfo.title}".`);
                }


                if (text.trim()) {
                    console.log(`DEBUG: Page "${pageInfo.title}" HAS text content (first 100): ${text.substring(0,100)}`);
                    for (const chunk of splitIntoChunks(text)) {
                        if (!chunk.trim()) continue;
                        const emb = await openai.embeddings.create({ input: chunk, model: 'text-embedding-3-small' });
                        if (emb.data && emb.data[0] && emb.data[0].embedding) {
                            tempVectorStore.push({ text: chunk, embedding: emb.data[0].embedding, sourceTitle: pageInfo.title, sourcePath: pageInfo.path });
                        } else { console.warn("OpenAI embedding failed for chunk."); }
                    }
                    pagesSuccessfullyProcessed++;
                } else {
                    console.log(`DEBUG: SKIPPING page "${pageInfo.title}" (fetched, but no text after extraction).`);
                }
            } catch (pageError) {
                console.error(`Error processing page "${pageInfo.title}" (ID: ${pageInfo.id}):`, pageError);
            }
        } // End loop for pagesToFetchContentFor

        vectorStore = tempVectorStore;
        console.log(`Successfully initialized ${vectorStore.length} chunks from ${pagesSuccessfullyProcessed} GitBook page(s) with content.`);

    } catch (error) {
        console.error("Error in initVectorStore:", error);
        vectorStore = []; // Ensure it's at least an empty array on critical error
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