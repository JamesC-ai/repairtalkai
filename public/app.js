import { analyzeConversation, makeRepairDraft } from "./conversation-engine.js";

const form = document.querySelector("#reflectionForm");
const conversationInput = document.querySelector("#conversationInput");
const relationshipInput = document.querySelector("#relationshipInput");
const goalInput = document.querySelector("#goalInput");
const situationInput = document.querySelector("#situationInput");
const feelingInput = document.querySelector("#feelingInput");
const needInput = document.querySelector("#needInput");
const requestInput = document.querySelector("#requestInput");
const loadDemoButton = document.querySelector("#loadDemo");
const clearButton = document.querySelector("#clearAll");
const reportPanel = document.querySelector("#reportPanel");
const reportStatus = document.querySelector("#reportStatus");
const reportSummary = document.querySelector("#reportSummary");
const safetyPanel = document.querySelector("#safetyPanel");
const patternList = document.querySelector("#patternList");
const lineReview = document.querySelector("#lineReview");
const repairDraft = document.querySelector("#repairDraft");
const copyButton = document.querySelector("#copyReport");
const downloadButton = document.querySelector("#downloadReport");

let lastReport = "";

const relationshipLabels = {
  partner: "partnership",
  family: "family relationship",
  friend: "friendship",
  coworker: "working relationship",
  other: "relationship",
};

const demoConversation = `Alex: You never listen. You clearly don't care about what I need.
Jordan: Whatever. There's no point talking when you make everything my fault.
Alex: I was hurt when the plans changed and I didn't hear from you.
Jordan: I'm sorry I did not send a message. Can we restart and make a plan for next time?
Alex: I want to understand what happened. Could you text me if plans change?`;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderPatterns(analysis) {
  if (!analysis.topPatterns.length) {
    patternList.innerHTML = `<div class="empty-state"><strong>No listed communication signals found.</strong><span>This does not mean the conversation was healthy or unhealthy. Add context and review the wording yourself.</span></div>`;
    return;
  }
  patternList.innerHTML = analysis.topPatterns
    .map(
      (pattern) => `<article class="pattern-row ${pattern.tone}">
        <div><span class="count">${pattern.count}</span><strong>${escapeHtml(pattern.label)}</strong></div>
        <p>${escapeHtml(pattern.description)}</p>
        <small>${escapeHtml(pattern.suggestion)}</small>
      </article>`,
    )
    .join("");
}

function renderLines(analysis) {
  lineReview.innerHTML = analysis.lines
    .map((line) => {
      const tags = line.matches
        .map((match) => `<span class="${match.tone}">${escapeHtml(match.label)}</span>`)
        .join("");
      const safetyTag = line.safetyMatches.length ? `<span class="safety">Possible safety language</span>` : "";
      return `<article class="line-row">
        <div class="line-meta"><strong>${escapeHtml(line.speaker)}</strong><small>Line ${line.number}</small></div>
        <div><p>${escapeHtml(line.text)}</p><div class="tag-row">${tags}${safetyTag || (!tags ? "<span>No listed signal</span>" : "")}</div></div>
      </article>`;
    })
    .join("");
}

function renderSafety(analysis) {
  if (!analysis.safetySignals.length) {
    safetyPanel.className = "safety-panel clear";
    safetyPanel.innerHTML = `<strong>No listed high-risk phrases detected.</strong><p>This is not proof that a situation is safe. Software cannot assess tone, history, access to weapons, coercion, or immediate danger.</p>`;
    return;
  }
  safetyPanel.className = "safety-panel alert";
  safetyPanel.innerHTML = `
    <strong>Possible safety-related language needs human judgment.</strong>
    <p>Do not use a joint repair script if you fear harm, retaliation, surveillance, or being prevented from leaving. Prioritize getting to a safer place and contacting local emergency services or a trusted person. This tool cannot assess danger.</p>
    <ul>${analysis.safetySignals.map((signal) => `<li>Line ${signal.line}: ${escapeHtml(signal.label)}</li>`).join("")}</ul>
  `;
}

function buildTextReport(analysis, draft) {
  const patternLines = analysis.topPatterns.length
    ? analysis.topPatterns.map((pattern) => `- ${pattern.label}: ${pattern.count} — ${pattern.suggestion}`)
    : ["- No listed communication signals found."];
  const safetyLines = analysis.safetySignals.length
    ? analysis.safetySignals.map((signal) => `- Line ${signal.line}: ${signal.label}`)
    : ["- No listed high-risk phrases detected. This is not proof of safety."];

  return [
    "RepairTalkAI conversation reflection",
    `Lines reviewed: ${analysis.lineCount}`,
    `Speakers/labels: ${analysis.speakers.join(", ")}`,
    `Friction signals: ${analysis.frictionCount}`,
    `Repair signals: ${analysis.repairCount}`,
    "",
    "Pattern summary",
    ...patternLines,
    "",
    "Safety language check",
    ...safetyLines,
    "",
    "Repair draft",
    draft,
    "",
    "Boundary: This report is a wording aid, not therapy, mediation, abuse diagnosis, or a safety assessment. A pattern match can be wrong or miss important context.",
  ].join("\n");
}

function renderReport(analysis) {
  const draft = makeRepairDraft({
    goal: goalInput.value,
    relationship: relationshipLabels[relationshipInput.value] || relationshipLabels.other,
    situation: situationInput.value,
    feeling: feelingInput.value,
    need: needInput.value,
    request: requestInput.value,
  });

  reportPanel.hidden = false;
  reportStatus.textContent = `${analysis.lineCount} line${analysis.lineCount === 1 ? "" : "s"} reviewed. Read matches in context.`;
  reportSummary.innerHTML = `
    <div><strong>${analysis.lineCount}</strong><span>lines</span></div>
    <div><strong>${analysis.frictionCount}</strong><span>friction signals</span></div>
    <div><strong>${analysis.repairCount}</strong><span>repair signals</span></div>
    <div><strong>${analysis.speakers.length}</strong><span>speaker labels</span></div>
  `;
  renderSafety(analysis);
  renderPatterns(analysis);
  renderLines(analysis);
  repairDraft.textContent = draft;
  lastReport = buildTextReport(analysis, draft);
  copyButton.disabled = false;
  downloadButton.disabled = false;
  reportPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const source = conversationInput.value.trim();
  if (source.length < 20) {
    reportStatus.textContent = "Add at least a few complete lines to review.";
    conversationInput.focus();
    return;
  }
  renderReport(analyzeConversation(source));
});

loadDemoButton.addEventListener("click", () => {
  relationshipInput.value = "partner";
  goalInput.value = "reconnect";
  conversationInput.value = demoConversation;
  situationInput.value = "our plans changed and we argued about communication";
  feelingInput.value = "hurt and left out";
  needInput.value = "reliability and timely updates";
  requestInput.value = "send a short message when plans change";
  reportStatus.textContent = "Demo conversation loaded.";
});

clearButton.addEventListener("click", () => {
  form.reset();
  conversationInput.value = "";
  reportPanel.hidden = true;
  reportStatus.textContent = "Paste a conversation to begin.";
  copyButton.disabled = true;
  downloadButton.disabled = true;
  lastReport = "";
});

copyButton.addEventListener("click", async () => {
  if (!lastReport) return;
  await navigator.clipboard.writeText(lastReport);
  copyButton.textContent = "Copied";
  setTimeout(() => {
    copyButton.textContent = "Copy report";
  }, 1200);
});

downloadButton.addEventListener("click", () => {
  if (!lastReport) return;
  const url = URL.createObjectURL(new Blob([lastReport], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "repairtalkai-conversation-reflection.txt";
  link.click();
  URL.revokeObjectURL(url);
});
