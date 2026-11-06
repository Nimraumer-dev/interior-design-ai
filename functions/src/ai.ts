import { getStorage } from "firebase-admin/storage";
import { AiGenerationInput, AiGenerationOutput, DesignResult, ColorSwatch } from "./types";

// AI service (Colab) integration. Needs the Blaze plan and the secrets
// AI_API_URL (no trailing slash, no /redesign) and AI_API_KEY.

const AI_API_URL = process.env.AI_API_URL;
const AI_API_KEY = process.env.AI_API_KEY;

export function isAiConfigured(): boolean {
  return Boolean(AI_API_URL && AI_API_KEY);
}

export async function callAiService(
  input: AiGenerationInput
): Promise<AiGenerationOutput> {
  if (!isAiConfigured()) {
    return buildMockOutput(input);
  }

  const bucket = getStorage().bucket();

  // 1) Temporary signed URL for the uploaded photo (15 minutes)
  const [imageUrl] = await bucket.file(input.imageStoragePath).getSignedUrl({
    action: "read",
    expires: Date.now() + 15 * 60 * 1000,
  });

  const name = input.imageStoragePath.split("/").pop() ?? "unknown";

  // 2) Call the AI service
  const response = await fetch(`${AI_API_URL}/redesign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      designId: name,
      imageUrl,
      roomType: input.roomType,
      style: input.style,
      numVariants: 1,
      seed: 42,
    }),
    signal: AbortSignal.timeout(150000),
  });

  const data: any = await response.json();
  if (!response.ok || data.status !== "ok") {
    throw new Error(`AI service error: ${response.status} ${data.message ?? ""}`);
  }

  // 3) Save base64 results to Storage
  const results: DesignResult[] = [];
  for (let i = 0; i < data.results.length; i++) {
    const path = `designs/${name}/result_${i + 1}.jpg`;
    await bucket.file(path).save(
      Buffer.from(data.results[i].imageBase64, "base64"),
      { contentType: "image/jpeg" }
    );
    results.push({
      label: `${input.style} ${input.roomType} - variant ${i + 1}`,
      imagePath: path,
      isMock: false,
    });
  }

  // 4) Palette: AI returns hex colors, backend needs names too
  const palette: ColorSwatch[] = (data.palette ?? []).map(
    (hex: string, i: number) => ({ name: `Color ${i + 1}`, hex })
  );

  return {
    results,
    palette,
    recommendations: [
      "Add a statement rug to anchor the seating area.",
      "Use warm-toned lighting (2700K-3000K) for a cosy feel.",
    ],
    isMock: false,
  };
}

// ── Mock output builder (used when AI is not configured) ─────────────────────

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