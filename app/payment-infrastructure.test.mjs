import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

describe("payment infrastructure", () => {
  it("does not ship Stripe checkout, webhook, or billing setup", async () => {
    const packageJson = JSON.parse(await readFile("package.json", "utf8"));
    const packageLock = await readFile("package-lock.json", "utf8");
    const envExample = await readFile(".env.local.example", "utf8");
    const localEnv = await readFile(".env.local", "utf8");

    assert.equal(packageJson.dependencies?.stripe, undefined);
    assert.doesNotMatch(packageLock, /node_modules\/stripe|"stripe":|"stripe"/);
    assert.equal(await exists("app/actions/premium.ts"), false);
    assert.equal(await exists("app/api/stripe/webhook/route.ts"), false);
    assert.equal(await exists("app/premium/success/page.tsx"), false);
    assert.equal(await exists("app/premium/cancel/page.tsx"), false);
    assert.equal(await exists("lib/stripe/config.ts"), false);
    assert.equal(await exists("lib/stripe/client.ts"), false);
    assert.equal(await exists("supabase/migrations/0017_premium_subscriptions.sql"), false);
    assert.doesNotMatch(envExample, /STRIPE_|WEBHOOK_SECRET|CHECKOUT_SESSION/);
    assert.doesNotMatch(localEnv, /STRIPE_|WEBHOOK_SECRET|CHECKOUT_SESSION/);
  });
});
