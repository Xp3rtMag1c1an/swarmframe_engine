/**
 * Demo provider — no API key, no network. Streams plausible, mission-aware
 * text so the whole pipeline (scheduling, streaming, CODEX, UPE, refinement)
 * can be previewed anywhere, including a static HTML build.
 */

const sleep = (ms, signal) =>
  new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener?.('abort', () => { clearTimeout(t); resolve(); }, { once: true });
  });

function detectRole(system) {
  const m = /You are the (\w+) node/i.exec(system || '');
  return m ? m[1].toLowerCase() : 'generic';
}

function goalOf(prompt, system) {
  const m = /Goal: (.+)/.exec(system || '') || /Mission goal: (.+)/.exec(prompt || '');
  return m ? m[1].trim() : 'the mission';
}

const SCRIPTS = {
  cortex: (g) => `## Strategic decomposition\n\n**Core challenge:** ${g}\n\n### Principles (priority-ranked)\n1. **Anchor on the user's real constraint** — solve the bottleneck, not the symptom.\n2. **Modular by default** — every component replaceable without collapsing the whole.\n3. **Evidence over assertion** — each claim ties to a measurable signal.\n4. **Compounding leverage** — prefer moves that make the next move cheaper.\n\n### Dependency map\n- Research → Framing → Variants → Narrative → Evaluation → Synthesis\n- Evaluation gates Synthesis; Narrative can run in parallel with feasibility checks.\n\n### Execution sequence\nLooper explores three structurally different approaches; Muse gives them a human story; Sentinel scores them against the constraints; Synth assembles the winner.`,
  looper: (g) => `## Three variants\n\n**[Approach A] — The Lattice**\nA distributed, modular take on "${g}". Small units, shared spine, grows by addition. Wins on adaptability; risks coordination overhead.\n\n**[Approach B] — The Keystone**\nOne bold central intervention everything else hangs from. Wins on clarity and speed; risks a single point of failure.\n\n**[Approach C] — The Commons**\nCommunity-owned, participatory, co-designed with the people it serves. Wins on legitimacy and durability; slower to start.\n\n| | A | B | C |\n|---|---|---|---|\n| Scale | incremental | step-change | organic |\n| Cost | low → medium | high upfront | low |\n| Risk | coordination | fragility | pace |`,
  muse: (g) => `## The lived experience\n\nMorning arrives the way a tide does — quietly, then everywhere. In **The Lattice**, you step out onto a shared terrace that didn't exist last year; a neighbor added it, and the structure simply *accepted* it, like a coral reef accepting a new polyp.\n\n**The Keystone** feels like a cathedral you can live in: one gesture so confident the whole neighborhood orients around it, the way a compass needle finds north.\n\n**The Commons** is a garden, not a building. It is never finished, and that is the point — ${g.toLowerCase()} becomes something people *do*, not something done to them.\n\n> Architecture is the art of choosing which stories a place will let you tell.`,
  sentinel: () => `## Evaluation matrix\n\n| Dimension | Lattice | Keystone | Commons |\n|---|---|---|---|\n| Sustainability | 8 | 6 | 9 |\n| Feasibility | 7 | 5 | 6 |\n| Compliance | 7 | 6 | 7 |\n| Social impact | 8 | 6 | 9 |\n| **Total** | **30** | **23** | **31** |\n\n### Flags\n- **Keystone** concentrates risk; needs a phased fallback.\n- **Commons** needs a governance model or it stalls in year two.\n\n### Recommendation\nHybrid: Commons governance on a Lattice structure. Keep the Keystone's single bold gesture as the civic anchor.`,
  synth: (g) => `# Final proposal\n\n## Concept\nA **Lattice-structured Commons** for ${g.toLowerCase()} — modular units on a shared spine, governed by the people who live in it, with one bold civic keystone to give it identity.\n\n## Key innovations\n1. **Additive growth** — units attach without redesigning the whole.\n2. **Participatory governance** — a resident council with a real budget.\n3. **The keystone commons** — a single signature public space that anchors belonging.\n\n## Implementation roadmap\n| Phase | Months | Milestone |\n|---|---|---|\n| Pilot | 0–6 | 12 units + governance charter |\n| Expand | 6–18 | 60 units, keystone space opens |\n| Replicate | 18+ | Playbook published, 2nd site |\n\n## Picture it\nA terrace that grew last spring. A council meeting under a timber canopy. A structure that says *yes* to the next idea.`,
  critic: () => `## Stress test\n\n- **Counterfactual:** if funding drops 40%, the Keystone is the first casualty — make it phase-able.\n- **Edge case:** governance capture by an early, vocal minority. Mitigation: rotating seats.\n- **Robustness score:** 7/10.`,
  generic: (g) => `## Output\n\nA focused response to: ${g}.`,
};

function* chunkWords(text) {
  const parts = text.match(/\S+\s*|\n/g) || [];
  for (let i = 0; i < parts.length; i += 3) yield parts.slice(i, i + 3).join('');
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

export function createMockProvider({ speed = 1 } = {}) {
  return {
    id: 'mock',
    describe: () => ({ id: 'mock', label: 'Demo mode', models: { heavy: 'demo-heavy', fast: 'demo-fast' } }),
    modelFor: (tier) => (tier === 'heavy' ? 'demo-heavy' : tier === 'fast' ? 'demo-fast' : tier),

    async *stream({ system, prompt, abortSignal }) {
      const role = detectRole(system);
      const goal = goalOf(prompt, system);
      const refining = /PREVIOUS DRAFT/.test(prompt);
      yield { kind: 'thinking', text: `Reading the mission and ${refining ? 'the review directives' : 'upstream inputs'}…` };
      await sleep(250 / speed, abortSignal);
      let text = (SCRIPTS[role] || SCRIPTS.generic)(goal);
      if (refining) text += `\n\n---\n*Revised: tightened specificity and added measurable milestones per review.*`;
      for (const c of chunkWords(text)) {
        if (abortSignal?.aborted) return;
        yield { kind: 'text', text: c };
        await sleep((18 + Math.random() * 30) / speed, abortSignal);
      }
    },

    async json({ schema, prompt, abortSignal }) {
      await sleep(350 / speed, abortSignal);
      const revised = /\*Revised:/.test(prompt);
      const seed = hash(prompt.slice(0, 400));
      if (schema.properties.layers) {
        const failKey = !revised && seed > 0.55 ? 'linguisticCalibration' : null;
        const keys = schema.properties.layers.items.properties.key.enum;
        return {
          layers: keys.map((key) => ({
            key,
            passed: key !== failKey,
            reason: key === failKey ? 'Some claims are asserted without a supporting signal.' : 'Meets the bar for this stage.',
          })),
          directive: failKey ? 'Back each major claim with a concrete, measurable indicator.' : '',
        };
      }
      const base = revised ? 8.2 : 6.4 + seed * 1.8;
      const out = { assessment: revised ? 'Refined draft is specific, well-structured and actionable.' : 'Strong direction; needs sharper specifics before it is ship-ready.' };
      for (const [i, key] of Object.keys(schema.properties).filter((k) => k !== 'assessment').entries()) {
        const score = Math.round(Math.min(9.6, base + ((i * 37) % 10) / 10 - 0.3) * 10) / 10;
        out[key] = { score, feedback: `${key[0].toUpperCase() + key.slice(1)} is ${score >= 7.5 ? 'solid' : 'uneven'}.`, improvement: `Add one concrete ${key} example tied to the goal.` };
      }
      return out;
    },
  };
}
