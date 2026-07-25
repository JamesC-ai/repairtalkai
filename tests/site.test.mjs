import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { analyzeConversation, makeRepairDraft, parseConversation } from "../public/conversation-engine.js";

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
  assert.doesNotMatch(home, /PayPal link being connected/);
  assert.equal((sitemap.match(/<url>/g) || []).length, 16);
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
