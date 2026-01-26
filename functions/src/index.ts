/**
 * ASYSTENT PRAWNY AI - Cloud Functions (v2 Modular)
 * 
 * Monolithic index.ts has been refactored into:
 * - src/types/ (Enums and Interfaces)
 * - src/services/ (AI, DB, ISAP, SAOS)
 * - src/prompts/ (System Instructions and Metaprompts)
 * - src/handlers/ (Function implementations)
 */

import { setGlobalOptions } from "firebase-functions/v2";

// Set global options for all functions
setGlobalOptions({
    maxInstances: 10,
    region: 'us-central1' // Or your preferred region
});

// Re-export all handlers
export * from "./handlers";
