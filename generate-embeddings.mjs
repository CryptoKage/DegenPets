// generate-embeddings.mjs (run with node --env-file=.env generate-embeddings.mjs)
import OpenAI from 'openai';
import fetch from 'node-fetch';
import fs from 'fs/promises'; // For file system operations
import path from 'path';      // For path manipulation
// import dotenv from 'dotenv'; // Only needed if not using --env-file flag
// dotenv.config(); // Load .env file variables into process.env

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SPACE_ID = process.env.GITBOOK_SPACE_ID;
const TOKEN    = process.env.GITBOOK_TOKEN;
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

// --- Helper Functions (Copied from api/ask-docs-agent.js) ---
function splitIntoChunks(text, targetSize = 1000, minSize = 200) {
    const sentences = text.split(/(?<=[.?!])\s+/); const chunks = []; let currentChunk = "";
    for (const sentence of sentences) { if ((currentChunk + " " + sentence).length > targetSize && currentChunk.length >= minSize) { chunks.push(currentChunk.trim()); currentChunk = sentence; } else { currentChunk = currentChunk ? currentChunk + " " + sentence : sentence; } }
    if (currentChunk.trim().length > 0) { chunks.push(currentChunk.trim()); } const finalChunks = []; chunks.forEach(chunk => { if (chunk.length > targetSize * 1.5) { for (let i = 0; i < chunk.length; i += targetSize) { finalChunks.push(chunk.substring(i, i + targetSize)); } } else { finalChunks.push(chunk); } }); return finalChunks.filter(c => c.length > 10);
}

function extractTextFromGitBookNodes(nodes) {
    let fullText = ""; if (!Array.isArray(nodes)) { return fullText; }
    for (const node of nodes) { if (node.object === 'text' && node.leaves) { for (const leaf of node.leaves) { if (leaf.text) { fullText += leaf.text; } } } else if (node.object === 'block' || node.object === 'inline') { if (node.type === 'paragraph' || node.type === 'heading-1' || node.type === 'heading-2' || node.type === 'heading-3' || node.type === 'list-item' || node.type === 'table-cell' || node.type === 'code-block' || node.type === 'quote') { if (node.nodes) { fullText += extractTextFromGitBookNodes(node.nodes); } } else if (node.type === 'code') { if (node.data && node.data.code) { fullText += ` \`${node.data.code}\` `; } else if (node.nodes) { fullText += ` \`${extractTextFromGitBookNodes(node.nodes)}\` `; } } else if (node.nodes && node.nodes.length > 0) { fullText += extractTextFromGitBookNodes(node.nodes); } } if (node.object === 'block' && (node.type === 'paragraph' || node.type?.startsWith('heading') || node.type === 'list-unordered' || node.type === 'list-ordered' || node.type === 'code-block' || node.type === 'quote' || node.type === 'table')) { fullText += "\n\n"; } }
    return fullText.replace(/\s+\n/g, '\n').trim();
}
// --- End Helper Functions ---

async function generateAndSaveEmbeddings() {
    console.log("Starting GitBook content fetching and embedding process...");
    let allContentEmbeddings = [];

    try {
        const hierarchyUrl = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content`;
        console.log("Fetching GitBook page hierarchy from:", hierarchyUrl);
        const hierarchyRes = await fetch(hierarchyUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });
        if (!hierarchyRes.ok) { const errorText = await hierarchyRes.text(); throw new Error(`GitBook Hierarchy API Error: ${hierarchyRes.status} - ${errorText}`); }
        const hierarchyJson = await hierarchyRes.json();

        let pagesToFetchContentFor = [];
        function collectPages(pageObject) { if (!pageObject || !pageObject.id) return; if (pageObject.id && pageObject.path !== 'readme/assets' && pageObject.path !== 'images' && !pageObject.hidden) { if (!pagesToFetchContentFor.some(p => p.id === pageObject.id)) { pagesToFetchContentFor.push({ id: pageObject.id, title: pageObject.title || 'Untitled', path: pageObject.path }); } } if (pageObject.pages && Array.isArray(pageObject.pages) && pageObject.pages.length > 0) { for (const subPage of pageObject.pages) { collectPages(subPage); } } }
        if (hierarchyJson && Array.isArray(hierarchyJson.pages)) { for (const topLevelPage of hierarchyJson.pages) { collectPages(topLevelPage); } }
        else { throw new Error("GitBook API Error: Root 'pages' array missing from hierarchy."); }

        console.log(`Found ${pagesToFetchContentFor.length} potential content pages in hierarchy.`);
        if (pagesToFetchContentFor.length === 0) { console.warn("No content pages identified."); return; }

        let pagesSuccessfullyProcessed = 0;
        let allChunksToEmbed = [];

        for (let i = 0; i < pagesToFetchContentFor.length; i++) {
            const pageInfo = pagesToFetchContentFor[i];
            try {
                const pageContentUrl = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content/page/${pageInfo.id}`;
                console.log(`Fetching content for page "${pageInfo.title}" (${i+1}/${pagesToFetchContentFor.length})...`);
                const pageRes = await fetch(pageContentUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });
                if (!pageRes.ok) { console.warn(`Failed to fetch "${pageInfo.title}": ${pageRes.status}`); continue; }
                const pageContentJson = await pageRes.json();
                let text = ''; if (pageContentJson?.document?.nodes) { text = extractTextFromGitBookNodes(pageContentJson.document.nodes); }
                if (text.trim()) { const chunks = splitIntoChunks(text); for (const chunk of chunks) { if (chunk.trim()) { allChunksToEmbed.push({ text: chunk, sourceTitle: pageInfo.title, sourcePath: pageInfo.path }); } } pagesSuccessfullyProcessed++; }
                else { console.log(`SKIPPING page "${pageInfo.title}" (no text).`); }
            } catch (pageError) { console.error(`Error processing page "${pageInfo.title}":`, pageError); }
        }

        if (allChunksToEmbed.length > 0) {
            console.log(`Starting to embed ${allChunksToEmbed.length} text chunks using batching...`);
            const OPENAI_EMBEDDING_BATCH_SIZE = 100; // Reduced batch size for local script robustness
            for (let i = 0; i < allChunksToEmbed.length; i += OPENAI_EMBEDDING_BATCH_SIZE) {
                const batchItems = allChunksToEmbed.slice(i, i + OPENAI_EMBEDDING_BATCH_SIZE);
                const batchTexts = batchItems.map(item => item.text);
                console.log(`Embedding batch ${Math.floor(i / OPENAI_EMBEDDING_BATCH_SIZE) + 1} of ${Math.ceil(allChunksToEmbed.length / OPENAI_EMBEDDING_BATCH_SIZE)}, size: ${batchTexts.length} chunks`);
                try {
                    const embResponse = await openai.embeddings.create({ input: batchTexts, model: OPENAI_EMBEDDING_MODEL });
                    if (embResponse.data?.length === batchTexts.length) {
                        embResponse.data.forEach((embData, idx) => { if (embData.embedding) { allContentEmbeddings.push({ text: batchItems[idx].text, embedding: embData.embedding, sourceTitle: batchItems[idx].sourceTitle, sourcePath: batchItems[idx].sourcePath }); } });
                    } else { console.warn("Batch embedding response mismatch."); }
                } catch (embError) {
                    console.error(`Batch embedding error:`, embError);
                    if (embError.status === 429) { console.error("OpenAI Quota/Rate Limit. Try reducing batch size or wait."); break; }
                    // Implement more robust retry/delay if needed
                }
                if (i + OPENAI_EMBEDDING_BATCH_SIZE < allChunksToEmbed.length) { console.log("Waiting 1 second before next batch..."); await new Promise(r => setTimeout(r, 1000)); }
            }
        }

        // --- Save to JSON file ---
        const outputDir = path.join('api', 'ai-data'); //save to api/ai-data/
        const outputPath = path.join(outputDir, 'docs_embeddings.json');
        try {
            await fs.mkdir(outputDir, { recursive: true }); // Ensure directory exists
            await fs.writeFile(outputPath, JSON.stringify(allContentEmbeddings, null, 2));
            console.log(`Successfully generated and saved ${allContentEmbeddings.length} embeddings to ${outputPath}`);
        } catch (fileError) {
            console.error("Error saving embeddings JSON file:", fileError);
        }

        console.log(`Processed ${pagesSuccessfullyProcessed} GitBook page(s) with content.`);

    } catch (error) {
        console.error("Critical Error in embedding generation process:", error);
    }
}

// Run the generation function
generateAndSaveEmbeddings();
