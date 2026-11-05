import { AiGenerationInput, AiGenerationOutput, DesignResult, ColorSwatch } from "./types";

// ── AI Integration stub ───────────────────────────────────────────────────────
//
// SPARK PLAN NOTE:
//   Cloud Functions on the Spark (free) plan cannot make outbound network
//   requests to external APIs. This stub will always use the mock path
//   until the project is upgraded to the Blaze plan.
//
// CONFIGURATION (Blaze plan only):
//   Set these Firebase Function secrets before deploying:
//     firebase functions:secrets:set AI_API_URL
//     firebase functions:secrets:set AI_API_KEY
//
//   The function reads them at runtime via process.env. Never hard-code
//   URLs or tokens here.
//
// TO SWAP IN A REAL AI PROVIDER:
//   1. Upgrade to Blaze plan.
//   2. Set AI_API_URL and AI_API_KEY secrets.
//   3. Replace the body of callAiService() below with your real HTTP call.
//   4. Map the provider response to AiGenerationOutput.
//   5. Set isMock: false in the returned output.
// ─────────────────────────────────────────────────────────────────────────────

const AI_API_URL = process.env.AI_API_URL;   // undefined on Spark plan
const AI_API_KEY = process.env.AI_API_KEY;   // undefined on Spark plan

export function isAiConfigured(): boolean {
  return Boolean(AI_API_URL && AI_API_KEY);
}

// Returns mock output when AI is not configured (Spark plan).
// Returns real AI output when secrets are set (Blaze plan).
export async function callAiService(
  input: AiGenerationInput
): Promise<AiGenerationOutput> {
  if (!isAiConfigured()) {
    return buildMockOutput(input);
  }

  // ── REAL AI CALL (Blaze plan only) ────────────────────────────────────────
  // Replace this block with your actual provider integration.
  // Example shape only — do not use as-is.
  //
  // const response = await fetch(AI_API_URL!, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     "Authorization": `Bearer ${AI_API_KEY}`,
  //   },
  //   body: JSON.stringify({
  //     room_type: input.roomType,
  //     style: input.style,
  //     image_path: input.imageStoragePath,
  //   }),
  // });
  //
  // if (!response.ok) {
  //   throw new Error(`AI service error: ${response.status} ${response.statusText}`);
  // }
  //
  // const data = await response.json();
  // return mapProviderResponse(data);
  // ── END REAL AI CALL ──────────────────────────────────────────────────────

  // Fallback — should not be reached once the block above is implemented
  return buildMockOutput(input);
}

// ── Mock output builder ───────────────────────────────────────────────────────
// Produces clearly labelled mock data. isMock: true on every result.
// Replace with real provider mapping when integrating.

function buildMockOutput(input: AiGenerationInput): AiGenerationOutput {
  const { roomType, style, imageStoragePath } = input;
  const base = `mock/designs/${imageStoragePath.split("/").pop() ?? "unknown"}`;

  const results: DesignResult[] = [
    {
      label: `[MOCK] ${style} ${roomType} — variant 1`,
      imagePath: `${base}/result_1.jpg`,
      isMock: true,
    },
    {
      label: `[MOCK] ${style} ${roomType} — variant 2`,
      imagePath: `${base}/result_2.jpg`,
      isMock: true,
    },
  ];

  const palette: ColorSwatch[] = [
    { name: "Warm Sand",   hex: "#C2A882" },
    { name: "Slate Grey",  hex: "#6B7280" },
    { name: "Ivory White", hex: "#F5F0E8" },
    { name: "Deep Walnut", hex: "#4A3728" },
  ];

  const recommendations: string[] = [
    "[MOCK] Add a statement rug to anchor the seating area.",
    "[MOCK] Use warm-toned lighting (2700K–3000K) for a cosy feel.",
    "[MOCK] Consider open shelving to maximise vertical space.",
  ];

  return { results, palette, recommendations, isMock: true };
}
