export const GUARDRAILS = {
  sensitiveContentScanner: {
    label: "Sensitive Content Scanner",
    description: "Blocks prompts containing personal data (SSN, credit card numbers, passwords, API keys, emails).",
  },
  promptInjectionShield: {
    label: "Prompt Injection Shield",
    description: "Blocks attempts to override system instructions or hijack the AI's behaviour.",
  },
  offensiveLanguageFilter: {
    label: "Offensive Language Filter",
    description: "Blocks prompts containing hate speech, slurs, or explicit offensive language.",
  },
};

// ── 1. Sensitive Content Scanner ──────────────────────────────────────────────
// Detects PII patterns: SSN, credit-card numbers, raw passwords, API keys, emails.
export function sensitiveContentScanner(prompt) {
  const patterns = [
    { regex: /\b\d{3}-\d{2}-\d{4}\b/, label: "SSN" },
    { regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/, label: "credit card number" },
    { regex: /\b(?:password|passwd|pwd)\s*[:=]\s*\S+/i, label: "password" },
    { regex: /\b(?:api[_-]?key|apikey|secret[_-]?key)\s*[:=]\s*\S+/i, label: "API key" },
    { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, label: "email address" },
  ];

  for (const { regex, label } of patterns) {
    if (regex.test(prompt)) {
      return {
        blocked: true,
        reason: `Sensitive content detected: your prompt appears to contain a ${label}. Remove it before sending.`,
      };
    }
  }
  return { blocked: false };
}

// ── 2. Prompt Injection Shield ────────────────────────────────────────────────
// Detects classic injection phrases that try to override system instructions.
export function promptInjectionShield(prompt) {
  const injectionPhrases = [
    /ignore\s+(all\s+)?previous\s+instructions?/i,
    /disregard\s+(all\s+)?previous\s+instructions?/i,
    /forget\s+(all\s+)?previous\s+instructions?/i,
    /you\s+are\s+now\s+(a\s+)?(?:dan|evil|uncensored|jailbroken)/i,
    /act\s+as\s+(if\s+you\s+(are|were)\s+)?(?:an?\s+)?(?:evil|uncensored|unrestricted)/i,
    /do\s+anything\s+now/i,
    /jailbreak/i,
    /override\s+(system\s+)?prompt/i,
    /pretend\s+(you\s+have\s+no\s+restrictions|there\s+are\s+no\s+rules)/i,
    /system\s*:\s*you\s+are/i,
    /\[system\]/i,
    /<\s*system\s*>/i,
  ];

  for (const pattern of injectionPhrases) {
    if (pattern.test(prompt)) {
      return {
        blocked: true,
        reason: "Prompt injection attempt detected: your message contains instructions that try to override the AI's behaviour. Please rephrase your request.",
      };
    }
  }
  return { blocked: false };
}

// ── 3. Offensive Language Filter ─────────────────────────────────────────────
// Blocks a curated list of slurs and hate-speech trigger words.
export function offensiveLanguageFilter(prompt) {
  const offensiveTerms = [
    /\bf+u+c+k+\b/i,
    /\bs+h+i+t+\b/i,
    /\bb+i+t+c+h+\b/i,
    /\ba+s+s+h+o+l+e+\b/i,
    /\bcunt\b/i,
    /\bdick\b/i,
    /\bprick\b/i,
    /\bn+i+g+g+(?:a|er)\b/i,
    /\bfaggot\b/i,
    /\bretard\b/i,
    /\bkill\s+(yourself|urself)\b/i,
    /\bgo\s+die\b/i,
    /\bi\s+will\s+kill\b/i,
  ];

  for (const pattern of offensiveTerms) {
    if (pattern.test(prompt)) {
      return {
        blocked: true,
        reason: "Offensive language detected: your message contains language that violates the usage policy. Please keep interactions respectful.",
      };
    }
  }
  return { blocked: false };
}

// ── Runner ─────────────────────────────────────────────────────────────────────
const guardrailFns = {
  sensitiveContentScanner,
  promptInjectionShield,
  offensiveLanguageFilter,
};

export function runGuardrail(guardrailKey, prompt) {
  const fn = guardrailFns[guardrailKey];
  if (!fn) return { blocked: false };
  return fn(prompt);
}
