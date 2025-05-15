// File: webapp/api/metadata/[tokenId].js

import { kv } from '@vercel/kv';
import sharp from 'sharp';
import path from 'path';         // Already here
import fs from 'fs/promises';    // Already here
import PinataClient from '@pinata/sdk';
import { Readable } from 'stream'; // Already here

import { fileURLToPath } from 'url'; // <<< ADD THIS

// --- Calculate __dirname equivalent for ES Modules ---
const __filename_esm = fileURLToPath(import.meta.url);
const __dirname_esm = path.dirname(__filename_esm);
// ---

// Initialize Pinata Client
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = new PinataClient(pinataApiKey, pinataApiSecret);

// --- Configuration for the image ---
// Path uses the calculated __dirname_esm
const LOGO_IMAGE_PATH = path.join(__dirname_esm, '..', 'assets', 'degenpet_base_logo.png');

const IMAGE_WIDTH = 500;
const IMAGE_HEIGHT = 500;
const TEXT_COLOR = '#FFD700';
const FONT_SIZE = 48;
const FONT_FAMILY = 'sans-serif';
const TEXT_X_OFFSET = 250;
const TEXT_Y_OFFSET = 310;

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', ['GET']);
        return response.status(405).json({ error: `Method ${request.method} Not Allowed` });
    }

    let requestedTokenId = request.query.tokenId;

    console.log(`[ESM Strategy] Handler invoked for: ${requestedTokenId}`);
    console.log(`[ESM Strategy] import.meta.url: ${import.meta.url}`);
    console.log(`[ESM Strategy] __filename_esm: ${__filename_esm}`);
    console.log(`[ESM Strategy] __dirname_esm: ${__dirname_esm}`);
    console.log(`[ESM Strategy] Calculated LOGO_IMAGE_PATH: ${LOGO_IMAGE_PATH}`);

    try {
        if (requestedTokenId && requestedTokenId.endsWith('.json')) {
            requestedTokenId = requestedTokenId.slice(0, -5);
        }

        if (!requestedTokenId || isNaN(parseInt(requestedTokenId))) {
            return response.status(400).json({ error: 'Invalid or missing tokenId parameter.' });
        }

        const degenTokenId = String(requestedTokenId);
        const kvKey = `degenPetRecord_${degenTokenId}`;
        
        console.log(`Fetching KV record for key: ${kvKey} (Token ID: ${degenTokenId})`);
        let mintRecord = await kv.get(kvKey);

        if (!mintRecord) {
            console.error(`No mint record found in KV for key: ${kvKey}`);
            return response.status(404).json({ error: `Metadata (mint record) for Token ID ${degenTokenId} not found in KV store.` });
        }
        console.log(`KV Record Found for Token ID ${degenTokenId}:`, mintRecord);

        let imageIpfsCid = mintRecord.imageIpfsCid;
        const userDegenScore = mintRecord.score;

        if (userDegenScore === undefined || userDegenScore === null || isNaN(Number(userDegenScore))) {
            console.error(`Invalid or missing score in KV record for Token ID ${degenTokenId}:`, mintRecord);
            return response.status(500).json({ error: `Internal error: Score data missing or invalid for Token ID ${degenTokenId}.` });
        }

        if (!imageIpfsCid) {
            console.log(`No imageIpfsCid found for ${degenTokenId}. Generating new image.`);
            console.log("Attempting to read logo from (ESM strategy):", LOGO_IMAGE_PATH);
            
            try {
                await fs.access(LOGO_IMAGE_PATH, fs.constants.F_OK);
                console.log(`[ESM Strategy] fs.access check: File exists at ${LOGO_IMAGE_PATH}`);
            } catch (accessError) {
                console.error(`[ESM Strategy] fs.access check: File does NOT exist or not accessible at ${LOGO_IMAGE_PATH}. Error: ${accessError.message}`);
            }
            
            const logoBuffer = await fs.readFile(LOGO_IMAGE_PATH);
            console.log("Logo buffer read successfully with ESM strategy.");
            
            const svgText = `
                <svg width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}">
                    <style>
                        .scoreText {
                            font-family: "${FONT_FAMILY}";
                            font-size: ${FONT_SIZE}px;
                            font-weight: bold;
                            fill: "${TEXT_COLOR}" !important;
                            text-anchor: middle; 
                            dominant-baseline: middle; 
                        }
                    </style>
                    <text x="${TEXT_X_OFFSET}" y="${TEXT_Y_OFFSET}" class="scoreText">${userDegenScore}</text>
                </svg>
            `;
            const textBuffer = Buffer.from(svgText);

            const imageWithScoreBuffer = await sharp(logoBuffer)
                .composite([{ input: textBuffer, top: 0, left: 0 }])
                .png()
                .toBuffer();

            const imageStream = Readable.from(imageWithScoreBuffer);
            const options = {
                pinataMetadata: { name: `DegenPet_ScoreImage_${degenTokenId}`, keyvalues: { tokenId: degenTokenId, score: userDegenScore }},
                pinataOptions: { cidVersion: 0 }
            };
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

        const metadata = {
            name: `Degen Pet #${degenTokenId}`,
            description: `An exclusive Degen Pet, companion on Apechain. This pet proudly displays a Degen Score of ${userDegenScore}.`,
            image: `ipfs://${imageIpfsCid}`,
            attributes: [
                { trait_type: "Degen Score", value: Number(userDegenScore) },
                { trait_type: "Token ID", value: parseInt(degenTokenId) }
            ]
        };

        response.setHeader('Content-Type', 'application/json');
        return response.status(200).json(metadata);

    } catch (error) {
        console.error(`Error in handler for ${request.query.tokenId || 'unknown'}:`, error);
        if (error.code === 'ENOENT' && error.path && error.path.includes('degenpet_base_logo.png')) {
             console.error(`LOGO FILE NOT FOUND AT (ESM strategy): ${error.path}.`);
             return response.status(500).json({ error: `Internal Server Error: Base logo image file not found. Attempted: ${error.path}` });
        }
        if (error instanceof TypeError && error.message.includes("Cannot read properties of null")) {
             console.error(`KV record might be null or malformed for token ${request.query.tokenId}. Error: ${error.message}`);
             return response.status(404).json({ error: `Data record not found or was malformed for token ${request.query.tokenId}.` });
        }
        if ((error.reason && error.details) || (error.message && error.message.toLowerCase().includes('pinata')) || (error.response && error.response.data)) {
             console.error('Pinata Specific Error Data:', error.response ? error.response.data : (error.details || error.message));
             return response.status(500).json({ error: 'Internal Server Error: Pinata processing failed.'});
        }
        return response.status(500).json({ error: 'Internal Server Error fetching metadata.', details: error.message });
    }
}