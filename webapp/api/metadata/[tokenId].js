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

// IMPORTANT: Path assumes 'images' folder from your 'publicDir' (e.g., webapp/Public/images)
// is available at the root of the serverless function's deployment environment.
const LOGO_IMAGE_PATH = path.join(process.cwd(), 'images', 'degenpet_base_logo.png');

// Ensure these dimensions match your actual degenpet_base_logo.png
const IMAGE_WIDTH = 500;
const IMAGE_HEIGHT = 500;

const TEXT_COLOR = '#FFD700';
const FONT_SIZE = 48;
const FONT_FAMILY = 'Arial';

// Adjust these for precise text placement in your logo's box
const TEXT_X_OFFSET = 250;
const TEXT_Y_OFFSET = 310; // Value from previous successful visual placement

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', ['GET']);
        return response.status(405).json({ error: `Method ${request.method} Not Allowed` });
    }

    let requestedTokenId = request.query.tokenId;

    // --- TEMPORARY DEBUGGING: List directories ---
    try {
        console.log("[DEBUG] Current working directory (process.cwd()):", process.cwd());

        const rootDirContents = await fs.readdir(process.cwd());
        console.log("[DEBUG] Contents of process.cwd() (/var/task/):", rootDirContents);

        // Check if 'images' directory exists directly under process.cwd()
        if (rootDirContents.includes('images')) {
            const imagesDirContents = await fs.readdir(path.join(process.cwd(), 'images'));
            console.log("[DEBUG] Contents of process.cwd()/images/:", imagesDirContents);
        } else {
            console.warn("[DEBUG] 'images' directory NOT found directly under process.cwd()");
        }

        // Check for 'public' or 'Public' just in case the assumption is wrong
        if (rootDirContents.includes('public')) {
             console.log("[DEBUG] 'public' (lowercase) directory FOUND under process.cwd()");
        } else if (rootDirContents.includes('Public')) {
             console.log("[DEBUG] 'Public' (uppercase) directory FOUND under process.cwd()");
        } else {
            console.warn("[DEBUG] Neither 'public' nor 'Public' directory found directly under process.cwd()");
        }

    } catch (readdirError) {
        console.error("[DEBUG] Error listing directories:", readdirError.message);
    }
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

        if (!mintRecord) {
            return response.status(404).json({ error: `Metadata for Token ID ${degenTokenId} not found.` });
        }

        let imageIpfsCid = mintRecord.imageIpfsCid;
        const userDegenScore = mintRecord.score;

        if (!imageIpfsCid) {
            console.log(`No imageIpfsCid found for ${degenTokenId}. Generating new image.`);
            
            console.log("Attempting to read logo from:", LOGO_IMAGE_PATH); // Use the new LOGO_IMAGE_PATH
            const logoBuffer = await fs.readFile(LOGO_IMAGE_PATH);

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
                { trait_type: "Degen Score", value: userDegenScore },
                { trait_type: "Token ID", value: parseInt(degenTokenId) }
            ]
        };

        response.setHeader('Content-Type', 'application/json');
        return response.status(200).json(metadata);

    } catch (error) {
        console.error(`Error fetching metadata for tokenId ${request.query.tokenId || 'unknown'}:`, error);
        if (error.code === 'ENOENT' && error.path && error.path.includes('degenpet_base_logo.png')) {
             console.error(`LOGO FILE NOT FOUND AT: ${error.path}. Check casing and Vercel deployment structure. Assumed path from publicDir is flattened.`);
             return response.status(500).json({ error: `Internal Server Error: Base logo image file not found. Attempted: ${error.path}` });
        }
        // ... (other existing error handling from previous versions)
        if ((error.reason && error.details) || (error.message && error.message.toLowerCase().includes('pinata')) || (error.response && error.response.data)) {
             console.error('Pinata Specific Error Data:', error.response ? error.response.data : (error.details || error.message));
             return response.status(500).json({ error: 'Internal Server Error: Pinata processing failed.'});
        }
        return response.status(500).json({ error: 'Internal Server Error fetching metadata.', details: error.message });
    }
}