// File: webapp/api/metadata/[tokenId].js

import { kv } from '@vercel/kv';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import PinataClient from '@pinata/sdk';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';

// --- Calculate __dirname equivalent for ES Modules ---
const __filename_esm = fileURLToPath(import.meta.url);
const __dirname_esm = path.dirname(__filename_esm); // This will be /var/task/webapp/api/metadata

// --- Set Fontconfig Environment Variables ---
// These paths point to where 'assets' and 'fonts.conf' will be relative to the function's dir
const assetsDirRuntimePath = path.join(__dirname_esm, '..', 'assets'); // /var/task/webapp/api/assets
process.env.FONTCONFIG_PATH = assetsDirRuntimePath;
process.env.FONTCONFIG_FILE = path.join(assetsDirRuntimePath, 'fonts.conf');
// ---

// Initialize Pinata Client
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = new PinataClient(pinataApiKey, pinataApiSecret);

// --- Configuration for the image ---
const LOGO_IMAGE_PATH = path.join(assetsDirRuntimePath, 'degenpet_base_logo.png');
const FONT_FILE_ACTUAL_PATH_FOR_REF = path.join(assetsDirRuntimePath, 'DejaVuSans.ttf'); // For debug log

const IMAGE_WIDTH = 500;
const IMAGE_HEIGHT = 500;
const TEXT_COLOR = '#11161D';
const FONT_SIZE = 48;
const FONT_FAMILY = 'DejaVu Sans Bold Oblique'; // <<< Use the name of the font you bundled
const TEXT_X_OFFSET = 250;
const TEXT_Y_OFFSET = 305;

export default async function handler(request, response) {
    if (request.method !== 'GET') { /* ... */ }
    let requestedTokenId = request.query.tokenId;

    console.log(`[Fontconfig Strategy] Handler invoked for: ${requestedTokenId}`);
    console.log(`[Fontconfig Strategy] __dirname_esm: ${__dirname_esm}`);
    console.log(`[Fontconfig Strategy] assetsDirRuntimePath: ${assetsDirRuntimePath}`);
    console.log(`[Fontconfig Strategy] LOGO_IMAGE_PATH: ${LOGO_IMAGE_PATH}`);
    console.log(`[Fontconfig Strategy] FONTCONFIG_PATH set to: ${process.env.FONTCONFIG_PATH}`);
    console.log(`[Fontconfig Strategy] FONTCONFIG_FILE set to: ${process.env.FONTCONFIG_FILE}`);
    console.log(`[Fontconfig Strategy] Font file for reference (DejaVuSans.ttf) expected at: ${FONT_FILE_ACTUAL_PATH_FOR_REF}`);

    try {
        // ... (tokenId parsing, KV fetch, mintRecord null check, userDegenScore validation from previous complete version)
        if (requestedTokenId && requestedTokenId.endsWith('.json')) { requestedTokenId = requestedTokenId.slice(0, -5); }
        if (!requestedTokenId || isNaN(parseInt(requestedTokenId))) { return response.status(400).json({ error: 'Invalid or missing tokenId parameter.' });}
        const degenTokenId = String(requestedTokenId);
        const kvKey = `degenPetRecord_${degenTokenId}`;
        let mintRecord = await kv.get(kvKey);
        if (!mintRecord) { return response.status(404).json({ error: `KV record missing for ${degenTokenId}` });}
        const userDegenScore = mintRecord.score;
        if (userDegenScore === undefined || userDegenScore === null || isNaN(Number(userDegenScore))) { return response.status(500).json({ error: `Invalid score for ${degenTokenId}` }); }
        let imageIpfsCid = mintRecord.imageIpfsCid;


        if (!imageIpfsCid) {
            console.log(`No imageIpfsCid found for ${degenTokenId}. Generating new image.`);
            
            // Debug: Check if font files and conf exist
            try {
                await fs.access(LOGO_IMAGE_PATH, fs.constants.F_OK);
                console.log(`[Fontconfig Strategy] fs.access: Logo exists at ${LOGO_IMAGE_PATH}`);
                await fs.access(FONT_FILE_ACTUAL_PATH_FOR_REF, fs.constants.F_OK);
                console.log(`[Fontconfig Strategy] fs.access: Font TTF seems to exist at ${FONT_FILE_ACTUAL_PATH_FOR_REF}`);
                await fs.access(process.env.FONTCONFIG_FILE, fs.constants.F_OK);
                console.log(`[Fontconfig Strategy] fs.access: fonts.conf seems to exist at ${process.env.FONTCONFIG_FILE}`);
            } catch (accessError) {
                console.error(`[Fontconfig Strategy] fs.access check failed for one of the files: ${accessError.message}`);
            }
            
            const logoBuffer = await fs.readFile(LOGO_IMAGE_PATH);
            console.log("Logo buffer read successfully.");
            
            const svgText = `
                <svg width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}">
                    <style>
                        .scoreText {
                            font-family: "${FONT_FAMILY}"; /* Should be "DejaVu Sans" */
                            font-size: ${FONT_SIZE}px;
                            /* font-weight: bold; */ /* DejaVuSans.ttf is regular, if you want bold, use DejaVuSans-Bold.ttf and update FONT_FAMILY */
                            fill: "${TEXT_COLOR}" !important;
                            text-anchor: middle; 
                            dominant-baseline: middle; 
                        }
                    </style>
                    <text x="${TEXT_X_OFFSET}" y="${TEXT_Y_OFFSET}" class="scoreText">${userDegenScore}</text>
                </svg>
            `;
            const textBuffer = Buffer.from(svgText);

            console.log("Attempting sharp composite with SVG using font:", FONT_FAMILY);
            const imageWithScoreBuffer = await sharp(logoBuffer)
                .composite([{ input: textBuffer, top: 0, left: 0 }])
                .png()
                .toBuffer();
            console.log("Sharp composite successful."); // THE GOAL!

            // ... (Pinata upload, KV update - unchanged from previous complete version) ...
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

        const metadata = { /* ... (unchanged from previous complete version) ... */ name: `Degen Pet #${degenTokenId}`, description: `An exclusive Degen Pet... Score of ${userDegenScore}.`, image: `ipfs://${imageIpfsCid}`, attributes: [ { trait_type: "Degen Score", value: Number(userDegenScore) }, { trait_type: "Token ID", value: parseInt(degenTokenId) } ]};
        response.setHeader('Content-Type', 'application/json');
        return response.status(200).json(metadata);

    } catch (error) {
        // ... (same comprehensive error handling as previous version) ...
        console.error(`Error in handler for ${request.query.tokenId || 'unknown'}:`, error);
        if (error.code === 'ENOENT' && error.path) {
             return response.status(500).json({ error: `Internal Server Error: Required file not found. Attempted: ${error.path}` });
        }
         if (error instanceof TypeError && error.message.includes("Cannot read properties of null")) {
             return response.status(404).json({ error: `Data record not found or was malformed for token ${request.query.tokenId}.` });
        }
        if ((error.reason && error.details) || (error.message && error.message.toLowerCase().includes('pinata')) || (error.response && error.response.data)) {
             return response.status(500).json({ error: 'Internal Server Error: Pinata processing failed.'});
        }
        return response.status(500).json({ error: 'Internal Server Error fetching metadata.', details: error.message, stack: error.stack });
    }
}