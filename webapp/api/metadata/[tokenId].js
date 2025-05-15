// File: webapp/api/metadata/[tokenId].js

import { kv } from '@vercel/kv';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import PinataClient from '@pinata/sdk';
import { Readable } from 'stream';

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = new PinataClient(pinataApiKey, pinataApiSecret);

// Path assumes vercel.json includes "Public/images/degenpet_base_logo.png" (relative to webapp/)
// and Vercel places it at /var/task/Public/images/degenpet_base_logo.png
// ENSURE 'Public' and 'images' casing matches your actual folder names referenced in vercel.json
const LOGO_IMAGE_PATH = path.join(process.cwd(), 'Public', 'images', 'degenpet_base_logo.png');

const IMAGE_WIDTH = 500;
const IMAGE_HEIGHT = 500;
const TEXT_COLOR = '#FFD700';
const FONT_SIZE = 48;
const FONT_FAMILY = 'Arial';
const TEXT_X_OFFSET = 250;
const TEXT_Y_OFFSET = 310;

export default async function handler(request, response) {
    if (request.method !== 'GET') { /* ... */ }
    let requestedTokenId = request.query.tokenId;

    try {
        console.log("[VercelJSON_Include_Test] Current working directory (process.cwd()):", process.cwd());
        const rootDirContents = await fs.readdir(process.cwd());
        console.log("[VercelJSON_Include_Test] Contents of process.cwd() (/var/task/):", rootDirContents);
        // We expect 'Public' to be in rootDirContents if includeFiles is creating that structure at /var/task/
        if (rootDirContents.includes('Public')) {
            const publicDirContents = await fs.readdir(path.join(process.cwd(), 'Public'));
            console.log("[VercelJSON_Include_Test] Contents of /var/task/Public/:", publicDirContents);
            if (publicDirContents.includes('images')) {
                 const imagesDirContents = await fs.readdir(path.join(process.cwd(), 'Public', 'images'));
                 console.log("[VercelJSON_Include_Test] Contents of /var/task/Public/images/:", imagesDirContents);
            } else { console.warn("[VercelJSON_Include_Test] /var/task/Public/ does not contain 'images'"); }
        } else {
             console.warn("[VercelJSON_Include_Test] 'Public' directory NOT found in /var/task/. Will try reading LOGO_IMAGE_PATH directly.");
        }
    } catch (readdirError) { console.error("[VercelJSON_Include_Test] Error listing directories:", readdirError.message); }

    try {
        // ... (tokenId parsing, KV fetch as before) ...
        if (requestedTokenId && requestedTokenId.endsWith('.json')) { /* ... */ }
        if (!requestedTokenId || isNaN(parseInt(requestedTokenId))) { /* ... */ }
        const degenTokenId = String(requestedTokenId);
        const kvKey = `degenPetRecord_${degenTokenId}`;
        let mintRecord = await kv.get(kvKey);
        if (!mintRecord) { /* ... */ }
        let imageIpfsCid = mintRecord.imageIpfsCid;
        const userDegenScore = mintRecord.score;

        if (!imageIpfsCid) {
            console.log(`No imageIpfsCid found for ${degenTokenId}. Generating new image.`);
            console.log("Attempting to read logo from (VercelJSON includeFiles strategy):", LOGO_IMAGE_PATH);
            const logoBuffer = await fs.readFile(LOGO_IMAGE_PATH);
            // ... (SVG, sharp, Pinata logic - unchanged) ...
            const svgText = `...`; // Keep your working SVG text
            const textBuffer = Buffer.from(svgText);
            const imageWithScoreBuffer = await sharp(logoBuffer).composite(/*...*/).png().toBuffer();
            const imageStream = Readable.from(imageWithScoreBuffer);
            const options = { /*...*/ };
            const pinataResponse = await pinata.pinFileToIPFS(imageStream, options);
            imageIpfsCid = pinataResponse.IpfsHash;
            // ... (KV update - unchanged) ...
        } else { /* ... */ }
        const metadata = { /* ... */ };
        return response.status(200).json(metadata);
    } catch (error) {
        // ... (Error handling - unchanged, but ensure it logs ENOENT details) ...
        console.error(`Error in handler for ${request.query.tokenId || 'unknown'}:`, error);
        if (error.code === 'ENOENT' && error.path) {
             console.error(`File not found at: ${error.path}.`);
             return response.status(500).json({ error: `Internal Server Error: Required file not found. Attempted: ${error.path}` });
        }
        return response.status(500).json({ error: 'Internal Server Error.', details: error.message });
    }
}