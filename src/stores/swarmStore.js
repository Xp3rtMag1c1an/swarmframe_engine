import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { creativeArchitectSwarm } from '../data/swarmTemplates';
import { personaDna } from '../data/personaDna';

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

      stopExecution: () =>
        set((state) => ({
          isExecuting: false,
          globalSignal: {
            ...state.globalSignal,
            goalProgress: 1,
          },
        })),

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
