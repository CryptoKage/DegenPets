// api/ask-docs-agent.js
import OpenAI from 'openai';
import fetch from 'node-fetch';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SPACE_ID = process.env.GITBOOK_SPACE_ID;
const TOKEN    = process.env.GITBOOK_TOKEN;
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
const OPENAI_CHAT_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

let vectorStore = null;

function splitIntoChunks(text, size = 1000) {
  const paras = text.split(/\n{2,}/); const chunks = []; let currentChunk = '';
  for (const p of paras) { const paragraphWithNewline = p + '\n\n'; if ((currentChunk + paragraphWithNewline).length > size && currentChunk.length > 0) { chunks.push(currentChunk.trim()); currentChunk = paragraphWithNewline; } else { currentChunk += paragraphWithNewline; } }
  if (currentChunk.trim().length > 0) { chunks.push(currentChunk.trim()); } return chunks;
}

function extractTextFromGitBookNodes(nodes) {
    let fullText = ""; if (!Array.isArray(nodes)) { return fullText; }
    for (const node of nodes) { if (node.object === 'text' && node.leaves) { for (const leaf of node.leaves) { if (leaf.text) { fullText += leaf.text; } } } else if (node.object === 'block' || node.object === 'inline') { if (node.type === 'paragraph' || node.type === 'heading-1' || node.type === 'heading-2' || node.type === 'heading-3' || node.type === 'list-item' || node.type === 'table-cell' || node.type === 'code-block' || node.type === 'quote') { if (node.nodes) { fullText += extractTextFromGitBookNodes(node.nodes); } } else if (node.type === 'code') { if (node.data && node.data.code) { fullText += ` \`${node.data.code}\` `; } else if (node.nodes) { fullText += ` \`${extractTextFromGitBookNodes(node.nodes)}\` `; } } else if (node.nodes && node.nodes.length > 0) { fullText += extractTextFromGitBookNodes(node.nodes); } } if (node.object === 'block' && (node.type === 'paragraph' || node.type?.startsWith('heading') || node.type === 'list-unordered' || node.type === 'list-ordered' || node.type === 'code-block' || node.type === 'quote' || node.type === 'table')) { fullText += "\n\n"; } }
    return fullText.replace(/\s+\n/g, '\n').trim();
}

async function initVectorStore() {
  if (vectorStore !== null) { console.log("DEBUG: Vector store already initialized."); return; }
  console.log("DEBUG: Initializing vector store..."); vectorStore = [];
  try {
    const hierarchyUrl = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content`; console.log("DEBUG: Fetching GitBook hierarchy:", hierarchyUrl);
    const hierarchyRes = await fetch(hierarchyUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!hierarchyRes.ok) { const errorText = await hierarchyRes.text(); console.error(`GitBook Hierarchy API Error: ${hierarchyRes.status} - ${errorText}`); return; }
    const hierarchyJson = await hierarchyRes.json();
    let pagesToFetchContentFor = []; function collectPages(pageObject) { if (!pageObject || !pageObject.id) return; if (pageObject.id && pageObject.path !== 'readme/assets' && pageObject.path !== 'images' && !pageObject.hidden) { if (!pagesToFetchContentFor.some(p => p.id === pageObject.id)) { pagesToFetchContentFor.push({ id: pageObject.id, title: pageObject.title || 'Untitled', path: pageObject.path }); } } if (pageObject.pages && Array.isArray(pageObject.pages) && pageObject.pages.length > 0) { for (const subPage of pageObject.pages) { collectPages(subPage); } } }
    if (hierarchyJson && Array.isArray(hierarchyJson.pages)) { for (const topLevelPage of hierarchyJson.pages) { collectPages(topLevelPage); } } else { console.error("GitBook API Error: Root 'pages' array missing."); return; }
    console.log(`DEBUG: Found ${pagesToFetchContentFor.length} potential content pages.`); if (pagesToFetchContentFor.length === 0) { console.warn("DEBUG: No content pages identified."); return; }
    let tempVectorStore = []; let pagesSuccessfullyProcessed = 0; let allChunksToEmbed = [];
    for (let i = 0; i < pagesToFetchContentFor.length; i++) { const pageInfo = pagesToFetchContentFor[i]; try { const pageContentUrl = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content/page/${pageInfo.id}`; console.log(`DEBUG: Fetching content for page "${pageInfo.title}" (${i+1}/${pagesToFetchContentFor.length})`); const pageRes = await fetch(pageContentUrl, { headers: { Authorization: `Bearer ${TOKEN}` } }); if (!pageRes.ok) { console.warn(`Failed fetch for "${pageInfo.title}": ${pageRes.status}`); continue; } const pageContentJson = await pageRes.json(); let text = ''; if (pageContentJson?.document?.nodes) { text = extractTextFromGitBookNodes(pageContentJson.document.nodes); } else { console.warn(`No 'document.nodes' for "${pageInfo.title}".`); } if (text.trim()) { console.log(`DEBUG: Extracted text for "${pageInfo.title}" (first 100): ${text.substring(0,100)}`); const chunks = splitIntoChunks(text); for (const chunk of chunks) { if (chunk.trim()) { allChunksToEmbed.push({ text: chunk, sourceTitle: pageInfo.title, sourcePath: pageInfo.path }); } } pagesSuccessfullyProcessed++; } else { console.log(`DEBUG: SKIPPING page "${pageInfo.title}" (no text).`); } } catch (pageError) { console.error(`Error processing page "${pageInfo.title}":`, pageError); } }
    if (allChunksToEmbed.length > 0) { console.log(`DEBUG: Starting to embed ${allChunksToEmbed.length} chunks (batching)...`); const BATCH_SIZE = 50; let overallSuccess = true; for (let i = 0; i < allChunksToEmbed.length; i += BATCH_SIZE) { const batchItems = allChunksToEmbed.slice(i, i + BATCH_SIZE); const batchTexts = batchItems.map(item => item.text); console.log(`DEBUG: Embedding batch ${Math.floor(i/BATCH_SIZE)+1}, size: ${batchTexts.length}`); try { const embResponse = await openai.embeddings.create({ input: batchTexts, model: OPENAI_EMBEDDING_MODEL }); if (embResponse.data?.length === batchTexts.length) { embResponse.data.forEach((embData, idx) => { if (embData.embedding) { tempVectorStore.push({ text: batchItems[idx].text, embedding: embData.embedding, sourceTitle: batchItems[idx].sourceTitle, sourcePath: batchItems[idx].sourcePath }); } }); } else { console.warn("Batch embedding response mismatch."); overallSuccess = false; } } catch (embError) { console.error(`Batch embedding error for "${batchItems[0]?.sourceTitle}":`, embError); overallSuccess = false; if (embError.status === 429) { console.error("OpenAI Quota/Rate Limit. Stopping."); break; } } if (i + BATCH_SIZE < allChunksToEmbed.length) { console.log("Waiting before next batch..."); await new Promise(r => setTimeout(r, 1000)); } } if (!overallSuccess) console.warn("Some embedding batches failed."); }
    vectorStore = tempVectorStore; console.log(`Initialized ${vectorStore.length} chunks from ${pagesSuccessfullyProcessed} pages.`);
  } catch (error) { console.error("Critical Error in initVectorStore:", error); vectorStore = []; }
}

function cosine(a, b) { if (!a || !b || !Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) { console.warn("COSINE: Invalid vectors."); return 0; } const dot = a.reduce((s, v, i) => s + (v * b[i]), 0); const magA = Math.sqrt(a.reduce((s, v) => s + (v*v), 0)); const magB = Math.sqrt(b.reduce((s, v) => s + (v*v), 0)); if (magA === 0 || magB === 0) { console.warn("COSINE: Zero magnitude vector."); return 0; } const sim = dot / (magA * magB); return isNaN(sim) ? 0 : sim; }

// --->>> THIS IS THE MAIN HANDLER FUNCTION THAT MUST BE EXPORTED <<<---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log(`Handler: Non-POST request: ${req.method}`);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (vectorStore === null) { // Initialize only if not yet attempted
    await initVectorStore();
  }

  if (!vectorStore || vectorStore.length === 0) {
    console.error("Handler: Vector store empty. Cannot answer.");
    if (!process.env.OPENAI_API_KEY) { console.error("OpenAI API Key missing."); return res.status(500).json({ error: "AI config error." }); }
    return res.status(503).json({ error: "AI agent not ready, knowledge base unavailable. Try again shortly." });
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
        (typeof c.score === 'number' && !isNaN(c.score)) ? c.score.toFixed(4) : 'Invalid Score' // <<< CORRECTED LOGGING FOR SCORE
    ));

    let contextText = "";
    if (topContextChunks.length > 0 && topContextChunks[0].score > 0.55) { // Relevance threshold
        contextText = topContextChunks.map(c => `Source: ${c.sourceTitle} (Path: ${c.sourcePath})\n${c.text}`).join('\n---\n');
        console.log("DEBUG: Using context from docs for chat.");
    } else {
        console.log("No sufficiently relevant context. Answering generally or indicating lack of info.");
        contextText = "No specific context for this query in Degen Pets docs. Answer generally or state info isn't available.";
    }

    const messages = [
        { role: 'system', content: 'You are DegenBot, a helpful AI assistant for Degen Pets. Strictly answer based on the provided Degen Pets documentation context. If the context doesn\'t have the answer, clearly state you couldn\'t find that specific detail in the Degen Pets documentation and avoid speculation. Be concise and friendly.' },
        { role: 'system', content: `Context from Degen Pets Docs:\n${contextText}` },
        ...history.flatMap(h => [ { role: 'user', content: h.user }, { role: 'assistant', content: h.ai } ]),
        { role: 'user', content: question }
    ];

    const chat = await openai.chat.completions.create({ model: OPENAI_CHAT_MODEL, messages, temperature: 0.1, max_tokens: 700 }); // Increased max_tokens slightly
    if (!chat.choices?.[0]?.message?.content) { throw new Error("OpenAI chat completion structure error."); }
    res.status(200).json({ answer: chat.choices[0].message.content });

  } catch (error) {
      console.error("Error in AI handler execution:", error);
      let errorMessage = "Sorry, I encountered an error processing your request.";
      if (error.status === 429) { errorMessage = "AI assistant is overloaded. Please try again later."; }
      else if (error.message?.includes("embedding")) { errorMessage = "Issue processing question with AI. Try rephrasing." }
      res.status(500).json({ error: errorMessage, details: error.message });
  }
} // <<< CLOSING BRACE FOR THE HANDLER FUNCTION