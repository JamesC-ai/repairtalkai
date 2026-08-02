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
  "difficult-text-before-sending-checklist",
  "repair-after-sarcastic-comment-message",
  "clarify-misunderstood-message-template",
  "recurring-lateness-conversation-template",
  "shared-calendar-conflict-message",
  "neighbor-noise-conversation-template",
  "client-boundary-message-template",
  "manager-one-on-one-conflict-prep",
  "friendship-jealousy-conversation-template",
  "family-event-planning-conflict-message",
  "apology-after-missed-deadline-message",
  "roommate-chore-conflict-message",
  "coworker-credit-taking-conversation",
  "friend-borrowed-money-reminder",
  "in-law-visit-boundary-message",
  "customer-scope-creep-response",
  "volunteer-team-conflict-message",
  "wedding-planning-boundary-message",
  "after-interrupting-someone-repair-message",
  "decline-last-minute-request-message",
  "repair-after-forgotten-birthday-message",
  "apology-after-late-reply-message",
  "teacher-parent-concern-message",
  "team-meeting-tension-follow-up",
  "landlord-repair-request-boundary",
  "shared-business-partner-conflict-message",
  "online-comment-repair-message",
  "rehearse-hard-conversation-outline",
  "repair-after-broken-promise-message",
  "ask-for-feedback-after-conflict",
  "repair-after-overpromising-message",
  "reconnect-after-moving-away-message",
  "after-hours-work-boundary-message",
  "shared-caregiving-conflict-message",
  "neighbor-parking-boundary-message",
  "group-project-conflict-message",
  "repair-after-public-criticism-message",
  "apology-after-forgetting-task-message",
  "ask-for-clarity-without-blame-message",
  "pause-conversation-when-overwhelmed-message",
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
  assert.match(home, /Run the free reflection before buying a repair pack/);
  assert.match(home, /Run free reflection/);
  assert.match(home, /Compare \$19 and \$49 packs/);
  assert.match(home, /Free draft first/);
  assert.match(home, /Buy after the free reflection gives you a draft worth refining/);
  assert.match(home, /Good fit for \$19/);
  assert.match(home, /Good fit for \$49/);
  assert.match(home, /Skip payment when/);
  assert.match(home, /text stays in this browser/i);
  assert.match(privacy, /not uploaded/i);
  assert.match(terms, /not therapy, mediation, or a safety assessment/i);
  assert.match(support, /Formatting a conversation/);
  assert.match(home, /https:\/\/namebatch\.pagecheckai\.com\/api\/checkout\?v=repairtalk-20260731&amp;product=repairtalkai/);
  assert.match(home, /https:\/\/namebatch\.pagecheckai\.com\/api\/checkout\?v=repairtalk-20260731&amp;product=repairtalkreview/);
  assert.match(home, /https:\/\/www\.paypal\.com\/ncp\/payment\/QXL7YCNJWK6WU/);
  assert.match(home, /https:\/\/www\.paypal\.com\/ncp\/payment\/5DN49T6JSRJF6/);
  assert.match(home, /Enter an RT- or RR- code/);
  assert.match(home, /After payment, enter the RT- or RR- activation code here/);
  assert.match(home, /open support/);
  assert.match(home, /sends only the activation code and product name/);
  assert.match(home, /Co-parenting logistics/);
  assert.match(home, /Relationship check-in/);
  assert.match(home, /Difficult conversation/);
  assert.match(home, /Work feedback/);
  assert.match(home, /Text argument/);
  assert.match(home, /After silence/);
  assert.match(home, /Group chat/);
  assert.match(home, /Before sending/);
  assert.match(home, /Misunderstood message/);
  assert.match(home, /Client boundary/);
  assert.match(home, /Family event planning/);
  assert.match(home, /Missed deadline/);
  assert.match(home, /Work credit/);
  assert.match(home, /Scope creep/);
  assert.match(home, /After interrupting/);
  assert.doesNotMatch(home, /PayPal link being connected/);
  assert.match(support, /generated locally from the current browser reflection/);
  assert.match(privacy, /does not send conversation text, report matches, draft wording, or safety notes/);
  assert.match(terms, /browser-generated planning files/);
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(sitemapUrls.length, 79);
  for (const route of seoRoutes) {
    assert.ok(sitemapUrls.includes(`https://repair.pagecheckai.com/${route}/`), `missing sitemap route: ${route}`);
  }
});

test("paid pack activation stays product-scoped and browser-local", async () => {
  const app = await readFile("dist/app.js", "utf8");

  assert.match(app, /LICENSE_VERIFY_URL = "https:\/\/namebatch\.pagecheckai\.com\/api\/licenses\/verify"/);
  assert.match(app, /product: "repairtalkai"/);
  assert.match(app, /product: "repairtalkreview"/);
  assert.match(app, /entitlement: "conversation_reset_pack"/);
  assert.match(app, /entitlement: "guided_repair_review_pack"/);
  assert.match(app, /JSON\.stringify\(\{ code, product: product\.product \}\)/);
  assert.match(app, /Generated locally in this browser/);
});

test("new repair pages preserve safety and scope boundaries", async () => {
  const textArgument = await readFile("dist/text-argument-deescalation-template/index.html", "utf8");
  const holiday = await readFile("dist/holiday-family-boundary-message/index.html", "utf8");
  const groupChat = await readFile("dist/group-chat-conflict-response-template/index.html", "utf8");
  const couples = await readFile("dist/conversation-repair-checklist-for-couples/index.html", "utf8");
  const client = await readFile("dist/client-boundary-message-template/index.html", "utf8");
  const manager = await readFile("dist/manager-one-on-one-conflict-prep/index.html", "utf8");
  const combined = `${textArgument}\n${holiday}\n${groupChat}\n${couples}\n${client}\n${manager}`;

  assert.match(combined, /Remove names and identifying details/);
  assert.match(combined, /Do not send a repair script if doing so could increase danger or retaliation/);
  assert.match(combined, /not therapy, mediation, abuse diagnosis, legal advice, or a safety assessment/);
  assert.match(combined, /not proof that a situation is safe/);
  assert.doesNotMatch(combined.toLowerCase(), /guaranteed reconciliation|diagnose abuse|legal strategy|custody advice|emergency plan/);
});

test("second-pass conversation pages keep private reflection boundaries", async () => {
  const routes = [
    "coworker-credit-taking-conversation",
    "friend-borrowed-money-reminder",
    "customer-scope-creep-response",
    "wedding-planning-boundary-message",
    "decline-last-minute-request-message",
  ];
  const combined = (await Promise.all(
    routes.map((route) => readFile(`dist/${route}/index.html`, "utf8")),
  )).join("\n");

  assert.match(combined, /Private wording reflection/);
  assert.match(combined, /Remove names and identifying details/);
  assert.match(combined, /Do not send a repair script if doing so could increase danger or retaliation/);
  assert.match(combined, /not therapy, mediation, abuse diagnosis, legal advice, or a safety assessment/);
  assert.match(combined, /not proof that a situation is safe/);
  assert.doesNotMatch(combined.toLowerCase(), /guaranteed reconciliation|can diagnose abuse|provides legal strategy|replaces hr|acts as a debt collection service|provides emergency planning/);
});

test("third-pass conversation pages keep legal, public, and safety boundaries", async () => {
  const landlord = await readFile("dist/landlord-repair-request-boundary/index.html", "utf8");
  const online = await readFile("dist/online-comment-repair-message/index.html", "utf8");
  const rehearsal = await readFile("dist/rehearse-hard-conversation-outline/index.html", "utf8");
  const feedback = await readFile("dist/ask-for-feedback-after-conflict/index.html", "utf8");
  const combined = `${landlord}\n${online}\n${rehearsal}\n${feedback}`;

  assert.match(combined, /Remove names and identifying details/);
  assert.match(combined, /Do not send a repair script if doing so could increase danger or retaliation/);
  assert.match(combined, /not therapy, mediation, abuse diagnosis, legal advice, or a safety assessment/);
  assert.match(online, /keeping account actions and moderation outside the tool/);
  assert.doesNotMatch(combined.toLowerCase(), /guaranteed reconciliation|can diagnose abuse|provides legal strategy|replaces hr|provides emergency planning/);
});

test("fourth-pass conversation pages keep work, caregiving, and public-repair boundaries", async () => {
  const work = await readFile("dist/after-hours-work-boundary-message/index.html", "utf8");
  const caregiving = await readFile("dist/shared-caregiving-conflict-message/index.html", "utf8");
  const publicRepair = await readFile("dist/repair-after-public-criticism-message/index.html", "utf8");
  const pause = await readFile("dist/pause-conversation-when-overwhelmed-message/index.html", "utf8");
  const clarity = await readFile("dist/ask-for-clarity-without-blame-message/index.html", "utf8");
  const combined = `${work}\n${caregiving}\n${publicRepair}\n${pause}\n${clarity}`;

  assert.match(combined, /Remove names and identifying details/);
  assert.match(combined, /Do not send a repair script if doing so could increase danger or retaliation/);
  assert.match(combined, /not therapy, mediation, abuse diagnosis, legal advice, or a safety assessment/);
  assert.match(work, /without replacing HR, legal, labor, or emergency processes/);
  assert.match(caregiving, /not medical, legal, guardianship, or safety decisions/);
  assert.match(publicRepair, /without pulling in an audience/);
  assert.doesNotMatch(combined.toLowerCase(), /guaranteed reconciliation|can diagnose abuse|provides legal strategy|replaces hr|provides emergency planning/);
});

test("renders all reflection pages with privacy and safety boundaries", async () => {
  for (const route of seoRoutes) {
    const html = await readFile(`dist/${route}/index.html`, "utf8");
    assert.match(html, /RepairTalkAI/);
    assert.match(html, /Remove names and identifying details/);
    assert.match(html, /When a paid repair pack is worth it/);
    assert.match(html, /Buy the \$19 Conversation Reset Pack only when/);
    assert.match(html, /Skip payment if you need therapy/);
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
