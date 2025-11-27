import { FastifyInstance } from 'fastify';
import { generateSmartPrompt, refineExistingPrompt, generateImage } from '../adapters/geminiAdapter';
import { responseCache } from '../utils/cache';
import { checkRateLimit } from '../utils/rateLimiter';
import * as crypto from 'crypto';

// Increment this version string to invalidate all existing cache entries when logic changes
const CACHE_VERSION = 'v1';

interface GenerateBody {
  action: 'generate' | 'refine' | 'generate-image';
  data: {
    task?: string;
    context?: string;
    tone?: string;
    format?: string;
    prompt?: string;
    refineAction?: string;
    model?: string;
  };
  privacyMode?: boolean; // If true, we skip writing to cache/logging, but can still read
}

export default async function (fastify: FastifyInstance) {
  fastify.post<{ Body: GenerateBody }>('/api/generate', async (request, reply) => {
    const { action, data, privacyMode } = request.body;
    const ip = request.ip;

    // 1. Rate Limiting
    if (!checkRateLimit(ip)) {
      reply.code(429);
      return { error: 'Too many requests. Please try again later.' };
    }

    // 2. Input Validation
    if (!action || !data) {
      reply.code(400);
      return { error: 'Missing required fields: action, data' };
    }

    // 3. Caching (Read) - Image generation is expensive, verify cache for identical requests? 
    // Usually images are unique per request for randomness, so we might skip reading cache for images, 
    // or cache based on a key if we allowed custom prompts.
    
    // Create a deterministic key based on the request body, EXCLUDING privacyMode
    const cachePayload = JSON.stringify({ action, data, version: CACHE_VERSION });
    const cacheKey = crypto.createHash('sha256').update(cachePayload).digest('hex');

    // Skip cache read for image generation to ensure fresh results usually, 
    // unless we strictly want to save tokens. Let's allow caching for consistency if desired.
    const cachedResponse = responseCache.get(cacheKey);
    
    if (cachedResponse && action !== 'generate-image') {
      console.log(`[LOG] Cache hit for ${cacheKey.substring(0, 8)}`);
      return { result: cachedResponse, cached: true };
    }

    try {
      let result = '';
      const startTime = Date.now();

      // 4. Processing
      if (action === 'generate') {
        if (!data.task) throw new Error("VALIDATION_ERROR: Task is required for generation");
        result = await generateSmartPrompt(
          data.task, 
          data.context || '', 
          data.tone || 'Professional', 
          data.format || 'Text',
          data.model
        );
      } else if (action === 'refine') {
        if (!data.prompt) throw new Error("VALIDATION_ERROR: Prompt is required for refinement");
        
        let instruction = "Optimize this prompt";
        if (data.refineAction === 'Shorten') instruction = "Condense this prompt concisely.";
        if (data.refineAction === 'Expand') instruction = "Expand this prompt with details and examples.";
        if (data.refineAction === 'Fix Grammar') instruction = "Fix grammar and sentence structure.";
        if (data.refineAction === 'Convert to JSON Structure') instruction = "Rewrite to demand JSON output.";

        result = await refineExistingPrompt(
          data.prompt,
          instruction,
          data.model
        );
      } else if (action === 'generate-image') {
        // Use gemini-2.5-flash-image
        result = await generateImage();
      } else {
        reply.code(400);
        return { error: 'Invalid action' };
      }

      // 5. Caching (Write) & Logging
      // If privacyMode is ON, we do NOT write to cache or log details
      // Do not cache images to avoid memory bloat (base64 is large)
      if (!privacyMode && result && action !== 'generate-image') {
        responseCache.set(cacheKey, result);
        console.log(`[LOG] ${new Date().toISOString()} | Action: ${action} | IP: ${ip} | Duration: ${Date.now() - startTime}ms`);
      } else {
         console.log(`[LOG] ${new Date().toISOString()} | Action: ${action} | Privacy Mode: ON | Duration: ${Date.now() - startTime}ms`);
      }

      return { result };

    } catch (error: any) {
      console.error("API Error:", error);
      
      let statusCode = 500;
      let message = 'Failed to process request.';
      
      if (error instanceof Error) {
        const errStr = error.message.toLowerCase();

        // Manual validation errors thrown above
        if (error.message.startsWith("VALIDATION_ERROR:")) {
          statusCode = 400;
          message = error.message.replace("VALIDATION_ERROR: ", "");
        }
        // AI Provider errors
        else if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('resource exhausted')) {
          statusCode = 429;
          message = 'AI Service quota exceeded. Please try again later.';
        } else if (errStr.includes('400') || errStr.includes('invalid argument')) {
          statusCode = 400;
          message = 'Invalid input provided to AI model.';
        } else if (errStr.includes('403') || errStr.includes('permission denied')) {
          statusCode = 403;
          message = 'Access denied by AI provider.';
        } else if (errStr.includes('404') || errStr.includes('not found')) {
          statusCode = 404;
          message = 'Requested AI model not found.';
        } else if (errStr.includes('safety') || errStr.includes('blocked')) {
          statusCode = 400;
          message = 'Request blocked by safety filters.';
        } else if (errStr.includes('503') || errStr.includes('unavailable') || errStr.includes('overloaded')) {
          statusCode = 503;
          message = 'AI Service temporarily unavailable.';
        } else if (errStr.includes('fetch failed') || errStr.includes('network')) {
          statusCode = 502;
          message = 'Network error communicating with AI provider.';
        }
      }

      reply.code(statusCode);
      return { 
        error: message, 
        // Only return detailed error message in non-production environments for debugging
        details: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.message : undefined 
      };
    }
  });
}