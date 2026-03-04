/**
 * PROMETHEAN-UPE — The Mind Layer
 * (PROMETHEAN Workshop + Ultimate Prompt Evaluator + Adaptive Intelligence Engine)
 *
 * Runs after the Sentinel node to score outputs across 5 dimensions.
 * Scores feed back into the Signal Bus. If composite score < threshold,
 * signals the Looper to regenerate variants.
 *
 * The 5 Dimensions (from the 100-criteria framework):
 *   1. Structural  — organization, form, clarity of architecture
 *   2. Technical   — accuracy, correctness, domain fidelity
 *   3. Cognitive   — depth of reasoning, intellectual engagement
 *   4. Execution   — actionability, specificity, practical force
 *   5. Innovation  — originality, creative departure, novel framing
 */

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const UPE_MODEL = 'gemini-2.5-flash';

export const UPE_DIMENSIONS = {
  structural: {
    name: 'Structural',
    weight: 0.20,
    description: 'Organization, internal architecture, logical flow, and form',
    criteria: [
      'Clear opening that establishes purpose',
      'Logical progression of ideas',
      'Appropriate use of structure (lists, sections, hierarchy)',
      'Coherent closing or synthesis',
      'Proper scoping — not too narrow or too broad',
    ],
  },
  technical: {
    name: 'Technical',
    weight: 0.25,
    description: 'Accuracy, domain correctness, factual integrity, and technical fidelity',
    criteria: [
      'Factual accuracy within domain',
      'Appropriate technical depth for the task',
      'Correct use of domain-specific terminology',
      'No hallucinated or unsupported claims',
      'Constraints properly acknowledged',
    ],
  },
  cognitive: {
    name: 'Cognitive',
    weight: 0.25,
    description: 'Depth of reasoning, intellectual engagement, and analytical rigor',
    criteria: [
      'Demonstrates genuine reasoning (not surface pattern-matching)',
      'Addresses underlying complexity, not just surface features',
      'Shows awareness of trade-offs and tensions',
      'Draws non-obvious connections',
      'Advances understanding rather than restating the prompt',
    ],
  },
  execution: {
    name: 'Execution',
    weight: 0.20,
    description: 'Actionability, specificity, practical force, and goal alignment',
    criteria: [
      'Outputs are actionable or directly usable',
      'Specific enough to be implemented or tested',
      'Directly addresses the stated goal',
      'Avoids vague generalities that produce no movement',
      'Proportional to the task — not over- or under-scoped',
    ],
  },
  innovation: {
    name: 'Innovation',
    weight: 0.10,
    description: 'Originality, creative departure, and novel framing',
    criteria: [
      'Introduces a non-obvious angle or framing',
      'Goes beyond expected or generic responses',
      'Demonstrates creative synthesis',
      'Generates insight that adds genuine value',
      'Avoids clichés and boilerplate',
    ],
  },
};

const ITERATION_THRESHOLD = 0.68; // composite score below this triggers Looper

/**
 * Run PROMETHEAN-UPE scoring on a swarm output.
 *
 * @param {string} output - The text to evaluate (typically the Sentinel or Synth output)
 * @param {string} goal - The active Signal Bus goal
 * @param {string} nodeType - Which node produced this
 * @returns {{ scores, compositeScore, shouldIterate, feedback, dimensionBreakdown }}
 */
export async function runUPEScoring(output, goal, nodeType = 'sentinel') {
  if (!GEMINI_API_KEY || !output) {
    return buildDefaultResult();
  }

  const dimensionList = Object.entries(UPE_DIMENSIONS)
    .map(([key, dim]) => {
      const criteria = dim.criteria.map(c => `    - ${c}`).join('\n');
      return `[${dim.name.toUpperCase()}] (weight: ${dim.weight * 100}%)\n${criteria}`;
    })
    .join('\n\n');

  const upePrompt = `You are PROMETHEAN-UPE — the Ultimate Prompt Evaluator — operating as the mind layer of the SWARMFRAME system. Score the following output across 5 dimensions using a 0-10 scale.

ACTIVE GOAL: ${goal}
NODE: ${nodeType}

OUTPUT TO SCORE:
"""
${output.substring(0, 2500)}
"""

SCORING DIMENSIONS:
${dimensionList}

For each dimension, provide:
- A score from 0-10 (integers or one decimal place)
- 2-3 sentences of specific, actionable feedback
- One concrete improvement suggestion

Then compute the COMPOSITE SCORE using the weights above.

Format EXACTLY as:
STRUCTURAL_SCORE: X
STRUCTURAL_FEEDBACK: [feedback]
STRUCTURAL_IMPROVE: [suggestion]

TECHNICAL_SCORE: X
TECHNICAL_FEEDBACK: [feedback]
TECHNICAL_IMPROVE: [suggestion]

COGNITIVE_SCORE: X
COGNITIVE_FEEDBACK: [feedback]
COGNITIVE_IMPROVE: [suggestion]

EXECUTION_SCORE: X
EXECUTION_FEEDBACK: [feedback]
EXECUTION_IMPROVE: [suggestion]

INNOVATION_SCORE: X
INNOVATION_FEEDBACK: [feedback]
INNOVATION_IMPROVE: [suggestion]

COMPOSITE_SCORE: X.XX
SHOULD_ITERATE: YES/NO
OVERALL_ASSESSMENT: [2-3 sentence overall assessment]`;

  try {
    const response = await fetch(
      `${GEMINI_BASE_URL}/${UPE_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: upePrompt }] }],
          generationConfig: { temperature: 0.15, maxOutputTokens: 1500 },
        }),
      }
    );

    if (!response.ok) {
      console.warn('UPE scoring failed');
      return buildDefaultResult();
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseUPEResponse(text);
  } catch (err) {
    console.warn('PROMETHEAN-UPE error:', err.message);
    return buildDefaultResult();
  }
}

function parseUPEResponse(text) {
  const dimensions = ['structural', 'technical', 'cognitive', 'execution', 'innovation'];
  const scores = {};
  const feedback = {};
  const improvements = {};

  for (const dim of dimensions) {
    const upper = dim.toUpperCase();
    const scoreMatch = text.match(new RegExp(`${upper}_SCORE:\\s*([\\d.]+)`));
    const feedMatch = text.match(new RegExp(`${upper}_FEEDBACK:\\s*([^\\n]+(?:\\n(?![A-Z_]+:)[^\\n]+)*)`));
    const improveMatch = text.match(new RegExp(`${upper}_IMPROVE:\\s*([^\\n]+)`));

    scores[dim] = scoreMatch ? parseFloat(scoreMatch[1]) : 7;
    feedback[dim] = feedMatch?.[1]?.trim() || '';
    improvements[dim] = improveMatch?.[1]?.trim() || '';
  }

  const compositeMatch = text.match(/COMPOSITE_SCORE:\s*([\d.]+)/);
  const iterateMatch = text.match(/SHOULD_ITERATE:\s*(YES|NO)/i);
  const assessmentMatch = text.match(/OVERALL_ASSESSMENT:\s*([^\n]+(?:\n(?![A-Z_]+:)[^\n]+)*)/);

  // Compute weighted composite if not found
  const rawComposite = compositeMatch
    ? parseFloat(compositeMatch[1])
    : Object.entries(UPE_DIMENSIONS).reduce(
        (sum, [key, dim]) => sum + (scores[key] / 10) * dim.weight,
        0
      ) * 10;

  const compositeScore = rawComposite / 10; // normalize to 0-1
  const shouldIterate = iterateMatch
    ? iterateMatch[1].toUpperCase() === 'YES'
    : compositeScore < ITERATION_THRESHOLD;

  const dimensionBreakdown = Object.entries(scores).map(([dim, score]) => ({
    dimension: UPE_DIMENSIONS[dim]?.name || dim,
    score,
    weight: UPE_DIMENSIONS[dim]?.weight || 0.2,
    feedback: feedback[dim],
    improvement: improvements[dim],
    normalized: score / 10,
  }));

  return {
    scores,
    compositeScore,
    shouldIterate,
    feedback: assessmentMatch?.[1]?.trim() || '',
    dimensionBreakdown,
    rawText: text,
  };
}

function buildDefaultResult() {
  return {
    scores: { structural: 7, technical: 7, cognitive: 7, execution: 7, innovation: 7 },
    compositeScore: 0.7,
    shouldIterate: false,
    feedback: 'UPE scoring unavailable — default scores applied',
    dimensionBreakdown: Object.entries(UPE_DIMENSIONS).map(([key, dim]) => ({
      dimension: dim.name,
      score: 7,
      weight: dim.weight,
      feedback: '',
      improvement: '',
      normalized: 0.7,
    })),
    rawText: '',
  };
}
