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
const proCode = document.querySelector("#proCode");
const proStatus = document.querySelector("#proStatus");
const activatePack = document.querySelector("#activatePack");
const downloadPack = document.querySelector("#downloadPack");
const reviewForm = document.querySelector("#reviewForm");
const sourceContext = document.querySelector("#sourceContext");
const reviewDate = document.querySelector("#reviewDate");
const humanReviewer = document.querySelector("#humanReviewer");
const intendedUse = document.querySelector("#intendedUse");
const reviewNotes = document.querySelector("#reviewNotes");
const guidedScope = document.querySelector("#guidedScope");
const safetyConfirmed = document.querySelector("#safetyConfirmed");
const paymentStatus = document.querySelector("#paymentStatus");
const checkoutReset = document.querySelector("#checkoutReset");
const paypalReset = document.querySelector("#paypalReset");
const checkoutReview = document.querySelector("#checkoutReview");
const paypalReview = document.querySelector("#paypalReview");

const LICENSE_VERIFY_URL = "https://namebatch.pagecheckai.com/api/licenses/verify";
const STORAGE_KEY = "repairtalkai-paid-code";
const CHECKOUT_BASE = "https://namebatch.pagecheckai.com/api/checkout?v=repairtalk-20260731";
const PAYPAL_RESET_URL = "https://www.paypal.com/ncp/payment/QXL7YCNJWK6WU";
const PAYPAL_REVIEW_URL = "https://www.paypal.com/ncp/payment/5DN49T6JSRJF6";

let lastReport = "";
let lastReportIsDemo = false;
let lastReportHasSafetySignals = false;
let lastReportSignature = "";
let demoInputsLoaded = false;
let paidPackActive = false;
let paidPackEntitlement = "";

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

function checkoutUrl(product, content) {
  const url = new URL(CHECKOUT_BASE);
  url.searchParams.set("product", product);
  url.searchParams.set("utm_source", "repairtalkai");
  url.searchParams.set("utm_medium", "owned");
  url.searchParams.set("utm_campaign", "conversion");
  url.searchParams.set("utm_content", content);
  return url.toString();
}

function setLinkState(link, href) {
  if (href) {
    link.href = href;
    link.setAttribute("aria-disabled", "false");
    return;
  }
  link.removeAttribute("href");
  link.setAttribute("aria-disabled", "true");
}

function currentReportSignature() {
  return JSON.stringify({
    conversation: conversationInput.value.trim(),
    relationship: relationshipInput.value,
    goal: goalInput.value,
    situation: situationInput.value.trim(),
    feeling: feelingInput.value.trim(),
    need: needInput.value.trim(),
    request: requestInput.value.trim(),
    sourceContext: sourceContext.value.trim(),
    reviewDate: reviewDate.value,
    humanReviewer: humanReviewer.value.trim(),
    intendedUse: intendedUse.value.trim(),
    reviewNotes: reviewNotes.value.trim(),
    guidedScope: guidedScope.value.trim(),
    safetyConfirmed: safetyConfirmed.checked,
  });
}

function reportIsCurrent() {
  return Boolean(lastReport) && lastReportSignature === currentReportSignature();
}

function guidedScopeReady() {
  return guidedScope.value.trim().length >= 40;
}

function qualifiedReportReady() {
  const today = new Date().toISOString().slice(0, 10);
  return reportIsCurrent()
    && !lastReportIsDemo
    && !lastReportHasSafetySignals
    && reviewForm.checkValidity()
    && reviewDate.value <= today;
}

function updatePaymentGate() {
  const resetReady = qualifiedReportReady();
  const reviewReady = resetReady && guidedScopeReady();
  setLinkState(checkoutReset, resetReady ? checkoutUrl("repairtalkai", "qualified_reset_report") : "");
  setLinkState(paypalReset, resetReady ? PAYPAL_RESET_URL : "");
  setLinkState(checkoutReview, reviewReady ? checkoutUrl("repairtalkreview", "qualified_guided_report") : "");
  setLinkState(paypalReview, reviewReady ? PAYPAL_REVIEW_URL : "");
  paymentStatus.textContent = lastReportHasSafetySignals
    ? "Possible safety-related language was detected. Paid repair packs stay unavailable; do not use this tool to plan a confrontation."
    : resetReady
      ? reviewReady
        ? "The current reviewed reflection qualifies for both packs. Recheck context and safety before paying or sending anything."
        : "The current reviewed reflection qualifies for $19. Add a guided-review scope and regenerate to qualify for $49."
      : "Prepare a current non-demo reflection report with human context and safety review before payment links become available.";
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

function paidPackText() {
  const packName = paidPackEntitlement === "guided_repair_review_pack"
    ? "Guided Repair Review"
    : "Conversation Reset Pack";
  const guidedSection = paidPackEntitlement === "guided_repair_review_pack"
    ? [
        "Guided review workbook",
        "- Rewrite the core message in one calm paragraph, one short text, and one boundary-setting version.",
        "- Mark any sentence that tries to diagnose, punish, pressure, monitor, or force agreement.",
        "- Identify what belongs outside this conversation: legal, HR, clinical, emergency, financial, or safety decisions.",
        "- Choose one follow-up window and one exit line if the exchange escalates.",
        "",
      ].join("\n")
    : [
        "Conversation reset checklist",
        "- Pause before sending if the draft is trying to win, prove, threaten, or diagnose.",
        "- Keep one observable situation, one feeling, one need, and one doable request.",
        "- Remove names, addresses, employer details, account numbers, and unrelated private facts.",
        "- Edit every sentence until it sounds like you and feels safe to send.",
        "",
      ].join("\n");

  return [
    `RepairTalkAI paid download: ${packName}`,
    "Generated locally in this browser from the current reflection report. The license check sends only an activation code and product name. Conversation text, report matches, draft wording, and safety notes stay on this device unless you choose to share them.",
    "Input source: Your current conversation and reflection fields (not the built-in demo).",
    `Source and permission: ${sourceContext.value.trim()}`,
    `Review date: ${reviewDate.value}`,
    `Human reviewer: ${humanReviewer.value.trim()}`,
    `Intended use: ${intendedUse.value.trim()}`,
    `Context, limitations, and safety notes: ${reviewNotes.value.trim()}`,
    `Guided review scope: ${guidedScope.value.trim() || "Not requested"}`,
    "",
    lastReport || "Generate a reflection before using this workbook.",
    "",
    guidedSection,
    "Boundary",
    "- This is a wording aid, not therapy, mediation, abuse diagnosis, legal advice, HR advice, debt collection, or a safety assessment.",
    "- A missing safety phrase is not proof that a situation is safe.",
    "- Do not send a repair script if doing so could increase danger, retaliation, surveillance, coercion, or pressure.",
    "- No reconciliation, response, behavior change, safety, legal, ranking, traffic, sales, or revenue result is guaranteed.",
  ].join("\n");
}

function updatePaidDownloadState(message) {
  const tierReady = paidPackEntitlement !== "guided_repair_review_pack" || guidedScopeReady();
  if (downloadPack) downloadPack.disabled = !paidPackActive || !qualifiedReportReady() || !tierReady;
  if (proStatus && message) proStatus.textContent = message;
}

function invalidateReport(message = "Reflection inputs changed. Run the reflection again before copying or downloading.") {
  if (!lastReport) {
    updatePaymentGate();
    return;
  }
  lastReport = "";
  lastReportIsDemo = false;
  lastReportHasSafetySignals = false;
  lastReportSignature = "";
  reportPanel.hidden = true;
  copyButton.disabled = true;
  downloadButton.disabled = true;
  reportStatus.textContent = message;
  updatePaymentGate();
  updatePaidDownloadState(
    paidPackActive
      ? "Reflection inputs changed. Generate a new reflection before downloading the paid pack."
      : "Reflection inputs changed. Generate a new reflection before exporting.",
  );
}

function setPaidPackActive(active, message, entitlement = "") {
  paidPackActive = active;
  paidPackEntitlement = active ? entitlement : "";
  updatePaidDownloadState(message);
}

function productFromCode(rawCode) {
  const code = rawCode.trim().toUpperCase();
  if (code.startsWith("RT-")) return { product: "repairtalkai", entitlement: "conversation_reset_pack" };
  if (code.startsWith("RR-")) return { product: "repairtalkreview", entitlement: "guided_repair_review_pack" };
  return null;
}

async function verifyPaidPackCode(rawCode, { quiet = false } = {}) {
  const code = rawCode.trim().toUpperCase();
  const product = productFromCode(code);
  if (!product) {
    setPaidPackActive(false, quiet ? "Enter a valid RT- or RR- code to unlock a repair pack." : "That activation code format is not valid.");
    return false;
  }
  if (!quiet) proStatus.textContent = "Checking activation code...";
  try {
    const response = await fetch(LICENSE_VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, product: product.product }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.valid || data.entitlement !== product.entitlement) {
      setPaidPackActive(false, "That activation code was not accepted for this RepairTalkAI pack.");
      return false;
    }
    localStorage.setItem(STORAGE_KEY, code);
    const tierReady = product.entitlement !== "guided_repair_review_pack" || guidedScopeReady();
    const ready = qualifiedReportReady() && tierReady
      ? "Activation verified. Download your paid pack when ready."
      : "Activation verified. Generate a current qualified reflection for this pack before downloading.";
    setPaidPackActive(true, ready, product.entitlement);
    return true;
  } catch {
    setPaidPackActive(false, "Could not reach the license service. Try again, or use support with your PayPal receipt.");
    return false;
  }
}

function downloadPaidPack() {
  if (!paidPackActive) {
    setPaidPackActive(false, "Activate a repair pack before downloading.");
    return;
  }
  if (!qualifiedReportReady()) {
    updatePaidDownloadState("Generate the current qualified reflection before downloading the paid pack.");
    return;
  }
  if (paidPackEntitlement === "guided_repair_review_pack" && !guidedScopeReady()) {
    updatePaidDownloadState("Add the current guided-review scope and regenerate before downloading the $49 pack.");
    return;
  }
  const url = URL.createObjectURL(new Blob([paidPackText()], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = paidPackEntitlement === "guided_repair_review_pack"
    ? "repairtalkai-guided-repair-review.txt"
    : "repairtalkai-conversation-reset-pack.txt";
  link.click();
  URL.revokeObjectURL(url);
  updatePaidDownloadState("Paid pack downloaded locally.");
}

function renderReport(analysis, { isDemo = false } = {}) {
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
  lastReportIsDemo = isDemo;
  lastReportHasSafetySignals = analysis.safetySignals.length > 0;
  lastReportSignature = currentReportSignature();
  copyButton.disabled = false;
  downloadButton.disabled = false;
  updatePaidDownloadState(
    isDemo
      ? "Demo reflection ready for preview. Use your own conversation and generate again before downloading a paid pack."
      : paidPackActive
        ? "Reflection ready. Download your paid pack when ready."
        : "Reflection ready. Enter an RT- or RR- code to unlock a paid pack.",
  );
  updatePaymentGate();
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
  renderReport(analyzeConversation(source), { isDemo: demoInputsLoaded });
});

form.addEventListener("input", () => {
  demoInputsLoaded = false;
  invalidateReport();
});

loadDemoButton.addEventListener("click", () => {
  invalidateReport("Demo conversation loaded. Run the reflection again before copying or downloading.");
  relationshipInput.value = "partner";
  goalInput.value = "reconnect";
  conversationInput.value = demoConversation;
  situationInput.value = "our plans changed and we argued about communication";
  feelingInput.value = "hurt and left out";
  needInput.value = "reliability and timely updates";
  requestInput.value = "send a short message when plans change";
  demoInputsLoaded = true;
  reportStatus.textContent = "Demo conversation loaded.";
});

clearButton.addEventListener("click", () => {
  form.reset();
  conversationInput.value = "";
  invalidateReport("Paste a conversation to begin.");
  reportPanel.hidden = true;
  reportStatus.textContent = "Paste a conversation to begin.";
  copyButton.disabled = true;
  downloadButton.disabled = true;
  lastReport = "";
  lastReportIsDemo = false;
  lastReportHasSafetySignals = false;
  lastReportSignature = "";
  demoInputsLoaded = false;
  updatePaidDownloadState(paidPackActive ? "Generate a reflection before downloading the paid pack." : "Generate a reflection, then enter the code from your PayPal confirmation.");
  updatePaymentGate();
});

reviewForm.addEventListener("input", () => invalidateReport("Review inputs changed. Generate a new reflection before copying, downloading, or paying."));
reviewForm.addEventListener("change", () => invalidateReport("Review inputs changed. Generate a new reflection before copying, downloading, or paying."));

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
activatePack?.addEventListener("click", () => verifyPaidPackCode(proCode.value));
downloadPack?.addEventListener("click", downloadPaidPack);

const savedCode = localStorage.getItem(STORAGE_KEY);
if (savedCode) {
  proCode.value = savedCode;
  verifyPaidPackCode(savedCode, { quiet: true });
}

reviewDate.max = new Date().toISOString().slice(0, 10);
updatePaymentGate();
