import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { creativeArchitectSwarm } from '../data/swarmTemplates';
import { personaDna } from '../data/personaDna';
import {
  DEMO_SIGNAL,
  DEMO_RESULTS,
  DEMO_UPE,
  DEMO_CRITIC_PROBES,
  DEMO_LOG_OPEN,
  DEMO_STAGE_LABELS,
} from '../data/demoRun';

export const useSwarmStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // ─── Core State ───────────────────────────────────────────────
      swarmConfig: creativeArchitectSwarm,
      nodes: creativeArchitectSwarm.nodes,
      edges: creativeArchitectSwarm.edges,
      globalSignal: {
        ...creativeArchitectSwarm.globalSignal,
        personaState: {
          persona_dna: personaDna,
          current_persona: 'Cortex',
        },
        signalChange: null,
        goalProgress: 0,
        outputHistory: [],
        nodeOutputs: {},
      },

      // ─── Execution State ──────────────────────────────────────────
      isExecuting: false,
      executionResults: {},
      currentStage: 0,
      executionLog: [],

      // ─── Signal Bus — Soul Layer ──────────────────────────────────
      rejectedPaths: [],      // CODEX-rejected outputs
      codexViolations: [],    // per-node CODEX violation records

      // ─── Signal Bus — Mind Layer ──────────────────────────────────
      upeScores: {},          // nodeId → UPE result object

      // ─── UI State ─────────────────────────────────────────────────
      showOutput: false,
      selectedNode: null,
      showSignalBus: true,

      // ─── Model / Cache Stats ──────────────────────────────────────
      modelStats: {},
      promptCache: {},

      // ═══ ACTIONS ═══════════════════════════════════════════════════

      // Signal Bus
      updateGlobalSignal: (updates) =>
        set((state) => ({ globalSignal: { ...state.globalSignal, ...updates } })),

      updateSignalBus: (updates) =>
        set((state) => ({
          globalSignal: {
            ...state.globalSignal,
            ...updates,
          },
        })),

      // Nodes
      updateNodeData: (nodeId, data) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
          ),
        })),

      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      // Execution
      startExecution: () =>
        set({
          isExecuting: true,
          executionResults: {},
          currentStage: 0,
          executionLog: [],
          rejectedPaths: [],
          codexViolations: [],
          upeScores: {},
        }),

      // ─── Execution Control ──────────────────────────────────────
      stopExecution: () => {
        set((s) => ({
          isExecuting: false,
          globalSignal: { ...s.globalSignal, goalProgress: 1 },
        }));
        get().addExecutionLog({ type: 'info', message: 'Execution stopped.' });
      },

      // ─── Demo Mode ──────────────────────────────────────────────
      // One-click pre-recorded swarm run. No API key needed.
      loadDemoRun: () => {
        const api = get();
        api.startExecution();
        api.updateSignalBus({
          goal: DEMO_SIGNAL.goal,
          tone: DEMO_SIGNAL.tone,
          constraints: DEMO_SIGNAL.constraints,
          targetOutput: DEMO_SIGNAL.targetOutput,
          signalChange: 'DEMO_MODE',
          goalProgress: 0,
          outputHistory: [],
          nodeOutputs: {},
          rejectedPaths: [],
        });
        set({ showOutput: true });
        api.addExecutionLog({ type: 'start', message: DEMO_LOG_OPEN });

        const stages = ['cortex-1', 'looper-1', 'muse-1', 'sentinel-1', 'synth-1'];
        stages.forEach((nodeId, i) => {
          setTimeout(() => {
            const a = get();
            a.setCurrentStage(i);
            a.addExecutionLog({
              type: 'stage',
              message: `Demo replay — ${DEMO_STAGE_LABELS[nodeId]} node output restored`,
            });
            a.updateExecutionResults(nodeId, DEMO_RESULTS[nodeId]);
            // Demo stores the full text so the Output panel shows the whole debate
            set((s) => ({
              globalSignal: {
                ...s.globalSignal,
                nodeOutputs: {
                  ...s.globalSignal.nodeOutputs,
                  [nodeId]: DEMO_RESULTS[nodeId].result,
                },
              },
            }));
            a.updateNodeData(nodeId, { status: 'completed' });
            a.setUPEScores(nodeId, DEMO_UPE[nodeId]);
            if (nodeId === 'sentinel-1') {
              a.addRejectedPath({
                nodeId: 'looper-1',
                variant: 'Stance 2 — The Ephemeral Purge',
                reason: 'Terminated by Sentinel: forced amnesia degrades the system into a glorified search engine.',
                timestamp: Date.now(),
              });
              // Critic adversarial probes hit the Signal Bus console
              DEMO_CRITIC_PROBES.forEach((probe) =>
                a.addExecutionLog({ type: 'feedback', message: probe })
              );
            }
            if (i === stages.length - 1) {
              a.stopExecution();
              a.addExecutionLog({
                type: 'complete',
                message: 'Demo run complete — battle-tested position forged',
              });
            }
          }, 650 * (i + 1));
        });
      },

      updateExecutionResults: (nodeId, result) =>
        set((state) => ({
          executionResults: { ...state.executionResults, [nodeId]: result },
          globalSignal: {
            ...state.globalSignal,
            nodeOutputs: {
              ...state.globalSignal.nodeOutputs,
              [nodeId]: result.result?.substring(0, 300),
            },
            goalProgress:
              Object.keys({ ...state.executionResults, [nodeId]: result }).length /
              state.nodes.length,
          },
        })),

      addExecutionLog: (entry) =>
        set((state) => ({
          executionLog: [...state.executionLog, { ...entry, timestamp: Date.now() }],
        })),

      setCurrentStage: (stage) => set({ currentStage: stage }),

      // Soul Layer — CODEX
      addCodexViolation: (violation) =>
        set((state) => ({ codexViolations: [...state.codexViolations, violation] })),

      addRejectedPath: (path) =>
        set((state) => ({
          rejectedPaths: [...state.rejectedPaths, path],
          globalSignal: {
            ...state.globalSignal,
            rejectedPaths: [...(state.globalSignal.rejectedPaths || []), path],
          },
        })),

      clearCodexState: () => set({ codexViolations: [], rejectedPaths: [] }),

      // Mind Layer — UPE
      setUPEScores: (nodeId, scores) =>
        set((state) => ({ upeScores: { ...state.upeScores, [nodeId]: scores } })),

      // UI
      toggleOutput: () => set((state) => ({ showOutput: !state.showOutput })),
      selectNode: (nodeId) => set({ selectedNode: nodeId }),

      // BYOK — user-supplied Gemini key, stored only in this browser
      userApiKey:
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('swarmframe_gemini_key') || ''
          : '',
      setUserApiKey: (key) => {
        try {
          if (key) localStorage.setItem('swarmframe_gemini_key', key);
          else localStorage.removeItem('swarmframe_gemini_key');
        } catch {
          /* private mode */
        }
        set({ userApiKey: key });
        get().addExecutionLog({
          type: 'info',
          message: key
            ? 'Gemini API key saved in this browser — live runs enabled.'
            : 'Gemini API key cleared.',
        });
      },

      // Swarm Management
      loadSwarmTemplate: (template) =>
        set({
          swarmConfig: template,
          nodes: template.nodes,
          edges: template.edges,
          globalSignal: {
            ...template.globalSignal,
            personaState: { persona_dna: personaDna, current_persona: 'Cortex' },
          },
        }),

      exportSwarm: () => {
        const state = get();
        return {
          ...state.swarmConfig,
          nodes: state.nodes,
          edges: state.edges,
          globalSignal: state.globalSignal,
          upeScores: state.upeScores,
          codexViolations: state.codexViolations,
        };
      },

      updateModelStats: (model, stats) =>
        set((state) => ({
          modelStats: {
            ...state.modelStats,
            [model]: { ...state.modelStats[model], ...stats },
          },
        })),

      setPromptCache: (nodeId, prompts) =>
        set((state) => ({ promptCache: { ...state.promptCache, [nodeId]: prompts } })),
    })),
    { name: 'logos-engine-store' }
  )
);
