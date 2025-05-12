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
async function initVectorStore() {
  if (vectorStore) return;
  const res = await fetch(
    `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  const { data } = await res.json();
  vectorStore = [];

  for (const page of data.pages) {
    const text = page.markdown || page.html || '';
    for (const chunk of splitIntoChunks(text)) {
      const emb = await openai.embeddings.create({
        input: chunk,
        model: 'text-embedding-3-small'
      });
      vectorStore.push({
        text: chunk,
        embedding: emb.data[0].embedding
      });
    }
  }
  console.log(`Initialized ${vectorStore.length} chunks from GitBook.`);
}

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
