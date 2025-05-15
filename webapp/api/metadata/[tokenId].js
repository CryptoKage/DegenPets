// File: webapp/api/metadata/[tokenId].js

import { kv } from '@vercel/kv';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import PinataClient from '@pinata/sdk';
import { Readable } from 'stream';

// Initialize Pinata Client
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = new PinataClient(pinataApiKey, pinataApiSecret);

// --- Configuration for the image ---

// NEW PATH: Assumes degenpet_base_logo.png is included at the root of /var/task/ (process.cwd())
// This means you should place degenpet_base_logo.png into webapp/ (root of your Vercel project)
// And vercel.json should include "webapp/degenpet_base_logo.png"
const LOGO_IMAGE_PATH = path.join(process.cwd(), 'webapp', 'public', 'images', 'degenpet_base_logo.png');

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

    // --- TEMPORARY DEBUGGING: List directories ---
    try {
        console.log("[SIMPLIFIED_PATH_DEBUG] Current working directory (process.cwd()):", process.cwd());
        const rootDirContents = await fs.readdir(process.cwd());
        console.log("[SIMPLIFIED_PATH_DEBUG] Contents of process.cwd() (/var/task/):", rootDirContents);
        // We expect 'degenpet_base_logo.png' to be in rootDirContents if includeFiles worked as intended
    } catch (readdirError) { console.error("[SIMPLIFIED_PATH_DEBUG] Error listing directories:", readdirError.message); }
    // --- END TEMPORARY DEBUGGING ---

    try {
        if (requestedTokenId && requestedTokenId.endsWith('.json')) {
            requestedTokenId = requestedTokenId.slice(0, -5);
        }
        if (!requestedTokenId || isNaN(parseInt(requestedTokenId))) {
            return response.status(400).json({ error: 'Invalid or missing tokenId parameter.' });
        }
        const degenTokenId = String(requestedTokenId);
        const kvKey = `degenPetRecord_${degenTokenId}`;
        let mintRecord = await kv.get(kvKey);
        if (!mintRecord) { return response.status(404).json({ error: `Metadata for Token ID ${degenTokenId} not found.` });}
        
        let imageIpfsCid = mintRecord.imageIpfsCid;
        const userDegenScore = mintRecord.score;

        if (!imageIpfsCid) {
            console.log(`No imageIpfsCid found for ${degenTokenId}. Generating new image.`);
            console.log("Attempting to read logo from (simplified path theory):", LOGO_IMAGE_PATH);
            const logoBuffer = await fs.readFile(LOGO_IMAGE_PATH);
            
            const svgText = `
                <svg width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}">
                    <style> .scoreText { font-family: "${FONT_FAMILY}"; font-size: ${FONT_SIZE}px; font-weight: bold; fill: "${TEXT_COLOR}" !important; text-anchor: middle; dominant-baseline: middle; } </style>
                    <text x="${TEXT_X_OFFSET}" y="${TEXT_Y_OFFSET}" class="scoreText">${userDegenScore}</text>
                </svg>`;
            const textBuffer = Buffer.from(svgText);
            const imageWithScoreBuffer = await sharp(logoBuffer).composite([{ input: textBuffer, top: 0, left: 0 }]).png().toBuffer();
            const imageStream = Readable.from(imageWithScoreBuffer);
            const options = { pinataMetadata: { name: `DegenPet_ScoreImage_${degenTokenId}`, keyvalues: { tokenId: degenTokenId, score: userDegenScore }}, pinataOptions: { cidVersion: 0 }};
            console.log(`Uploading image for ${degenTokenId} to Pinata...`);
            const pinataResponse = await pinata.pinFileToIPFS(imageStream, options);
            imageIpfsCid = pinataResponse.IpfsHash;
            console.log(`Image uploaded. IPFS Hash (CID): ${imageIpfsCid} for ${degenTokenId}`);
            mintRecord.imageIpfsCid = imageIpfsCid;
            mintRecord.imageGeneratedAt = new Date().toISOString();
            await kv.set(kvKey, mintRecord);
            console.log(`Updated KV store for ${degenTokenId} with CID: ${imageIpfsCid}`);
        } else { 
            console.log(`Using existing imageIpfsCid: ${imageIpfsCid} for ${degenTokenId}`);
        }

        const metadata = { name: `Degen Pet #${degenTokenId}`, description: `An exclusive Degen Pet... Score of ${userDegenScore}.`, image: `ipfs://${imageIpfsCid}`, attributes: [ { trait_type: "Degen Score", value: userDegenScore }, { trait_type: "Token ID", value: parseInt(degenTokenId) } ]};
        response.setHeader('Content-Type', 'application/json');
        return response.status(200).json(metadata);

    } catch (error) {
        console.error(`Error fetching metadata for tokenId ${request.query.tokenId || 'unknown'}:`, error);
        if (error.code === 'ENOENT' && error.path && error.path.includes('degenpet_base_logo.png')) {
             console.error(`LOGO FILE NOT FOUND AT: ${error.path}.`);
             return response.status(500).json({ error: `Internal Server Error: Base logo image file not found. Attempted: ${error.path}` });
        }
        if ((error.reason && error.details) || (error.message && error.message.toLowerCase().includes('pinata')) || (error.response && error.response.data)) {
             console.error('Pinata Specific Error Data:', error.response ? error.response.data : (error.details || error.message));
             return response.status(500).json({ error: 'Internal Server Error: Pinata processing failed.'});
        }
        return response.status(500).json({ error: 'Internal Server Error fetching metadata.', details: error.message });
    }
}