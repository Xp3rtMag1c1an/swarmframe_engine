import { loadPromptsForNode } from '../services/supermemoryService';
import { useSwarmStore } from '../stores/swarmStore';
import { executePrompt } from './promptExecutor';
import { storePrompt, retrievePrompts } from './supermemoryIntegration';

export class SwarmRunner {
  constructor() {
    this.store = useSwarmStore.getState();
  }

  async runSwarm() {
    const { 
      swarmConfig, 
      nodes, 
      globalSignal,
      startExecution,
      stopExecution,
      updateExecutionResults,
      addExecutionLog,
      setCurrentStage,
      updateModelStats
    } = this.store;

    try {
      startExecution();
      addExecutionLog({ type: 'start', message: 'Swarm execution started' });

      const executionFlow = swarmConfig.executionFlow;
      
      for (let i = 0; i < executionFlow.stages.length; i++) {
        const stage = executionFlow.stages[i];
        setCurrentStage(i);
        
        addExecutionLog({ 
          type: 'stage', 
          message: `Starting stage ${stage.stage}: ${stage.nodes.join(', ')}` 
        });

        // Execute nodes in parallel for this stage
        const stagePromises = stage.nodes.map(async (nodeId) => {
          const node = nodes.find(n => n.id === nodeId);
          if (!node) return;

          const input = await this.buildNodeInput(nodeId, nodes);
          const startTime = Date.now();
          const prompts = await loadPromptsForNode(node.type, globalSignal.goal);
          const bestPrompt = prompts[0]?.content || node.data.prompt; // Use best match or fallback
          const persona = useSwarmStore.getState().globalSignal.personaState.current_persona;
          const dna = personaDna[persona] || [];
          const enhancedPrompt = `${bestPrompt} [Persona DNA: ${dna.join(', ')}]`;
          const result = await executePrompt(enhancedPrompt, {
            ...input,
            signal: globalSignal,
            anatomy: node.data.anatomy,
            config: node.data.config
          });
          const duration = Date.now() - startTime;

          updateExecutionResults(nodeId, { result, timing: { duration } });

          // Update model stats
          updateModelStats(node.data.model, { lastUsed: Date.now(), avgTime: duration });
          
          addExecutionLog({
            type: 'node_complete',
            message: `${node.data.role} completed`,
            nodeId,
            result: result.substring(0, 100) + '...'
          });

          return { nodeId, result };
        });

        // Wait for stage completion
        await Promise.all(stagePromises);
        
        if (stage.waitForCompletion) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause between stages
        }
      }

      addExecutionLog({ type: 'complete', message: 'Swarm execution completed successfully' });
      
    } catch (error) {
      addExecutionLog({ 
        type: 'error', 
        message: `Execution failed: ${error.message}` 
      });
      console.error('Swarm execution error:', error);
    } finally {
      stopExecution();
    }
  }

  async buildNodeInput(nodeId, nodes) {
    const { edges, executionResults } = this.store;
    
    // Find incoming edges to this node
    const incomingEdges = edges.filter(edge => edge.target === nodeId);
    const input = {};

    for (const edge of incomingEdges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const result = executionResults[edge.source];
      
      if (sourceNode && result) {
        input[sourceNode.data.role.toLowerCase().replace(' node', '')] = result;
      }
    }

    return input;
  }
}

// Export singleton instance
export const swarmRunner = new SwarmRunner(); 