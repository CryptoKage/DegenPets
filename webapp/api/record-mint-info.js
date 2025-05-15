// File: webapp/api/record-mint-info.js

import { kv } from '@vercel/kv';

/**
 * API handler for recording mint information (tokenId and userScore).
 * Endpoint: /api/record-mint-info
 * Method: POST
 * Body: { tokenId: string | number, userScore: number }
 */
export default async function handler(request, response) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        response.setHeader('Allow', ['POST']);
        return response.status(405).json({ error: `Method ${request.method} Not Allowed` });
    }

    try {
        const { tokenId, userScore } = request.body;

        // Validate input
        if (tokenId === undefined || tokenId === null || userScore === undefined || userScore === null) {
            return response.status(400).json({ error: 'Missing tokenId or userScore in request body.' });
        }

        const degenTokenId = String(tokenId); // Ensure tokenId is a string for consistent keying
        const degenUserScore = Number(userScore);

        if (isNaN(degenUserScore)) {
            return response.status(400).json({ error: 'Invalid userScore. Must be a number.' });
        }

        // Prepare the data to be stored
        // We store the score and a placeholder for the image IPFS CID,
        // which will be generated on-demand by the metadata endpoint.
        const mintRecord = {
            score: degenUserScore,
            imageIpfsCid: null, // Will be populated later by the metadata endpoint
            recordedAt: new Date().toISOString(),
        };

        // Store the data in Vercel KV
        // The key will be something like "degenPetRecord_123"
        await kv.set(`degenPetRecord_${degenTokenId}`, mintRecord);

        console.log(`Successfully recorded mint info for tokenId: ${degenTokenId}, score: ${degenUserScore}`);
        return response.status(200).json({
            message: 'Mint information recorded successfully.',
            tokenId: degenTokenId,
            score: degenUserScore
        });

    } catch (error) {
        console.error('Error recording mint info:', error);
        // Check if the error is from parsing JSON body (e.g. malformed JSON)
        if (error instanceof SyntaxError && error.message.includes('JSON')) {
            return response.status(400).json({ error: 'Invalid JSON in request body.' });
        }
        return response.status(500).json({ error: 'Internal Server Error while recording mint info.' });
    }
}