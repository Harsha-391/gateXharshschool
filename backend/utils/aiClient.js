/**
 * AI Client for Exam Planning
 * OpenAI-compatible HTTP client for Gemini, Groq, OpenRouter, Ollama.
 * Server-only module: API key never leaks to client, logs, or error responses.
 */

// In-memory sliding-window rate limiter: max 10 requests per minute per identifier
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export function checkRateLimit(identifier = 'global') {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitMap.get(identifier) || []).filter(t => t > windowStart);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(identifier, timestamps);
    return { allowed: false, retryAfterSeconds: Math.ceil((timestamps[0] + RATE_LIMIT_WINDOW_MS - now) / 1000) };
  }

  timestamps.push(now);
  rateLimitMap.set(identifier, timestamps);
  return { allowed: true };
}

/**
 * Sanitizes input text: truncates to max 600 chars and strips control characters.
 */
export function sanitizeInputText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  // Truncate to 600 characters max
  const truncated = rawText.slice(0, 600);
  // Strip control chars except newlines and tabs
  return truncated.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

/**
 * Robust JSON parser that handles optional markdown codeblocks ```json ... ```
 */
export function extractJsonFromText(text) {
  if (!text || typeof text !== 'string') return null;
  let clean = text.trim();

  // Strip markdown code fences if model enclosed JSON in them
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    // Attempt substring extraction for outer { ... }
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

/**
 * Calls OpenAI-compatible chat completion endpoint with timeout and 1 retry.
 *
 * @param {Object} params
 * @param {string} params.text - Admin's freeform text description
 * @param {string} params.today - Today's date (YYYY-MM-DD)
 * @param {Array<string>} params.examTypes - Allowed exam types
 * @param {Array<string>} params.grades - Allowed grade labels
 * @param {string} [params.rateLimitKey='global'] - Key for rate limiting (e.g. user ID or IP)
 * @returns {Promise<Object>} { ok: true, data } or { ok: false, fallback: true, message }
 */
export async function callExamAiPlan({
  text,
  today,
  examTypes = [],
  grades = [],
  rateLimitKey = 'global'
}) {
  const isEnabled = (process.env.AI_ENABLED || 'true').toLowerCase() === 'true';
  const apiKey = (process.env.AI_API_KEY || '').trim();
  const baseUrl = (process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/+$/, '');
  const model = process.env.AI_MODEL || 'gemini-2.5-flash';
  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || '10000', 10) || 10000;

  // 1. Guard check: is AI enabled and key present?
  if (!isEnabled || !apiKey) {
    return {
      ok: false,
      fallback: true,
      message: 'AI is not available right now. Please fill the details manually.'
    };
  }

  // 2. Rate limit check
  const rl = checkRateLimit(rateLimitKey);
  if (!rl.allowed) {
    return {
      ok: false,
      fallback: true,
      message: `Rate limit reached. Please wait ${rl.retryAfterSeconds}s or fill the details manually.`
    };
  }

  // 3. Sanitize input
  const sanitized = sanitizeInputText(text);
  if (!sanitized) {
    return {
      ok: false,
      fallback: true,
      message: 'Please provide a description of the examination.'
    };
  }

  // 4. Construct system prompt exactly as specified
  const systemPrompt = `You extract exam settings from an admin's text. Reply with JSON only, no explanation, no markdown. Never invent values. Use null for anything not stated and list it in 'missing'. Grades are Roman numerals I to XII. Convert 'class 1 to 6' to gradeFrom 'I', gradeTo 'VI'. Dates must be YYYY-MM-DD. Today is ${today}. Schema:
{ "examType": string|null, "session": string|null,
  "global": { "offDays": string[], "holidays": string[] },
  "groups": [ { "name": string, "gradeFrom": string, "gradeTo": string,
                "startDate": string|null, "subjectsPerDay": number|null,
                "marksPerSubject": number|null,
                "firstPaperStart": string|null, "paperDurationMinutes": number|null,
                "breakMinutes": number|null } ],
  "missing": string[] }
Valid exam types: ${examTypes.join(', ')}. Valid grades: ${grades.join(', ')}.`;

  const requestBody = {
    model,
    temperature: 0,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: sanitized }
    ],
    response_format: { type: 'json_object' }
  };

  const endpoint = `${baseUrl}/chat/completions`;

  // Helper to execute single fetch attempt with AbortController
  async function executeFetch() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        return { success: false, status: response.status };
      }

      const resData = await response.json();
      const rawContent = resData?.choices?.[0]?.message?.content || '';
      const parsed = extractJsonFromText(rawContent);

      return {
        success: !!parsed,
        data: parsed
      };
    } catch (err) {
      return { success: false, error: err.name === 'AbortError' ? 'timeout' : 'network' };
    } finally {
      clearTimeout(timer);
    }
  }

  // Attempt 1
  let result = await executeFetch();

  // Retry once if invalid JSON received
  if (!result.success && result.error !== 'timeout') {
    result = await executeFetch();
  }

  if (result.success && result.data) {
    return {
      ok: true,
      data: result.data
    };
  }

  // Graceful fallback without blocking user or exposing key/internal errors
  return {
    ok: false,
    fallback: true,
    message: 'AI is not available right now. Please fill the details manually.'
  };
}
