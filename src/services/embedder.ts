import { GoogleGenAI } from "@google/genai";
import type { PreprintPaper, SeedPaper } from "../types.js";

/** Wait time in milliseconds when rate limited (1 minute). */
const RATE_LIMIT_WAIT_MS = 60_000;

/**
 * Sleeps for the specified number of milliseconds.
 * @param ms - Duration to sleep in milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Checks if an error is a rate limit error from the API.
 * @param error - The error to check.
 * @returns True if the error indicates rate limiting.
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("quota") ||
      message.includes("rate-limit") ||
      message.includes("429") ||
      message.includes("RESOURCE_EXHAUSTED")
    );
  }
  return false;
}

/**
 * Generates an embedding for a paper using Google GenAI and stores it on the paper object.
 * Uses the paper's title and abstract to create the embedding.
 * Automatically retries on rate limit errors with exponential backoff.
 * @param paper - The paper to generate an embedding for (modified in place).
 * @param verbose - Whether to log progress messages (default: false).
 * @throws Error if GENAI_API_KEY is not set or if embedding fails after retries.
 */
export async function embedPaper(
  paper: PreprintPaper | SeedPaper,
  verbose: boolean = false
): Promise<void> {
  // Check that the API key is set
  const apiKey = process.env.GENAI_API_KEY;
  if (!apiKey) {
    throw new Error("GENAI_API_KEY environment variable is not set.");
  }

  // Initialize the Google GenAI client
  const genai = new GoogleGenAI({ apiKey });

  // Create the text to embed (title + abstract)
  const textToEmbed = `${paper.title}\n\n${paper.abstract}`;
  if (verbose) {
    console.log(`Generating embedding for paper: ${paper.title}`);
  }

  // Retry loop for rate limit handling
  const maxRetries = 5;
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      // Generate the embedding
      const response = await genai.models.embedContent({
        model: "gemini-embedding-001",
        contents: [textToEmbed],
        config: {
          outputDimensionality: 3072,
          taskType: "CLUSTERING",
        },
      });

      // Extract and return the embedding vector
      const embedding = response.embeddings[0].values;
      if (verbose) {
        console.log(
          `Generated embedding of length ${embedding.length} for paper: ${paper.title}`
        );
      }

      // Add the embedding to the paper object
      paper.embedding = embedding;
      return;
    } catch (error) {
      if (isRateLimitError(error)) {
        if (verbose) {
          console.log(
            `Rate limit hit, waiting ${
              RATE_LIMIT_WAIT_MS / 1000
            } seconds before retrying...`
          );
        }
        await sleep(RATE_LIMIT_WAIT_MS);
        // Continue to retry
      } else {
        throw error;
      }
    }
    if (attempt === maxRetries) {
      throw new Error(
        `Failed to generate embedding after ${maxRetries} attempts.`
      );
    }
  }
}
