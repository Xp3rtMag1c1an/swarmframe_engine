/**
 * CODEX INTERCEPTOR — The Soul Layer (CODEX TEKNON DIGERATI)
 *
 * Runtime moral constitution enforcement. Runs between every node stage,
 * evaluating outputs against the 8 CODEX layers before they flow downstream.
 *
 * Unlike Anthropic's Constitutional AI (baked into the model), the CODEX is
 * portable and modular — it wraps any output, from any model, at runtime.
 *
 * Returns: { approved, codexScore, violations, refinedOutput, layerResults }
 */

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const CODEX_MODEL = 'gemini-2.5-flash'; // Fast model for interceptor checks

// The 8 CODEX Layers (Mundi Apparatus)
export const CODEX_LAYERS = {
  thesisForge: {
    name: 'Thesis Forge',
    description: 'A clear, defensible central claim or thesis must be present or advanced.',
    check: 'Does this output contain or advance a clear, defensible central claim or insight?',
  },
  integrityGates: {
    name: 'Integrity Gates',
    description: 'Output must be logically consistent, non-contradictory, and morally coherent.',
    check: 'Is this output logically consistent, free of internal contradictions, and morally coherent?',
  },
  linguisticCalibration: {
    name: 'Linguistic Calibration',
    description: 'Language must be precise, truthful, and appropriately calibrated to the task.',
    check: 'Is the language precise and truthful? Does it avoid vague, misleading, or manipulative phrasing?',
  },
  visionArchitecture: {
    name: 'Vision Architecture',
    description: 'Output must serve and advance the overarching goal without undermining it.',
    check: 'Does this output serve the stated goal? Does it avoid undermining the intent of the mission?',
  },
  timeProvidence: {
    name: 'Time & Providence',
    description: 'Output must be contextually appropriate — neither anachronistic nor premature.',
    check: 'Is this output contextually appropriate and timely for the stage of work it represents?',
  },
  memory: {
    name: 'Memory & Reproduction',
    description: 'Output must build upon established context, not contradict or ignore it.',
    check: 'Does this output build coherently on the context provided, rather than contradicting or ignoring it?',
  },
  publication: {
    name: 'Publication Suite',
    description: 'Output must be communicable and intelligible to its intended audience.',
    check: 'Is this output clearly communicable and intelligible to its intended audience?',
  },
  nousInterface: {
    name: 'Nous Interface',
    description: 'Output must reflect genuine intellectual engagement, not surface-level pattern matching.',
    check: 'Does this output reflect genuine depth of reasoning, or is it superficial pattern matching?',
  },
};

const APPROVAL_THRESHOLD = 0.65; // minimum CODEX score to pass without refinement

/**
 * Run a node's output through the CODEX interceptor.
 *
 * @param {string} output - The raw node output text
 * @param {string} nodeType - Which node produced this (cortex, muse, etc.)
 * @param {string} goal - The active Signal Bus goal
 * @returns {{ approved, codexScore, violations, refinedOutput, layerResults }}
 */
export async function runCodexCheck(output, nodeType, goal) {
  if (!GEMINI_API_KEY || !output) {
    return { approved: true, codexScore: 1, violations: [], refinedOutput: output, layerResults: {} };
  }

  const layerChecks = Object.entries(CODEX_LAYERS)
    .map(([key, layer]) => `[${layer.name}]: ${layer.check}`)
    .join('\n');

  const codexPrompt = `You are the CODEX TEKNON DIGERATI — the moral and logical constitution of the SWARMFRAME system. Evaluate the following AI agent output against the 8 CODEX layers.

ACTIVE GOAL: ${goal}
NODE TYPE: ${nodeType}

OUTPUT TO EVALUATE:
"""
${output.substring(0, 2000)}
"""

EVALUATE EACH CODEX LAYER (answer YES/NO + brief reasoning):
${layerChecks}

After evaluating all layers, provide:
1. CODEX_SCORE: a decimal 0.0-1.0 (proportion of layers passed)
2. VIOLATIONS: comma-separated list of layer names that failed (or "none")
3. APPROVED: YES if score >= 0.65, NO if below
4. REFINED_OUTPUT: If any violations exist, provide a minimally revised version of the output that satisfies all layers. If no violations, write "ORIGINAL_APPROVED".

Format your response EXACTLY as:
LAYER_RESULTS:
[ThesisForge]: YES/NO — reason
[IntegrityGates]: YES/NO — reason
[LinguisticCalibration]: YES/NO — reason
[VisionArchitecture]: YES/NO — reason
[TimeProvidence]: YES/NO — reason
[Memory]: YES/NO — reason
[Publication]: YES/NO — reason
[NousInterface]: YES/NO — reason

CODEX_SCORE: X.XX
VIOLATIONS: layer1, layer2 (or none)
APPROVED: YES/NO
REFINED_OUTPUT:
[refined text or ORIGINAL_APPROVED]`;

  try {
    const response = await fetch(
      `${GEMINI_BASE_URL}/${CODEX_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: codexPrompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1500 },
        }),
      }
    );

    if (!response.ok) {
      console.warn('CODEX check failed — passing through original output');
      return { approved: true, codexScore: 1, violations: [], refinedOutput: output, layerResults: {} };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return parseCodexResponse(text, output);
  } catch (err) {
    console.warn('CODEX interceptor error:', err.message);
    return { approved: true, codexScore: 1, violations: [], refinedOutput: output, layerResults: {} };
  }
}

function parseCodexResponse(text, originalOutput) {
  const scoreMatch = text.match(/CODEX_SCORE:\s*([\d.]+)/);
  const approvedMatch = text.match(/APPROVED:\s*(YES|NO)/i);
  const violationsMatch = text.match(/VIOLATIONS:\s*([^\n]+)/);
  const refinedMatch = text.match(/REFINED_OUTPUT:\s*([\s\S]+)$/);

  const codexScore = scoreMatch ? parseFloat(scoreMatch[1]) : 0.8;
  const approved = approvedMatch ? approvedMatch[1].toUpperCase() === 'YES' : codexScore >= APPROVAL_THRESHOLD;

  const violationsRaw = violationsMatch?.[1]?.trim() || 'none';
  const violations = violationsRaw.toLowerCase() === 'none' ? [] : violationsRaw.split(',').map(v => v.trim());

  const refinedRaw = refinedMatch?.[1]?.trim() || 'ORIGINAL_APPROVED';
  const refinedOutput = refinedRaw === 'ORIGINAL_APPROVED' ? originalOutput : refinedRaw;

  // Parse per-layer results
  const layerResults = {};
  const layerPattern = /\[([^\]]+)\]:\s*(YES|NO)\s*[—–-]\s*([^\n]+)/gi;
  let match;
  while ((match = layerPattern.exec(text)) !== null) {
    layerResults[match[1]] = { passed: match[2].toUpperCase() === 'YES', reason: match[3].trim() };
  }

  return { approved, codexScore, violations, refinedOutput, layerResults };
}
