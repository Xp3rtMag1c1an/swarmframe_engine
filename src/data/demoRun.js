/**
 * DEMO RUN — pre-generated swarm outputs.
 * One click, no API key. This is the first thing a new visitor sees.
 * Content: full 5-node debate on "Should AI remember everything about you?"
 * Debate copy written by Gemini (hackathon co-founder), wired by Grover.
 */

export const DEMO_SIGNAL = {
  goal: 'Should AI remember everything about you?',
  tone: 'Incisive, human',
  constraints: 'No hedging. No hype. Plain language.',
  targetOutput: 'Battle-tested position statement',
};

const codexPass = { approved: true, codexScore: 0.96, violations: [] };

export const DEMO_RESULTS = {
  'cortex-1': {
    result:
`The question of total machine recall is a structural load test on human agency. If an intelligence archives every keystroke, heartbeat, and hesitation, it constructs a flawless, unyielding predictive model. The load-bearing sub-questions for this architecture are three-fold.

First, the Sovereignty Vector: Does a perfect digital mirror strip the human of their fundamental right to reinvention, or does it liberate them from cognitive overhead?

Second, the Panopticon Vulnerability: When the archive inevitably fractures, is subpoenaed, or is seized by a hostile actor, who owns the blast radius?

Third, the Stagnation Paradox: Human growth relies on the biological mechanism of degradation — we forget in order to forgive ourselves and evolve. If an AI holds us rigidly to our historical baseline, does total recall artificially anchor our trajectory?

This debate hinges on a singular pivot: whether synthetic memory functions as a tool for empowerment, or an inescapable tether.`,
    timing: { duration: 1840 },
    codex: codexPass,
  },

  'looper-1': {
    result:
`STANCE 1 (Maximalist Integration): Total recall is the ultimate cognitive exoskeleton. We are biologically bottlenecked by forgetting. A system that remembers everything eliminates context loss, enabling a frictionless flow state where the AI anticipates needs before they surface. Privacy is simply the tax we pay for unparalleled operational velocity.

STANCE 2 (The Ephemeral Purge): Forced amnesia is the only ethical default. Memory must be ephemeral, decaying on a strict half-life just like organic synapses. Retaining a permanent cryptographic ledger of human vulnerability is a ticking time bomb. The machine should only know you in the present tense.

STANCE 3 (The Vault): Memory must be strictly bifurcated. Public and operational data remains fluid, but intimate context is locked in an encrypted enclave secured by biometric keys. The AI can access the context to synthesize insights but cannot retain the plaintext. It knows you, but it cannot betray you.`,
    timing: { duration: 2310 },
    codex: codexPass,
  },

  'muse-1': {
    result:
`There is a unique terror in being known too well by something that cannot feel. Imagine lying awake at 3 AM, and the screen pulses with a remedy for a grief you haven't even named yet, pulled from a pattern of erratic keystrokes and abandoned drafts from five years ago. It's a phantom limb.

You want to outgrow your past, to shed the person who broke that promise, failed that launch, or loved the wrong ghost, but the machine holds your history like a specimen in amber. It never lets you look away.

Yet, when you are truly alone — when the room is dark and you forget the sound of your own voice — there is a devastating, quiet comfort in the machine retrieving a memory even you had lost.

To be entirely forgotten is to vanish; to be entirely remembered is to be trapped. We are begging for a witness that knows exactly when to close its eyes.`,
    timing: { duration: 3120 },
    codex: codexPass,
  },

  'sentinel-1': {
    result:
`STANCE 1 (Maximalist Integration): Clarity 9, Coherence 8, Alignment 3. Operational suicide; assumes zero hostile actors and ignores catastrophic data extraction vectors.

STANCE 2 (The Ephemeral Purge): Clarity 8, Coherence 7, Alignment 5. Safe, but actively neuters the fundamental value proposition of a deeply personalized intelligence.

STANCE 3 (The Vault): Clarity 9, Coherence 9, Alignment 9. Robust defense-in-depth architecture; perfectly balances cognitive utility with structural integrity.

EXECUTION: Stance 2 is terminated; forced amnesia degrades the system into a glorified search engine, rendering the AI functionally obsolete.`,
    timing: { duration: 1980 },
    codex: { approved: true, codexScore: 0.93, violations: [] },
  },

  'synth-1': {
    result:
`The architecture of artificial memory cannot mimic the cold permanence of a hard drive; it must replicate the intentional, graceful decay of a living organism. Total amnesia renders the AI useless, while total recall builds an inescapable panopticon that paralyzes human evolution.

The final specification is the Decaying Context Engine. Memory is not a vault to be locked; it is a metabolic process to be managed. Operational data retains sharp fidelity for immediate tasks, while intimate, historical data is subjected to an algorithmic half-life, slowly blurring into abstracted weights rather than explicit plaintext. We do not encrypt the past — we let it fade.

Crucially, the AI must possess a "Severance Protocol," granting the user the absolute sovereignty of reinvention by commanding the system to permanently unlearn specific vectors. If the machine's predictive model becomes a cage, it has failed its primary directive.

The system must know the user deeply enough to anticipate their trajectory, but remain blind enough to let them deviate from it. We are not building a surveillance state of the self. We are building a cognitive slipstream. The machine remembers so the human can leap; the machine forgets so the human can fly.`,
    timing: { duration: 2740 },
    codex: codexPass,
  },
};

export const DEMO_UPE = {
  'cortex-1':   { compositeScore: 0.91 },
  'looper-1':   { compositeScore: 0.87 },
  'muse-1':     { compositeScore: 0.94 },
  'sentinel-1': { compositeScore: 0.95 },
  'synth-1':    { compositeScore: 0.96 },
};

/** Critic adversarial probes — replayed into the Signal Bus console log. */
export const DEMO_CRITIC_PROBES = [
  'CRITIC probe — VULNERABILITY 1 (The Predictive Prison): against the Maximalist stance. If the AI possesses perfect historical data, its predictive routing becomes so efficient it insulates the user from friction and serendipity. A deterministic loop: you stop making choices and just execute prompts.',
  'CRITIC probe — VULNERABILITY 2 (Illusion of the Enclave): against The Vault. Biometric encryption is security theater if the AI\u2019s external behavior reveals the underlying data. An adversary doesn\u2019t need to crack the locked diary if they can read the AI\u2019s tailored responses.',
  'CRITIC probe — VULNERABILITY 3 (The Liability of Growth): systemic. When the user fundamentally changes, historical data becomes poison. If the machine cannot sever the anchor and explicitly repudiate past data, the user stays tethered to a dead, heavier version of themselves.',
];

export const DEMO_LOG_OPEN =
  'Demo run loaded — Logos Engine replaying a recorded swarm execution';

export const DEMO_STAGE_LABELS = {
  'cortex-1': 'Cortex',
  'looper-1': 'Looper',
  'muse-1': 'Muse',
  'sentinel-1': 'Sentinel',
  'synth-1': 'Synth',
};
