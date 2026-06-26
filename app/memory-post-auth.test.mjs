import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const createMemoryPostRoutes = [
  "app/events/[eventSlug]/post/page.tsx",
  "app/boards/[boardId]/post/page.tsx",
  "app/official-events/[id]/post/page.tsx",
];

const protectedPostRoutes = [
  "app/boards/[boardId]/post/page.tsx",
  "app/official-events/[id]/post/page.tsx",
];

describe("memory post route auth UI", () => {
  it("renders sign-in UI instead of throwing login redirects from create-memory pages", async () => {
    for (const routePath of createMemoryPostRoutes) {
      const source = await readFile(routePath, "utf8");

      assert.match(
        source,
        /import \{ SignInButton \} from "@clerk\/nextjs";/,
        `${routePath} should render the Clerk sign-in button inline`,
      );
      assert.match(
        source,
        /className="memory-scrapbook-sign-in"/,
        `${routePath} should wrap the generated Clerk button for styling`,
      );
      assert.match(
        source,
        /<SignInButton mode="modal">Sign in<\/SignInButton>/,
        `${routePath} should pass Clerk SignInButton a plain text child`,
      );
      assert.doesNotMatch(
        source,
        /<SignInButton mode="modal">\s*\n\s*<button/,
        `${routePath} should not pass a custom element child from a Server Component`,
      );
      assert.match(
        source,
        /Sign in to post a memory\./,
        `${routePath} should show a stable sign-in panel instead of relying on an RSC redirect`,
      );
      assert.doesNotMatch(
        source,
        /redirect\("\/login"\)/,
        `${routePath} should not throw a login redirect during create-memory route rendering`,
      );
    }
  });

  it("avoids profile creation work for signed-out protected memory post routes", async () => {
    for (const routePath of protectedPostRoutes) {
      const source = await readFile(routePath, "utf8");

      assert.match(
        source,
        /const \{ userId \} = await auth\(\);/,
        `${routePath} should check auth before requiring a profile`,
      );
      assert.match(
        source,
        /const profile = userId \? await ensureUserProfile\(\) : null;/,
        `${routePath} should avoid profile creation work for signed-out users`,
      );
    }
  });
});
