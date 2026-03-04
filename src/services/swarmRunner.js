/**
 * SwarmRunner — The Logos Engine Runtime
 *
 * Orchestrates the full execution pipeline with all three Logos Engine layers:
 *   Blueprint (Anatomy)  → system instruction per node
 *   Soul (CODEX)         → intercepts each output, enforces constitution
 *   Mind (PROMETHEAN-UPE)→ scores outputs, signals iteration if needed
 */

import { personaDna } from '../data/personaDna';
import { useSwarmStore } from '../stores/swarmStore';
import { executePrompt } from './promptExecutor';
import { generateSystemInstruction } from './anatomyEngine';
import { runCodexCheck } from './codexInterceptor';
import { runUPEScoring } from './prometheusUPE';
import { loadPromptsForNode, storeMemory } from './supermemoryService';

export class SwarmRunner {
  get store() {
    return useSwarmStore.getState();
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
      updateModelStats,
      toggleOutput,
      addRejectedPath,
      addCodexViolation,
      setUPEScores,
      updateSignalBus,
    } = this.store;

    try {
      startExecution();
      toggleOutput();
      addExecutionLog({ type: 'start', message: 'Logos Engine initializing — Soul, Mind, Blueprint online' });

      const executionFlow = swarmConfig.executionFlow;

      for (let i = 0; i < executionFlow.stages.length; i++) {
        const stage = executionFlow.stages[i];
        setCurrentStage(i);

        addExecutionLog({
          type: 'stage',
          message: `Stage ${stage.stage}: activating ${stage.nodes.join(', ')}`,
        });

        const stagePromises = stage.nodes.map(async (nodeId) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (!node) return;

          const input = this.buildNodeInput(nodeId, nodes);
          const startTime = Date.now();

          // ─── BLUEPRINT LAYER: Generate anatomy system instruction ───
          const systemInstruction = generateSystemInstruction(
            node.type,
            node.data.anatomy || {},
            globalSignal.goal,
            globalSignal.tone
          );

          addExecutionLog({
            type: 'blueprint',
            message: `[Blueprint] ${node.data.role} — anatomy profile loaded`,
          });

          // Try Supermemory for relevant past context
          const memoryPrompts = await loadPromptsForNode(node.type, globalSignal.goal);
          const basePrompt = memoryPrompts[0]?.content || node.data.prompt;

          // Enrich with persona DNA
          const personaKey = node.type.charAt(0).toUpperCase() + node.type.slice(1);
          const dna = personaDna[personaKey] || [];
          const enhancedPrompt = dna.length
            ? `${basePrompt}\n\n[Persona Lens: ${dna.join(' | ')}]`
            : basePrompt;

          // ─── EXECUTE (with anatomy system instruction) ───
          const rawResult = await executePrompt(
            enhancedPrompt,
            {
              ...input,
              signal: globalSignal,
              anatomy: node.data.anatomy,
              config: node.data.config,
              nodeType: node.type,
            },
            systemInstruction
          );

          const duration = Date.now() - startTime;

          // ─── SOUL LAYER: CODEX Interceptor ───
          addExecutionLog({
            type: 'codex',
            message: `[CODEX] Evaluating ${node.data.role} output...`,
          });

          const codexResult = await runCodexCheck(rawResult, node.type, globalSignal.goal);

          if (!codexResult.approved) {
            addExecutionLog({
              type: 'codex_violation',
              message: `[CODEX] ⚠️ Violations in ${node.data.role}: ${codexResult.violations.join(', ')} (score: ${(codexResult.codexScore * 100).toFixed(0)}%)`,
            });
            addCodexViolation({
              nodeId,
              nodeType: node.type,
              violations: codexResult.violations,
              score: codexResult.codexScore,
              timestamp: Date.now(),
            });
            addRejectedPath({
              nodeId,
              reason: `CODEX violations: ${codexResult.violations.join(', ')}`,
              originalOutput: rawResult.substring(0, 200),
              timestamp: Date.now(),
            });
          } else {
            addExecutionLog({
              type: 'codex_pass',
              message: `[CODEX] ✅ ${node.data.role} passed (score: ${(codexResult.codexScore * 100).toFixed(0)}%)`,
            });
          }

          // Use refined output if CODEX suggested one
          const finalResult = codexResult.refinedOutput;

          // ─── MIND LAYER: PROMETHEAN-UPE scoring (Sentinel + Synth) ───
          let upeResult = null;
          if (node.type === 'sentinel' || node.type === 'synth') {
            addExecutionLog({
              type: 'upe',
              message: `[UPE] Running PROMETHEAN-UPE scoring on ${node.data.role}...`,
            });

            upeResult = await runUPEScoring(finalResult, globalSignal.goal, node.type);
            setUPEScores(nodeId, upeResult);

            const scoreDisplay = `${(upeResult.compositeScore * 100).toFixed(0)}%`;
            addExecutionLog({
              type: 'upe_score',
              message: `[UPE] ${node.data.role} composite score: ${scoreDisplay}${upeResult.shouldIterate ? ' — iteration recommended' : ' — quality threshold met'}`,
            });

            if (upeResult.shouldIterate) {
              updateSignalBus({ signalChange: `UPE flagged ${node.type} for iteration — score ${scoreDisplay}` });
            }
          }

          // Store final result
          updateExecutionResults(nodeId, {
            result: finalResult,
            timing: { duration },
            codex: codexResult,
            upe: upeResult,
          });

          updateModelStats(node.type, { lastUsed: Date.now(), avgTime: duration });

          addExecutionLog({
            type: 'node_complete',
            message: `${node.data.role} complete — ${duration}ms`,
            nodeId,
          });

          // Persist to Supermemory (non-blocking)
          storeMemory({
            content: finalResult,
            metadata: {
              nodeType: node.type,
              nodeId,
              goal: globalSignal.goal,
              tone: globalSignal.tone,
              codexScore: codexResult.codexScore,
              upeScore: upeResult?.compositeScore,
              timestamp: Date.now(),
            },
          }).catch(() => {});

          return { nodeId, result: finalResult };
        });

        await Promise.all(stagePromises);

        if (stage.waitForCompletion) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      addExecutionLog({ type: 'complete', message: '⚛️ Swarm execution complete — all layers passed' });
    } catch (error) {
      this.store.addExecutionLog({
        type: 'error',
        message: `Execution failed: ${error.message}`,
      });
      console.error('Swarm execution error:', error);
    } finally {
      this.store.stopExecution();
    }
  }

  buildNodeInput(nodeId, nodes) {
    const { edges, executionResults } = this.store;
    const incomingEdges = edges.filter((edge) => edge.target === nodeId);
    const input = {};

    for (const edge of incomingEdges) {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const resultEntry = executionResults[edge.source];
      if (sourceNode && resultEntry) {
        input[sourceNode.type] = resultEntry.result;
      }
    }

    return input;
  }
}

export const swarmRunner = new SwarmRunner();
