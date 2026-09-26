import { createAnthropicProvider } from './anthropic.js';
import { createGeminiProvider } from './gemini.js';
import { createMockProvider } from '../../shared/providers/mock.js';

/**
 * LLM_PROVIDER=anthropic|gemini|mock picks explicitly. Otherwise: Claude if an
 * Anthropic credential is present, then Gemini, then demo mode.
 * (Set LLM_PROVIDER=anthropic to use an `ant auth login` profile with no env key.)
 */
export function selectProvider(env = process.env) {
  const choice = (env.LLM_PROVIDER || '').toLowerCase();
  if (choice === 'anthropic' || (!choice && (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN))) {
    return createAnthropicProvider(env);
  }
  if (choice === 'gemini' || (!choice && env.GEMINI_API_KEY)) {
    return createGeminiProvider(env);
  }
  return createMockProvider();
}
