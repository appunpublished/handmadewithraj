#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

async function main() {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const targetEmail = process.argv[2];

  if (!serviceAccountPath) {
    throw new Error("Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service account JSON path.");
  }

  if (!targetEmail) {
    throw new Error("Usage: node scripts/set-admin-claim.mjs <admin-email>");
  }

  const raw = await readFile(serviceAccountPath, "utf8");
  const serviceAccount = JSON.parse(raw);

  initializeApp({
    credential: cert(serviceAccount)
  });

  const auth = getAuth();
  const user = await auth.getUserByEmail(targetEmail);

  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log(`Admin claim set for ${targetEmail} (uid: ${user.uid}).`);
  console.log("User must sign out and sign back in for claim refresh.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
