import * as admin from "firebase-admin";
import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as v1auth from "firebase-functions/v1/auth";
import {
  UserProfile,
  DesignDocument,
  GenerateDesignPayload,
  EstimateCostPayload,
} from "./types";
import { callAiService, isAiConfigured } from "./ai";
import { CATALOG_SEED } from "./catalog";
import { rankRecommendations, estimateCost } from "./recommendations";

// ── Init (single instance) ────────────────────────────────────────────────────
admin.initializeApp();
const db = admin.firestore();

// ── Constants ─────────────────────────────────────────────────────────────────
const STARTING_CREDITS = 5;
const CREDITS_PER_GENERATION = 1;

// ── Health check ──────────────────────────────────────────────────────────────
export const healthCheck = onRequest((req, res) => {
  res.json({
    status: "ok",
    service: "interior-design-ai",
    aiConfigured: isAiConfigured(),
    sparkPlanNote: isAiConfigured()
      ? null
      : "AI_API_URL / AI_API_KEY not set. Running mock generation (Spark plan).",
  });
});

// ── TASK 1: Auto-create Firestore user profile on Auth signup ─────────────────
//
// Uses firebase-functions/v1 auth.user().onCreate() — works on the free
// Spark plan with no Identity Platform upgrade required.
// beforeUserCreated (v2/identity) was removed because it requires Identity
// Platform, which is a paid/billing-linked feature.
//
export const onUserCreate = v1auth.user().onCreate(async (user) => {
  const profile: UserProfile = {
    name: user.displayName ?? "",
    email: user.email ?? "",
    credits: STARTING_CREDITS,
    role: "customer",           // never trust a role from the client
    createdAt: admin.firestore.Timestamp.now(),
  };

  await db.collection("users").doc(user.uid).set(profile);
  console.log(`[onUserCreate] Profile created for uid=${user.uid}`);
});

// ── TASK 2: Assign admin role (callable — owner-only bootstrap) ───────────────
//
// HOW TO ASSIGN THE FIRST ADMIN:
//   1. Deploy this function.
//   2. In the Firebase Console → Functions → Shell (or via the Admin SDK
//      in a one-off Node script), call:
//
//        const { initializeApp } = require('firebase-admin');
//        const app = initializeApp();
//        await app.auth().setCustomUserClaims('<TARGET_UID>', { role: 'admin' });
//
//   3. The target user must sign out and sign back in for the new token
//      to take effect (tokens are refreshed every hour automatically).
//
// After the first admin exists, that admin can call this function from a
// trusted admin tool to promote other users. The function itself is never
// exposed as a public endpoint — it requires the caller to already be admin.
//
export const setAdminRole = onCall(async (request) => {
  // Only an existing admin may promote another user
  if (request.auth?.token?.role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Only admins can assign the admin role."
    );
  }

  const { targetUid } = request.data as { targetUid?: string };
  if (!targetUid || typeof targetUid !== "string") {
    throw new HttpsError("invalid-argument", "targetUid is required.");
  }

  // Read existing claims first so we never wipe unrelated claims
  const existingUser = await admin.auth().getUser(targetUid);
  const existingClaims = existingUser.customClaims ?? {};
  await admin.auth().setCustomUserClaims(targetUid, { ...existingClaims, role: "admin" });

  // Mirror the role in Firestore so queries/UI can reflect it
  await db.collection("users").doc(targetUid).update({ role: "admin" });

  console.log(`[setAdminRole] uid=${targetUid} promoted to admin by uid=${request.auth.uid}`);
  return { success: true, targetUid };
});

// ── TASK 3: Mock design generation (callable) ─────────────────────────────────
//
// Safe mock flow — no external AI service is called.
// Replace the mock result block with real AI calls in a future task.
//
export const generateDesign = onCall(async (request) => {
  // 1. Require authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const callerUid = request.auth.uid;
  const { designId } = request.data as GenerateDesignPayload;

  if (!designId || typeof designId !== "string") {
    throw new HttpsError("invalid-argument", "designId is required.");
  }

  const designRef = db.collection("designs").doc(designId);

  // 2. Load and validate the design document
  const snap = await designRef.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Design not found.");
  }

  const design = snap.data() as DesignDocument;

  // 3. Ownership check — prevent accessing another user's design
  if (design.ownerId !== callerUid) {
    throw new HttpsError("permission-denied", "You do not own this design.");
  }

  // 4. Guard against re-processing
  if (design.status === "processing") {
    throw new HttpsError("failed-precondition", "Design is already being processed.");
  }
  if (design.status === "completed") {
    throw new HttpsError("failed-precondition", "Design has already been generated.");
  }

  const userRef = db.collection("users").doc(callerUid);

  // 5 & 6. Atomically verify credits and flip status to "processing".
  //
  // The transaction reads both the user profile and the design inside a
  // single atomic operation. If two requests arrive simultaneously, only
  // one will succeed — the other will either retry (and find status is
  // already "processing") or abort on the credit check. This prevents
  // double-charging and negative credit balances.
  //
  await db.runTransaction(async (tx) => {
    const [userSnap, freshDesignSnap] = await Promise.all([
      tx.get(userRef),
      tx.get(designRef),
    ]);

    if (!userSnap.exists) {
      throw new HttpsError("not-found", "User profile not found.");
    }

    // Re-check status inside the transaction — a concurrent call may have
    // already flipped it to "processing" between our earlier read and now.
    const freshStatus = (freshDesignSnap.data() as DesignDocument).status;
    if (freshStatus === "processing") {
      throw new HttpsError("failed-precondition", "Design is already being processed.");
    }
    if (freshStatus === "completed") {
      throw new HttpsError("failed-precondition", "Design has already been generated.");
    }

    const credits: number = userSnap.data()?.credits ?? 0;
    if (credits < CREDITS_PER_GENERATION) {
      throw new HttpsError(
        "resource-exhausted",
        "Insufficient credits. Please top up to generate more designs."
      );
    }

    // Flip to processing atomically — no other transaction can pass the
    // status check above after this write commits.
    tx.update(designRef, { status: "processing", errorMessage: null });
  });

  // Beyond this point the design is locked to "processing".
  // Any failure below must reset it to "failed" — credits are never
  // touched until generation succeeds.
  try {
    // 7. Call AI service (mock on Spark plan, real on Blaze with secrets set)
    const aiOutput = await callAiService({
      roomType: design.roomType,
      style: design.style,
      budgetRange: design.budgetRange,
      imageStoragePath: design.originalImagePath,
    });

    const { results: mockResults, palette: mockPalette } = aiOutput;

    // Ranked furniture recommendations from local catalog (free, no network call)
    const ranked = rankRecommendations(design.style, design.roomType, design.budgetRange);
    const mockRecommendations = aiOutput.recommendations;

    // ── END GENERATION BLOCK ─────────────────────────────────────────────────

    // 8. Atomically commit results and deduct exactly one credit.
    //    All reads happen before any write — if any check fails the
    //    transaction aborts and no data is modified.
    await db.runTransaction(async (tx) => {
      const [commitDesignSnap, commitUserSnap] = await Promise.all([
        tx.get(designRef),
        tx.get(userRef),
      ]);

      // 8a. Re-verify ownership — guard against token/document tampering
      //     between the lock transaction and this commit transaction.
      const commitDesign = commitDesignSnap.data() as DesignDocument;
      if (commitDesign.ownerId !== callerUid) {
        throw new HttpsError("permission-denied", "You do not own this design.");
      }

      // 8b. Re-verify status is still "processing" — a concurrent admin
      //     action could have changed it between the two transactions.
      if (commitDesign.status !== "processing") {
        throw new HttpsError(
          "failed-precondition",
          `Unexpected design status '${commitDesign.status}' at commit time.`
        );
      }

      // 8c. Re-verify the user still has sufficient credits — guards against
      //     a credit deduction that happened between the two transactions.
      const currentCredits: number = commitUserSnap.data()?.credits ?? 0;
      if (currentCredits < CREDITS_PER_GENERATION) {
        throw new HttpsError(
          "resource-exhausted",
          "Insufficient credits. Please top up to generate more designs."
        );
      }

      // All checks passed — write results and deduct exactly one credit.
      tx.update(designRef, {
        status: "completed",
        results: mockResults,
        palette: mockPalette,
        recommendations: mockRecommendations,
        furnitureRecommendations: ranked,   // ranked catalog items stored alongside
        isMock: aiOutput.isMock,
        errorMessage: null,
      });

      tx.update(userRef, {
        credits: admin.firestore.FieldValue.increment(-CREDITS_PER_GENERATION),
      });
    });

    console.log(
      `[generateDesign] Completed designId=${designId} for uid=${callerUid}`
    );

    return { success: true, designId, isMock: aiOutput.isMock };

  } catch (err) {
    // 9. Generation failed after the design was already set to "processing".
    //    Reset to "failed" with a message. Credits are NOT deducted.
    //    HttpsErrors from the commit transaction (e.g. resource-exhausted)
    //    are also caught here so the design is never left stuck in "processing".
    const message = err instanceof Error ? err.message : "Unknown error during generation.";

    await designRef.update({
      status: "failed",
      results: null,
      palette: null,
      recommendations: null,
      errorMessage: `[generateDesign] ${message}`,
    });

    console.error(`[generateDesign] Failed designId=${designId}:`, message);

    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", "Design generation failed. Please try again.");
  }
});

// ── Firestore trigger: log new design submissions ─────────────────────────────
// Lightweight audit log — replace or extend when adding a real job queue.
export const onDesignCreated = onDocumentCreated("designs/{designId}", (event) => {
  const designId = event.params.designId;
  const data = event.data?.data() as Partial<DesignDocument> | undefined;
  console.log(`[onDesignCreated] New design queued: designId=${designId} ownerId=${data?.ownerId}`);
});

// ── getCatalog (callable) ────────────────────────────────────────────────────────────
// Returns active catalog items, optionally filtered by category and/or style.
// Served from in-memory seed data — no Firestore read needed for browsing.
export const getCatalog = onCall((request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { category, style } = (request.data ?? {}) as {
    category?: string;
    style?: string;
  };

  let items = CATALOG_SEED.filter((i) => i.isActive);

  if (category) {
    items = items.filter((i) => i.category === category);
  }
  if (style) {
    items = items.filter((i) => i.styles.includes(style as never));
  }

  return { items, total: items.length, currency: "PKR" };
});

// ── getRecommendations (callable) ──────────────────────────────────────────────────
// Returns ranked furniture recommendations for a given style + room type.
export const getRecommendations = onCall((request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { style, roomType, budgetRange, maxResults } = (request.data ?? {}) as {
    style?: string;
    roomType?: string;
    budgetRange?: string;
    maxResults?: number;
  };

  if (!style || !roomType || !budgetRange) {
    throw new HttpsError("invalid-argument", "style, roomType and budgetRange are required.");
  }

  const ranked = rankRecommendations(style, roomType, budgetRange, maxResults ?? 6);
  return { recommendations: ranked, currency: "PKR" };
});

// ── estimateCost (callable) ──────────────────────────────────────────────────────────
// Accepts a list of selected catalog item IDs and returns a PKR cost breakdown.
// Prices come from the server-side catalog — the client cannot manipulate them.
export const estimateCostFn = onCall((request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const { designId, selectedItemIds } = (request.data ?? {}) as EstimateCostPayload;

  if (!designId || !Array.isArray(selectedItemIds) || selectedItemIds.length === 0) {
    throw new HttpsError("invalid-argument", "designId and a non-empty selectedItemIds array are required.");
  }

  // Load the design to get the budgetRange — prevents client from spoofing it
  return db.collection("designs").doc(designId).get().then((snap) => {
    if (!snap.exists) {
      throw new HttpsError("not-found", "Design not found.");
    }
    const design = snap.data() as DesignDocument;
    if (design.ownerId !== request.auth!.uid) {
      throw new HttpsError("permission-denied", "You do not own this design.");
    }
    const estimate = estimateCost(selectedItemIds, design.budgetRange);
    return estimate;
  });
});

// ── seedCatalog (callable, admin only) ───────────────────────────────────────────
// Writes the in-memory CATALOG_SEED to Firestore /catalog in a single batch.
// Safe to call multiple times — uses set() with merge so existing fields
// added by admins (e.g. updated prices) are not overwritten.
export const seedCatalog = onCall(async (request) => {
  if (request.auth?.token?.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can seed the catalog.");
  }

  const batch = db.batch();
  for (const item of CATALOG_SEED) {
    const ref = db.collection("catalog").doc(item.id);
    batch.set(ref, item, { merge: true });
  }
  await batch.commit();

  console.log(`[seedCatalog] Wrote ${CATALOG_SEED.length} items to /catalog`);
  return { seeded: CATALOG_SEED.length };
});
