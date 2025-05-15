// File: webapp/api/metadata/[tokenId].js

import { kv } from '@vercel/kv';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises'; // For reading the logo file
import PinataClient from '@pinata/sdk';
import { Readable } from 'stream'; // For creating a stream from buffer for Pinata

// Initialize Pinata Client
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = new PinataClient(pinataApiKey, pinataApiSecret);

// --- Configuration for the image ---
// Path to your base logo image within the Vercel deployment
const LOGO_IMAGE_PATH = path.join(process.cwd(), 'public', 'images', 'degenpet_base_logo.png');

// IMPORTANT: Update these if your degenpet_base_logo.png is NOT 500x500 pixels
const IMAGE_WIDTH = 500; // Assumed width of your logo
const IMAGE_HEIGHT = 500; // Assumed height of your logo

// Text Styling - Iteration 1
const TEXT_COLOR = '#FFD700';       // Target: Yellow/Gold
const FONT_SIZE = 48;             // Iteration 1: Smaller font size
const FONT_FAMILY = 'Arial';      // Iteration 1: More generic font name, bold will be applied via style

// Text Positioning - Iteration 1: Estimates for the center of the white box
// These values will likely need further fine-tuning based on visual results.
const TEXT_X_OFFSET = 250;        // Estimated horizontal center for text
const TEXT_Y_OFFSET = 300;        // Estimated vertical center for text

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', ['GET']);
        return response.status(405).json({ error: `Method ${request.method} Not Allowed` });
    }

    let requestedTokenId = request.query.tokenId; // e.g., "101.json" or "101"

    try {
        // Remove .json extension if present, as per your contract's tokenURI structure
        if (requestedTokenId && requestedTokenId.endsWith('.json')) {
            requestedTokenId = requestedTokenId.slice(0, -5);
        }

        if (!requestedTokenId || isNaN(parseInt(requestedTokenId))) {
            return response.status(400).json({ error: 'Invalid or missing tokenId parameter.' });
        }

        const degenTokenId = String(requestedTokenId);
        const kvKey = `degenPetRecord_${degenTokenId}`;

        // 1. Fetch mint record from Vercel KV
        let mintRecord = await kv.get(kvKey);

        if (!mintRecord) {
            return response.status(404).json({ error: `Metadata for Token ID ${degenTokenId} not found. Has it been minted and recorded?` });
        }

        let imageIpfsCid = mintRecord.imageIpfsCid;
        const userDegenScore = mintRecord.score;

        // 2. If image IPFS CID doesn't exist, generate image, upload to Pinata, and update KV
        if (!imageIpfsCid) {
            console.log(`No imageIpfsCid found for ${degenTokenId}. Generating new image.`);

            // Load base logo
            const logoBuffer = await fs.readFile(LOGO_IMAGE_PATH);

            // Create SVG for the text overlay - Iteration 1 Style Changes
            const svgText = `
                <svg width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}">
                    <style>
                        .scoreText {
                            font-family: "${FONT_FAMILY}";
                            font-size: ${FONT_SIZE}px;
                            font-weight: bold; /* Added for Arial Bold effect */
                            fill: "${TEXT_COLOR}";
                            text-anchor: middle; /* Horizontally center the text */
                            dominant-baseline: middle; /* Vertically center text around y-coordinate */
                        }
                    </style>
                    <text x="${TEXT_X_OFFSET}" y="${TEXT_Y_OFFSET}" class="scoreText">${userDegenScore}</text>
                </svg>
            `;
            const textBuffer = Buffer.from(svgText);

            // Composite text onto logo
            const imageWithScoreBuffer = await sharp(logoBuffer)
                .composite([{ input: textBuffer, top: 0, left: 0 }]) // SVG overlay matches base image size
                .png() // Output as PNG
                .toBuffer();

            // Upload image to Pinata
            const imageStream = Readable.from(imageWithScoreBuffer);
            const options = {
                pinataMetadata: {
                    name: `DegenPet_ScoreImage_${degenTokenId}`,
                    keyvalues: {
                        tokenId: degenTokenId,
                        score: userDegenScore
                    }
                },
                pinataOptions: {
                    cidVersion: 0 // Use CIDv0 for wider compatibility (e.g. ipfs://Qm...)
                }
            };
            console.log(`Uploading image for ${degenTokenId} to Pinata...`);
            const pinataResponse = await pinata.pinFileToIPFS(imageStream, options);
            imageIpfsCid = pinataResponse.IpfsHash;
            console.log(`Image uploaded to Pinata. IPFS Hash (CID): ${imageIpfsCid} for ${degenTokenId}`);

            // Update KV store with the new imageIpfsCid
            mintRecord.imageIpfsCid = imageIpfsCid;
            mintRecord.imageGeneratedAt = new Date().toISOString();
            await kv.set(kvKey, mintRecord);
            console.log(`Updated KV store for ${degenTokenId} with imageIpfsCid: ${imageIpfsCid}`);
        } else {
            console.log(`Using existing imageIpfsCid: ${imageIpfsCid} for ${degenTokenId}`);
        }

        // 3. Construct ERC721 Metadata
        const metadata = {
            name: `Degen Pet #${degenTokenId}`,
            description: `An exclusive Degen Pet, companion on Apechain. This pet proudly displays a Degen Score of ${userDegenScore}.`,
            image: `ipfs://${imageIpfsCid}`, // Standard IPFS URI
            attributes: [
                {
                    trait_type: "Degen Score",
                    value: userDegenScore // Keep score as a number if possible, or string if marketplaces prefer
                },
                {
                    trait_type: "Token ID",
                    value: parseInt(degenTokenId)
                }
            ]
        };

        // Set Content-Type header and return metadata
        response.setHeader('Content-Type', 'application/json');
        return response.status(200).json(metadata);

    } catch (error) {
        console.error(`Error fetching metadata for tokenId ${request.query.tokenId || 'unknown'}:`, error);

        // Improved Error Handling
        if (error.message && error.message.includes('No such file or directory') && error.message.includes('degenpet_base_logo.png')) {
            return response.status(500).json({ error: 'Internal Server Error: Base logo image not found. Check LOGO_IMAGE_PATH.' });
        }
        // Check for Pinata specific error structure or general message
        if ((error.reason && error.details) || (error.message && error.message.toLowerCase().includes('pinata')) || (error.response && error.response.data)) {
             console.error('Pinata Specific Error Data:', error.response ? error.response.data : (error.details || error.message));
             return response.status(500).json({ error: 'Internal Server Error: Could not process image with Pinata.'});
        }
        return response.status(500).json({ error: 'Internal Server Error while fetching metadata.' });
    }
}