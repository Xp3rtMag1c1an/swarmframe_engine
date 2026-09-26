import { createOllamaProvider, ollamaReachable, OLLAMA_DEFAULT_URL } from './ollama.js';
import { createOpenAICompatibleProvider, PRESETS } from './openaiCompatible.js';
import { createGeminiProvider } from './gemini.js';
import { createAnthropicProvider } from './anthropic.js';
import { createMockProvider } from '../../shared/providers/mock.js';

/**
 * LLM_PROVIDER=ollama|groq|openrouter|openai|gemini|anthropic|mock picks explicitly.
 * Otherwise, free/cheap first: a running local Ollama, then Groq, OpenRouter,
 * Gemini (free tier), Anthropic — and demo mode if nothing is configured.
 */
export async function selectProvider(env = process.env) {
  const choice = (env.LLM_PROVIDER || '').toLowerCase();

  switch (choice) {
    case 'ollama': return createOllamaProvider(env);
    case 'groq': case 'openrouter': case 'openai': return createOpenAICompatibleProvider(choice, env);
    case 'gemini': return createGeminiProvider(env);
    case 'anthropic': return createAnthropicProvider(env);
    case 'mock': return createMockProvider();
    case '': break;
    default: console.warn(`[swarmframe] Unknown LLM_PROVIDER "${choice}" — auto-detecting.`);
  }

  if (await ollamaReachable(env.OLLAMA_BASE_URL || OLLAMA_DEFAULT_URL)) return createOllamaProvider(env);
  if (env.GROQ_API_KEY) return createOpenAICompatibleProvider('groq', env);
  if (env.OPENROUTER_API_KEY) return createOpenAICompatibleProvider('openrouter', env);
  if (env.GEMINI_API_KEY) return createGeminiProvider(env);
  if (env.ANTHROPIC_API_KEY) return createAnthropicProvider(env);
  return createMockProvider();
}

export { PRESETS };
