import { cp, mkdir, rm, writeFile } from "node:fs/promises";

const siteUrl = "https://repair.pagecheckai.com";
const pages = [
  {
    slug: "relationship-conflict-conversation-analyzer",
    title: "Relationship conflict conversation analyzer",
    description: "Review pasted conflict text locally for friction signals, repair attempts, and a calmer next-conversation draft.",
    headline: "Reflect on a conflict conversation without uploading it.",
    intent: "Partners or family members who want a structured wording review after a difficult exchange.",
  },
  {
    slug: "how-to-talk-after-an-argument",
    title: "How to talk after an argument",
    description: "Use an observation, feeling, need, and doable request to prepare a calmer conversation after an argument.",
    headline: "Prepare one grounded next step after an argument.",
    intent: "People who want to reconnect without reopening every accusation at once.",
  },
  {
    slug: "repair-attempts-in-relationships",
    title: "Repair attempts in relationships",
    description: "Identify apology, curiosity, ownership, and concrete request language that may help a tense conversation reset.",
    headline: "Notice the repair attempts worth keeping.",
    intent: "People who want to preserve constructive lines instead of focusing only on what went wrong.",
  },
  {
    slug: "rewrite-blaming-language",
    title: "Rewrite blaming language",
    description: "Turn blame framing into an observable event, personal impact, and specific request.",
    headline: "Replace blame with language another person can answer.",
    intent: "People editing a message before sending it after a disagreement.",
  },
  {
    slug: "always-never-language-in-arguments",
    title: "Always and never language in arguments",
    description: "Find broad always, never, every-time, and nothing-changes claims and replace them with specific examples.",
    headline: "Turn global verdicts into one specific event.",
    intent: "People whose arguments expand from one incident into judgments about the whole relationship.",
  },
  {
    slug: "conflict-repair-message-template",
    title: "Conflict repair message template",
    description: "Draft a short repair message with accountability, a concrete need, and a request that allows a genuine response.",
    headline: "Draft a repair message that is specific and editable.",
    intent: "People who want a starting point before sending a follow-up text.",
  },
  {
    slug: "apology-message-after-argument",
    title: "Apology message after an argument",
    description: "Build an apology that names your action, its impact, and the change you are willing to make.",
    headline: "Make an apology about responsibility, not pressure.",
    intent: "People preparing to own their part without demanding immediate forgiveness.",
  },
  {
    slug: "set-boundary-without-escalating",
    title: "Set a boundary without escalating",
    description: "Write a boundary using clear conditions, your own action, and a respectful return plan.",
    headline: "State a boundary without adding a threat.",
    intent: "People who need to pause or limit a conversation while keeping the wording concrete.",
  },
  {
    slug: "family-conflict-conversation-review",
    title: "Family conflict conversation review",
    description: "Review parent, sibling, or extended-family conflict language for assumptions, absolutes, shutdown, and repair attempts.",
    headline: "Map a difficult family conversation one line at a time.",
    intent: "Family members seeking a private reflection before a follow-up conversation.",
  },
  {
    slug: "friendship-conflict-message-review",
    title: "Friendship conflict message review",
    description: "Reflect on a friendship disagreement and draft a specific clarification or repair request.",
    headline: "Prepare a clearer message after a friendship conflict.",
    intent: "Friends who want to clarify impact without assigning motives.",
  },
  {
    slug: "coworker-conflict-wording-check",
    title: "Coworker conflict wording check",
    description: "Review workplace conflict wording for blame, assumptions, escalation, and specific requests while keeping the text local.",
    headline: "Make a workplace follow-up factual and answerable.",
    intent: "Coworkers preparing a neutral follow-up, not documenting a legal or emergency matter.",
  },
  {
    slug: "conversation-pause-and-return-plan",
    title: "Conversation pause and return plan",
    description: "Replace abrupt shutdown with a clear pause, return time, and conditions for continuing respectfully.",
    headline: "Pause a difficult conversation without disappearing.",
    intent: "People who need time to regulate before continuing a non-emergency discussion.",
  },
  {
    slug: "coparenting-conflict-message-template",
    title: "Co-parenting conflict message template",
    description: "Draft a factual co-parenting message focused on one schedule, handoff, update, or child-related request without assigning motives.",
    headline: "Keep a co-parenting message specific and child-focused.",
    intent: "Co-parents preparing routine, non-emergency logistics communication that does not replace legal advice or a court-approved process.",
  },
  {
    slug: "roommate-boundary-conversation-template",
    title: "Roommate boundary conversation template",
    description: "Prepare a concrete roommate conversation about chores, noise, guests, shared costs, privacy, or common-space expectations.",
    headline: "Turn a roommate frustration into one clear request.",
    intent: "Roommates seeking a calm wording draft for ordinary shared-home expectations rather than threats, emergencies, or legal disputes.",
  },
  {
    slug: "relationship-check-in-conversation-template",
    title: "Relationship check-in conversation template",
    description: "Structure a regular relationship check-in around appreciation, one current concern, one need, and one doable next step.",
    headline: "Prepare a relationship check-in before tension builds.",
    intent: "Partners who want a repeatable non-emergency check-in format without treating a template as therapy or a verdict about the relationship.",
  },
  {
    slug: "difficult-conversation-script-generator",
    title: "Difficult conversation script generator",
    description: "Turn one difficult topic into a short opening script with observations, impact, needs, and one doable request.",
    headline: "Start a difficult conversation with one clear request.",
    intent: "People preparing an ordinary, non-emergency conversation who want a calmer first draft before speaking.",
  },
  {
    slug: "ask-for-space-after-argument",
    title: "Ask for space after an argument",
    description: "Write a pause message that names the need for space, gives a return time, and avoids punishment or disappearance.",
    headline: "Ask for space without turning it into a threat.",
    intent: "People who need time to calm down before continuing a non-dangerous discussion.",
  },
  {
    slug: "parent-adult-child-boundary-message",
    title: "Parent and adult child boundary message",
    description: "Prepare a respectful boundary message for an adult child or parent around visits, advice, privacy, or recurring comments.",
    headline: "Make a parent-adult child boundary specific.",
    intent: "Families trying to clarify ordinary boundaries without escalating into blame or old global arguments.",
  },
  {
    slug: "sibling-conflict-message-template",
    title: "Sibling conflict message template",
    description: "Draft a sibling follow-up message around one incident, one impact, and one concrete request for the next interaction.",
    headline: "Keep a sibling conflict message about one issue.",
    intent: "Siblings who want a private wording draft before discussing family logistics, comments, or responsibilities.",
  },
  {
    slug: "in-law-boundary-conversation-template",
    title: "In-law boundary conversation template",
    description: "Prepare a careful in-law boundary script around visits, parenting comments, holiday plans, or household expectations.",
    headline: "Set an in-law boundary without widening the conflict.",
    intent: "Partners or family members preparing a non-emergency boundary conversation with extended family.",
  },
  {
    slug: "money-conflict-conversation-template",
    title: "Money conflict conversation template",
    description: "Structure a money disagreement around facts, impact, shared constraints, and a specific next budgeting conversation.",
    headline: "Talk about money without turning numbers into character verdicts.",
    intent: "Partners, roommates, or family members preparing an ordinary budget or expense conversation, not legal or financial advice.",
  },
  {
    slug: "household-chores-conversation-template",
    title: "Household chores conversation template",
    description: "Turn chores, cleaning, errands, and shared-home frustration into one clear request and a repeatable follow-up plan.",
    headline: "Make a household chore request answerable.",
    intent: "Roommates, partners, or families who want a practical division-of-work conversation.",
  },
  {
    slug: "work-feedback-response-template",
    title: "Work feedback response template",
    description: "Prepare a neutral response to workplace feedback by naming what you heard, one clarification, and one next action.",
    headline: "Respond to feedback without escalating the tone.",
    intent: "Employees drafting a professional follow-up for ordinary feedback or miscommunication, not legal or HR strategy.",
  },
  {
    slug: "prepare-conversation-summary-for-therapy",
    title: "Prepare a conversation summary for therapy",
    description: "Create a concise, de-identified summary of a conflict conversation to discuss with a qualified professional if you choose.",
    headline: "Summarize the conversation without rewriting the whole argument.",
    intent: "People preparing notes for their own reflection or a qualified professional without treating the tool as therapy.",
  },
  {
    slug: "repair-message-after-hurt-feelings",
    title: "Repair message after hurt feelings",
    description: "Draft a short repair message that acknowledges hurt feelings, avoids motive claims, and proposes a small next step.",
    headline: "Acknowledge hurt without guessing the other person's motives.",
    intent: "People trying to reconnect after an everyday misunderstanding or emotional miss.",
  },
  {
    slug: "text-argument-deescalation-template",
    title: "Text argument de-escalation template",
    description: "Rewrite a tense text exchange into a shorter pause, clarification, and one concrete request without continuing the spiral.",
    headline: "Slow down a text argument before replying again.",
    intent: "People who want to stop adding paragraphs and prepare one calmer message for a non-emergency disagreement.",
  },
  {
    slug: "defensive-response-rewrite-template",
    title: "Defensive response rewrite template",
    description: "Turn a defensive reply into acknowledgement, clarification, and a specific next step while preserving your own boundary.",
    headline: "Rewrite defensiveness into something answerable.",
    intent: "People editing a message that currently sounds dismissive, counterattacking, or overloaded with explanations.",
  },
  {
    slug: "listening-reflection-message-template",
    title: "Listening reflection message template",
    description: "Draft a short reflection that names what you heard, checks accuracy, and asks one follow-up question.",
    headline: "Show what you heard before making your point.",
    intent: "People who want to lower defensiveness by checking understanding before arguing their own side.",
  },
  {
    slug: "accountability-without-self-blame-template",
    title: "Accountability without self-blame template",
    description: "Prepare an accountability statement that owns one action without global self-attack, pressure, or exaggerated promises.",
    headline: "Take responsibility without turning it into self-punishment.",
    intent: "People who want to acknowledge impact while keeping the message specific, grounded, and editable.",
  },
  {
    slug: "missed-expectation-conversation-template",
    title: "Missed expectation conversation template",
    description: "Turn disappointment about an unmet expectation into the original agreement, impact, clarification, and a future request.",
    headline: "Talk about a missed expectation without mind-reading.",
    intent: "Partners, friends, family members, or coworkers preparing a practical follow-up after plans or responsibilities did not match expectations.",
  },
  {
    slug: "reconnect-after-silence-message",
    title: "Reconnect after silence message",
    description: "Draft a careful message after distance or silence that names the gap, avoids pressure, and offers one low-stakes next step.",
    headline: "Reach out after silence without forcing a response.",
    intent: "People who want to reconnect after a non-emergency cooling-off period while respecting that the other person may not be ready.",
  },
  {
    slug: "repair-after-cancelled-plans-message",
    title: "Repair after cancelled plans message",
    description: "Prepare a message after cancelled plans that separates logistics, disappointment, assumptions, and a realistic reschedule request.",
    headline: "Discuss cancelled plans without turning them into a character verdict.",
    intent: "Friends, partners, or family members trying to clarify what happened and what would help next time.",
  },
  {
    slug: "holiday-family-boundary-message",
    title: "Holiday family boundary message",
    description: "Write a holiday boundary around visits, timing, topics, gifts, travel, or hosting expectations without widening the conflict.",
    headline: "Set one holiday boundary before the gathering.",
    intent: "Family members preparing ordinary holiday logistics or topic boundaries, not emergency, legal, custody, or safety planning.",
  },
  {
    slug: "group-chat-conflict-response-template",
    title: "Group chat conflict response template",
    description: "Draft a group-chat response that slows escalation, avoids pile-ons, and moves one issue into a clearer next step.",
    headline: "Keep a group-chat conflict from spreading sideways.",
    intent: "Friends, families, clubs, or small teams handling non-emergency conflict in a shared message thread.",
  },
  {
    slug: "conversation-repair-checklist-for-couples",
    title: "Conversation repair checklist for couples",
    description: "Prepare a couples conversation checklist with one issue, one impact, ownership, a pause option, and one specific request.",
    headline: "Keep a couples repair talk focused on one next step.",
    intent: "Partners preparing a private, non-emergency conversation aid that does not replace therapy or safety planning.",
  },
  {
    slug: "difficult-text-before-sending-checklist",
    title: "Difficult text before sending checklist",
    description: "Review a difficult text before sending it for blame, mind-reading, too many issues, missing requests, and unsafe timing.",
    headline: "Check a difficult text before you send it.",
    intent: "People editing a non-emergency message and wanting a calmer draft before continuing the exchange.",
  },
  {
    slug: "repair-after-sarcastic-comment-message",
    title: "Repair after sarcastic comment message",
    description: "Draft a short repair message after sarcasm, teasing, or a sharp comment landed badly without excusing the impact.",
    headline: "Own a sarcastic comment without overexplaining it.",
    intent: "People trying to acknowledge a small but real hurt after a tense or careless remark.",
  },
  {
    slug: "clarify-misunderstood-message-template",
    title: "Clarify misunderstood message template",
    description: "Rewrite a misunderstood message by separating intent, impact, clarification, and one check-for-understanding question.",
    headline: "Clarify what you meant without dismissing the impact.",
    intent: "People whose text, email, or spoken comment was received differently than intended.",
  },
  {
    slug: "recurring-lateness-conversation-template",
    title: "Recurring lateness conversation template",
    description: "Prepare a conversation about recurring lateness with one pattern, one impact, one practical constraint, and a future plan.",
    headline: "Talk about lateness without making it a character trial.",
    intent: "Partners, friends, roommates, or coworkers discussing repeated timing friction in ordinary plans.",
  },
  {
    slug: "shared-calendar-conflict-message",
    title: "Shared calendar conflict message",
    description: "Draft a shared-calendar conflict message around schedule changes, reminders, handoffs, availability, and one next update rule.",
    headline: "Turn a calendar conflict into one update rule.",
    intent: "Households, teams, or family members trying to make scheduling clearer without blaming memory or motives.",
  },
  {
    slug: "neighbor-noise-conversation-template",
    title: "Neighbor noise conversation template",
    description: "Prepare a respectful neighbor noise conversation with specific times, observed impact, a simple request, and a follow-up option.",
    headline: "Raise a neighbor noise issue without escalating first.",
    intent: "Neighbors writing or rehearsing a low-conflict note for ordinary noise concerns, not legal disputes or safety threats.",
  },
  {
    slug: "client-boundary-message-template",
    title: "Client boundary message template",
    description: "Create a client boundary message about scope, response time, revisions, meeting expectations, or communication channels.",
    headline: "Set a client boundary in plain professional language.",
    intent: "Freelancers and service providers preparing a non-legal communication boundary with a current client.",
  },
  {
    slug: "manager-one-on-one-conflict-prep",
    title: "Manager one-on-one conflict prep",
    description: "Prepare a manager one-on-one around one workplace conflict, factual examples, clarification questions, and a next-step request.",
    headline: "Bring one clear issue into a manager one-on-one.",
    intent: "Employees preparing an ordinary workplace conversation that does not replace HR, legal, or safety advice.",
  },
  {
    slug: "friendship-jealousy-conversation-template",
    title: "Friendship jealousy conversation template",
    description: "Draft a friendship jealousy conversation around feelings, reassurance, boundaries, and one request without accusing motives.",
    headline: "Talk about friendship jealousy without assigning motives.",
    intent: "Friends trying to discuss insecurity, distance, new relationships, or group dynamics with care.",
  },
  {
    slug: "family-event-planning-conflict-message",
    title: "Family event planning conflict message",
    description: "Prepare a family event planning message around roles, budget, timing, guest expectations, and one practical next decision.",
    headline: "Keep family event planning conflict on the next decision.",
    intent: "Families coordinating birthdays, reunions, holidays, or ceremonies without reopening every old dispute.",
  },
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pageHtml(page) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(page.title)} - RepairTalkAI</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <link rel="canonical" href="${siteUrl}/${page.slug}/" />
    <meta property="og:title" content="${escapeHtml(page.title)} - RepairTalkAI" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:image" content="${siteUrl}/repair-conversation.png" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="icon" href="/favicon.svg" />
  </head>
  <body>
    <header class="topbar"><a class="brand" href="/"><span class="brand-mark">R</span><span>RepairTalkAI</span></a><nav><a href="/#reflection">Reflection tool</a><a href="/support.html">Support</a></nav></header>
    <main class="legal">
      <p class="eyebrow">Private wording reflection</p>
      <h1>${escapeHtml(page.headline)}</h1>
      <p>${escapeHtml(page.description)}</p>
      <h2>Best fit</h2>
      <p>${escapeHtml(page.intent)}</p>
      <h2>Use the result carefully</h2>
      <ol>
        <li>Remove names and identifying details that are not needed.</li>
        <li>Read every pattern match in the surrounding context.</li>
        <li>Edit the draft so it reflects your own experience and one doable request.</li>
        <li>Do not send a repair script if doing so could increase danger or retaliation.</li>
      </ol>
      <p><a class="primary-button" href="/#reflection">Run a private reflection</a></p>
      <h2>Boundary</h2>
      <p>RepairTalkAI is a wording aid, not therapy, mediation, abuse diagnosis, legal advice, or a safety assessment. A missing safety phrase is not proof that a situation is safe.</p>
      <p><a href="/support.html">Support</a> · <a href="https://tools.pagecheckai.com">More PageCheckAI tools</a></p>
    </main>
  </body>
</html>`;
}

await rm("dist", { force: true, recursive: true });
await mkdir("dist", { recursive: true });
await cp("public", "dist", { recursive: true });

for (const page of pages) {
  await mkdir(`dist/${page.slug}`, { recursive: true });
  await writeFile(`dist/${page.slug}/index.html`, pageHtml(page));
}

await writeFile("dist/robots.txt", `User-agent: *
Allow: /
Sitemap: ${siteUrl}/sitemap.xml
`);

const staticUrls = ["/", "/privacy.html", "/terms.html", "/support.html"];
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...pages.map((page) => `/${page.slug}/`)]
  .map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`)
  .join("\n")}
</urlset>
`,
);

console.log(`Built RepairTalkAI with ${pages.length} SEO pages.`);
