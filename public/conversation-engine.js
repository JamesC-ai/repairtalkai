export const patternDefinitions = {
  absolutes: {
    label: "Always / never language",
    tone: "friction",
    description: "Broad claims can turn one event into a verdict about the whole relationship.",
    suggestion: "Name one specific event, time, and impact instead of using always, never, every, or nothing.",
    expressions: [/\balways\b/i, /\bnever\b/i, /\bevery time\b/i, /\byou constantly\b/i, /\bnothing (?:ever )?changes\b/i],
  },
  blame: {
    label: "Blame framing",
    tone: "friction",
    description: "The sentence assigns fault before explaining the observable impact.",
    suggestion: "Lead with what happened and its impact, then make a concrete request.",
    expressions: [/\byou made me\b/i, /\bthis is (?:all )?your fault\b/i, /\bbecause of you\b/i, /\byou ruined\b/i, /\byou're the reason\b/i],
  },
  mindReading: {
    label: "Assumed intent",
    tone: "friction",
    description: "The line states another person's motive or feeling as a fact.",
    suggestion: "Turn the assumption into a checkable question: “Is that what you meant?”",
    expressions: [/\byou don't care\b/i, /\byou clearly\b/i, /\byou just want\b/i, /\byou think (?:i|we)\b/i, /\byou're trying to\b/i, /\byou don't respect\b/i],
  },
  escalation: {
    label: "Escalation language",
    tone: "friction",
    description: "Insults, contempt, and threatening phrasing make repair harder.",
    suggestion: "Pause, remove the label or threat, and restate the unmet need in neutral language.",
    expressions: [/\bidiot\b/i, /\bstupid\b/i, /\bpathetic\b/i, /\bshut up\b/i, /\bi hate you\b/i, /\byou're useless\b/i, /\bget lost\b/i],
  },
  shutdown: {
    label: "Shutdown signal",
    tone: "friction",
    description: "Ending contact without a return plan can leave the conflict unresolved.",
    suggestion: "If a pause is needed, state when and how the conversation can resume safely.",
    expressions: [/\bwhatever\b/i, /\bi'm done talking\b/i, /\bleave me alone\b/i, /\bthere's no point\b/i, /\bi don't care anymore\b/i, /\bforget it\b/i],
  },
  repair: {
    label: "Repair attempt",
    tone: "repair",
    description: "The line signals accountability, curiosity, or willingness to reconnect.",
    suggestion: "Keep this line and make the next request specific enough to answer.",
    expressions: [/\bi'm sorry\b/i, /\bi am sorry\b/i, /\bcan we restart\b/i, /\bhelp me understand\b/i, /\bi want to understand\b/i, /\bi hear you\b/i, /\bwhat do you need\b/i],
  },
  ownership: {
    label: "Ownership statement",
    tone: "repair",
    description: "The speaker names their own feeling, action, or need rather than assigning a motive.",
    suggestion: "Connect the ownership statement to one observable event and one doable request.",
    expressions: [
      /(?:^|[.!?]\s*)i feel\b/i,
      /(?:^|[.!?]\s*)i need\b/i,
      /(?:^|[.!?]\s*)i was hurt\b/i,
      /(?:^|[.!?]\s*)i reacted\b/i,
      /(?:^|[.!?]\s*)i should have\b/i,
      /(?:^|[.!?]\s*)i wish i had\b/i,
    ],
  },
  request: {
    label: "Concrete request",
    tone: "repair",
    description: "A question or specific request gives the other person something they can answer.",
    suggestion: "Confirm the request is time-bound, observable, and allows a genuine yes or no.",
    expressions: [/\bcan we\b/i, /\bcould you\b/i, /\bwould you\b/i, /\bare you willing\b/i, /\bwhat would help\b/i],
  },
};

const safetyDefinitions = [
  { label: "Possible threat of physical harm", expression: /\b(?:kill|hurt|hit|attack|choke|strangle) (?:you|me|them)\b/i },
  { label: "Possible weapon reference", expression: /\b(?:gun|knife|weapon)\b/i },
  { label: "Possible restriction on leaving", expression: /\b(?:not allowed to leave|won't let (?:you|me) leave|lock(?:ed)? (?:you|me) in)\b/i },
  { label: "Possible surveillance or control", expression: /\b(?:tracking your location|checking your phone|watching where you go|control who you see)\b/i },
  { label: "Expressed fear for safety", expression: /\b(?:afraid for my safety|scared (?:of|that) you|fear you will hurt)\b/i },
  { label: "Possible retaliation threat", expression: /\b(?:take the children|destroy your life|make you pay|you'll regret)\b/i },
];

export function parseConversation(source) {
  return source
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((raw, index) => {
      const text = raw.trim();
      if (!text) return null;
      const speakerMatch = text.match(/^([^:]{1,24}):\s*(.+)$/);
      return {
        number: index + 1,
        speaker: speakerMatch ? speakerMatch[1].trim() : "Conversation",
        text: speakerMatch ? speakerMatch[2].trim() : text,
      };
    })
    .filter(Boolean);
}

function findPatternMatches(text) {
  return Object.entries(patternDefinitions)
    .filter(([, definition]) => definition.expressions.some((expression) => expression.test(text)))
    .map(([key, definition]) => ({ key, ...definition }));
}

function findSafetyMatches(text) {
  return safetyDefinitions.filter((definition) => definition.expression.test(text));
}

export function analyzeConversation(source) {
  const parsed = parseConversation(source);
  const lines = parsed.map((line) => ({
    ...line,
    matches: findPatternMatches(line.text),
    safetyMatches: findSafetyMatches(line.text),
  }));
  const patternCounts = {};
  const speakerCounts = {};

  lines.forEach((line) => {
    speakerCounts[line.speaker] = (speakerCounts[line.speaker] || 0) + 1;
    line.matches.forEach((match) => {
      patternCounts[match.key] = (patternCounts[match.key] || 0) + 1;
    });
  });

  const frictionCount = lines.flatMap((line) => line.matches).filter((match) => match.tone === "friction").length;
  const repairCount = lines.flatMap((line) => line.matches).filter((match) => match.tone === "repair").length;
  const safetySignals = lines.flatMap((line) =>
    line.safetyMatches.map((match) => ({ line: line.number, speaker: line.speaker, text: line.text, label: match.label })),
  );
  const topPatterns = Object.entries(patternCounts)
    .map(([key, count]) => ({ key, count, ...patternDefinitions[key] }))
    .sort((left, right) => right.count - left.count);

  return {
    lines,
    lineCount: lines.length,
    speakers: Object.keys(speakerCounts),
    speakerCounts,
    patternCounts,
    frictionCount,
    repairCount,
    safetySignals,
    topPatterns,
  };
}

function cleanPhrase(value, fallback) {
  const clean = String(value || "").trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
  return clean || fallback;
}

export function makeRepairDraft({ goal, relationship, situation, feeling, need, request }) {
  const safeSituation = cleanPhrase(situation, "our last conversation became tense");
  const safeFeeling = cleanPhrase(feeling, "upset and disconnected");
  const safeNeed = cleanPhrase(need, "clarity and a calmer way to discuss this");
  const safeRequest = cleanPhrase(request, "set aside 15 minutes to talk when we are both ready");
  const relationshipLabel = cleanPhrase(relationship, "relationship");

  const openings = {
    reconnect: `I care about our ${relationshipLabel}, and I want to repair how the last conversation went.`,
    clarify: "I want to check my understanding instead of assuming what you meant.",
    apologize: "I have been thinking about my part in the conversation, and I want to take responsibility for it.",
    boundary: "I want to be clear about what I need in order to continue this conversation respectfully.",
    plan: "I want us to leave this conversation with one clear next step we can both understand.",
  };

  return [
    openings[goal] || openings.reconnect,
    `When ${safeSituation}, I felt ${safeFeeling}.`,
    `What matters to me is ${safeNeed}.`,
    `Would you be willing to ${safeRequest}?`,
    "You do not have to answer immediately. I would rather continue when we can both respond without insults, threats, or pressure.",
  ].join(" ");
}
