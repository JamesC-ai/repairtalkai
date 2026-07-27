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
  "difficult-conversation-script-generator",
  "ask-for-space-after-argument",
  "parent-adult-child-boundary-message",
  "sibling-conflict-message-template",
  "in-law-boundary-conversation-template",
  "money-conflict-conversation-template",
  "household-chores-conversation-template",
  "work-feedback-response-template",
  "prepare-conversation-summary-for-therapy",
  "repair-message-after-hurt-feelings",
  "text-argument-deescalation-template",
  "defensive-response-rewrite-template",
  "listening-reflection-message-template",
  "accountability-without-self-blame-template",
  "missed-expectation-conversation-template",
  "reconnect-after-silence-message",
  "repair-after-cancelled-plans-message",
  "holiday-family-boundary-message",
  "group-chat-conflict-response-template",
  "conversation-repair-checklist-for-couples",
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
  assert.match(home, /Difficult conversation/);
  assert.match(home, /Work feedback/);
  assert.match(home, /Text argument/);
  assert.match(home, /After silence/);
  assert.match(home, /Group chat/);
  assert.doesNotMatch(home, /PayPal link being connected/);
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(sitemapUrls.length, 39);
  for (const route of seoRoutes) {
    assert.ok(sitemapUrls.includes(`https://repair.pagecheckai.com/${route}/`), `missing sitemap route: ${route}`);
  }
});

test("new repair pages preserve safety and scope boundaries", async () => {
  const textArgument = await readFile("dist/text-argument-deescalation-template/index.html", "utf8");
  const holiday = await readFile("dist/holiday-family-boundary-message/index.html", "utf8");
  const groupChat = await readFile("dist/group-chat-conflict-response-template/index.html", "utf8");
  const couples = await readFile("dist/conversation-repair-checklist-for-couples/index.html", "utf8");
  const combined = `${textArgument}\n${holiday}\n${groupChat}\n${couples}`;

  assert.match(combined, /Remove names and identifying details/);
  assert.match(combined, /Do not send a repair script if doing so could increase danger or retaliation/);
  assert.match(combined, /not therapy, mediation, abuse diagnosis, legal advice, or a safety assessment/);
  assert.match(combined, /not proof that a situation is safe/);
  assert.doesNotMatch(combined.toLowerCase(), /guaranteed reconciliation|diagnose abuse|legal strategy|custody advice|emergency plan/);
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
