import OpenAI from 'openai';
import fetch from 'node-fetch';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const SPACE_ID = process.env.GITBOOK_SPACE_ID;
const TOKEN    = process.env.GITBOOK_TOKEN;

let vectorStore = null;

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
// Inside initVectorStore in ask-docs-agent.js
const res = await fetch(
    `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
);

if (!res.ok) {
    const errorText = await res.text();
    console.error(`GitBook API Error: ${res.status} - ${errorText}`);
    // Potentially throw an error or return early to prevent accessing undefined 'data'
    vectorStore = []; // Ensure vectorStore is at least an empty array
    return; // Or throw new Error(...)
}

const responseJson = await res.json();
console.log("DEBUG: GitBook API Response JSON:", JSON.stringify(responseJson, null, 2)); // Log the whole structure

// Now check if responseJson.data and responseJson.data.pages exist
if (!responseJson || !responseJson.data || !Array.isArray(responseJson.data.pages)) {
    console.error("GitBook API Error: Unexpected response structure or missing 'data.pages'. Full response:", responseJson);
    vectorStore = [];
    return;
}

const { data } = responseJson; // Now safe to destructure
vectorStore = [];
// ... rest of the loop ...

// Cosine similarity helper
function cosine(a, b) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return dot / (magA * magB);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  await initVectorStore();

  const { question, history = [] } = req.body;

  // 1) Embed the user’s question
  const qEmb = (await openai.embeddings.create({
    input: question,
    model: 'text-embedding-3-small'
  })).data[0].embedding;

  // 2) Find top 3 relevant chunks
  const topContext = vectorStore
    .map(c => ({ ...c, score: cosine(qEmb, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(c => c.text)
    .join('\n---\n');

  // 3) Build the chat messages
  const messages = [
    { role: 'system',    content: 'You are a helpful assistant for Degen Pets docs. Use the context below:' },
    { role: 'system',    content: topContext },
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

  res.status(200).json({ answer: chat.choices[0].message.content });
}
