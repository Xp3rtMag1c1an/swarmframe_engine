import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { creativeArchitectSwarm } from '../data/swarmTemplates';

export const useSwarmStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Core State
      swarmConfig: creativeArchitectSwarm,
      nodes: creativeArchitectSwarm.nodes,
      edges: creativeArchitectSwarm.edges,
      globalSignal: { ...creativeArchitectSwarm.globalSignal, personaState: { persona_dna: personaDna } },
      
      // Execution State
      isExecuting: false,
      executionResults: {},
      currentStage: 0,
      executionLog: [],
      
      // UI State
      showOutput: false,
      selectedNode: null,
      showSignalBus: true,
      
      // Add to the store state
      modelStats: {},
      promptCache: {},
      
      // Actions
      updateGlobalSignal: (updates) =>
        set((state) => ({
          globalSignal: { ...state.globalSignal, ...updates }
        })),
      
      updateNodeData: (nodeId, data) =>
        set((state) => ({
          nodes: state.nodes.map(node =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          )
        })),
      
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      
      // Execution Actions
      startExecution: () => set({ isExecuting: true, executionResults: {}, currentStage: 0 }),
      stopExecution: () => set({ isExecuting: false }),
      
      updateExecutionResults: (nodeId, result) =>
        set((state) => ({
          executionResults: { ...state.executionResults, [nodeId]: result }
        })),
      
      addExecutionLog: (entry) =>
        set((state) => ({
          executionLog: [...state.executionLog, { ...entry, timestamp: Date.now() }]
        })),
      
      setCurrentStage: (stage) => set({ currentStage: stage }),
      
      // UI Actions
      toggleOutput: () => set((state) => ({ showOutput: !state.showOutput })),
      selectNode: (nodeId) => set({ selectedNode: nodeId }),
      
      // Swarm Management
      loadSwarmTemplate: (template) =>
        set({
          swarmConfig: template,
          nodes: template.nodes,
          edges: template.edges,
          globalSignal: template.globalSignal
        }),
      
      exportSwarm: () => {
        const state = get();
        return {
          ...state.swarmConfig,
          nodes: state.nodes,
          edges: state.edges,
          globalSignal: state.globalSignal
        };
      },

      // Add action
      updateModelStats: (model, stats) =>
        set((state) => ({
          modelStats: { ...state.modelStats, [model]: { ...state.modelStats[model], ...stats } }
        })),

      setPromptCache: (nodeId, prompts) => set((state) => ({ promptCache: { ...state.promptCache, [nodeId]: prompts } })),
    })),
    { name: 'swarm-store' }
  )
); 