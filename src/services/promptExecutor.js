/**
 * Prompt Executor — Gemini API
 * Now supports anatomy-derived system instructions from the Blueprint layer.
 */

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const MODEL_FOR_NODE = {
  cortex:   'gemini-2.5-pro',   // analytical, structured — Pro for deep reasoning
  sentinel: 'gemini-2.5-pro',   // evaluation/scoring — Pro for rigorous analysis
  synth:    'gemini-2.5-pro',   // final synthesis — Pro for highest quality output
  muse:     'gemini-2.5-flash', // creative, expressive — Flash is fast + creative
  looper:   'gemini-2.5-flash', // variant generation — Flash for quick iterations
  critic:   'gemini-2.5-pro',   // adversarial testing — Pro for stress-testing
};

const DEFAULT_MODEL = 'gemini-2.5-flash';

function buildPrompt(template, context) {
  let prompt = template;
  for (const [key, value] of Object.entries(context)) {
    const replacement = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), replacement);
  }
  return prompt;
}

/**
 * Execute a prompt against the Google Gemini API.
 *
 * @param {string} promptTemplate - The prompt with {{placeholder}} syntax
 * @param {object} context - Values to interpolate + config
 * @param {string} [systemInstruction] - System instruction from anatomyEngine (Blueprint layer)
 * @returns {string} The generated text
 */
export async function executePrompt(promptTemplate, context = {}, systemInstruction = null) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'REACT_APP_GEMINI_API_KEY is not set. Add it to your .env file and restart the dev server.'
    );
  }

  const prompt = buildPrompt(promptTemplate, context);

  const nodeType = context.nodeType || 'default';
  const model = context.config?.model || MODEL_FOR_NODE[nodeType] || DEFAULT_MODEL;

  const temperature =
    context.config?.temperature ??
    (nodeType === 'muse' || nodeType === 'looper' ? 0.85 : 0.4);

  // Gemini 2.5 Pro (thinking model) needs generous token budget
  const tokenFloor = model.includes('pro') ? 2048 : 1024;
  const maxOutputTokens = Math.max(context.config?.maxTokens ?? 0, tokenFloor);

  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      topP: 0.95,
      topK: 40,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_NONE' },
    ],
  };

  // Inject anatomy system instruction if provided (Blueprint layer active)
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const msg = errorBody?.error?.message || response.statusText;
      throw new Error(`Gemini API error (${response.status}): ${msg}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      const finishReason = data?.candidates?.[0]?.finishReason;
      throw new Error(`Gemini returned no text. Finish reason: ${finishReason || 'unknown'}`);
    }

    return text.trim();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Gemini request timed out after 60 seconds');
    }
    throw error;
  }
}
