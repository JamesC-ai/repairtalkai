import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { analyzeConversation, makeRepairDraft, parseConversation } from "../public/conversation-engine.js";

const seoRoutes = [
  "relationship-conflict-conversation-analyzer",
  "how-to-talk-after-an-argument",
  "repair-attempts-in-relationships",
  "rewrite-blaming-language",
  "always-never-language-in-arguments",
  "conflict-repair-message-template",
  "apology-message-after-argument",
  "set-boundary-without-escalating",
  "family-conflict-conversation-review",
  "friendship-conflict-message-review",
  "coworker-conflict-wording-check",
  "conversation-pause-and-return-plan",
  "coparenting-conflict-message-template",
  "roommate-boundary-conversation-template",
  "relationship-check-in-conversation-template",
];

test("build includes product, boundaries, legal pages, and sitemap", async () => {
  const [home, privacy, terms, support, sitemap] = await Promise.all([
    readFile("dist/index.html", "utf8"),
    readFile("dist/privacy.html", "utf8"),
    readFile("dist/terms.html", "utf8"),
    readFile("dist/support.html", "utf8"),
    readFile("dist/sitemap.xml", "utf8"),
  ]);
  assert.match(home, /RepairTalkAI/);
  assert.match(home, /text stays in this browser/i);
  assert.match(privacy, /not uploaded/i);
  assert.match(terms, /not therapy, mediation, or a safety assessment/i);
  assert.match(support, /Formatting a conversation/);
  assert.match(home, /https:\/\/www\.paypal\.com\/ncp\/payment\/QXL7YCNJWK6WU/);
  assert.match(home, /https:\/\/www\.paypal\.com\/ncp\/payment\/5DN49T6JSRJF6/);
  assert.match(home, /Co-parenting logistics/);
  assert.match(home, /Relationship check-in/);
  assert.doesNotMatch(home, /PayPal link being connected/);
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(sitemapUrls.length, 19);
  for (const route of seoRoutes) {
    assert.ok(sitemapUrls.includes(`https://repair.pagecheckai.com/${route}/`), `missing sitemap route: ${route}`);
  }
});

test("renders all reflection pages with privacy and safety boundaries", async () => {
  for (const route of seoRoutes) {
    const html = await readFile(`dist/${route}/index.html`, "utf8");
    assert.match(html, /RepairTalkAI/);
    assert.match(html, /Remove names and identifying details/);
    assert.match(html, /Do not send a repair script if doing so could increase danger or retaliation/);
    assert.match(html, /not therapy, mediation, abuse diagnosis, legal advice, or a safety assessment/);
    assert.match(html, /not proof that a situation is safe/);
  }
});

test("hosts the IndexNow key and visual asset", async () => {
  const key = await readFile("dist/62434faa91efd58495e0d767e9fd2575.txt", "utf8");
  const image = await readFile("dist/repair-conversation.png");
  assert.equal(key.trim(), "62434faa91efd58495e0d767e9fd2575");
  assert.ok(image.byteLength > 100000);
});

test("speaker labels are parsed without requiring personal names", () => {
  const lines = parseConversation("A: You never listen.\nB: I want to understand.");
  assert.deepEqual(lines.map((line) => line.speaker), ["A", "B"]);
  assert.equal(lines[0].text, "You never listen.");
});

test("analysis separates friction and repair signals", () => {
  const result = analyzeConversation("A: You never listen and you don't care.\nB: I'm sorry. Can we restart?");
  assert.ok(result.frictionCount >= 2);
  assert.ok(result.repairCount >= 2);
  assert.ok(result.patternCounts.absolutes >= 1);
  assert.ok(result.patternCounts.repair >= 1);
  assert.equal(result.lines[0].matches.some((match) => match.key === "ownership"), false);
});

test("safety wording produces a cautious signal", () => {
  const result = analyzeConversation("A: I am scared that you will hurt me if I leave.");
  assert.ok(result.safetySignals.length >= 1);
});

test("repair draft uses user-provided observable fields", () => {
  const draft = makeRepairDraft({
    goal: "clarify",
    relationship: "friendship",
    situation: "the plan changed without a message",
    feeling: "confused",
    need: "clear updates",
    request: "text me before changing the plan",
  });
  assert.match(draft, /the plan changed without a message/);
  assert.match(draft, /text me before changing the plan/);
  assert.doesNotMatch(draft, /always|never/);
});
