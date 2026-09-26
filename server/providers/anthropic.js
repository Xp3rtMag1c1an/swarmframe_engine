import Anthropic from '@anthropic-ai/sdk';
import { jsonSchemaOutputFormat } from '@anthropic-ai/sdk/helpers/json-schema';

// Models that accept server-side refusal fallbacks (`fallbacks: "default"`).
const FALLBACK_CAPABLE = new Set(['claude-opus-5', 'claude-fable-5-1']);
const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

// Effort replaces temperature on current Claude models (sampling params are rejected).
const DEFAULT_EFFORT = { heavy: 'high', fast: 'medium' };

export function createAnthropicProvider(env = process.env) {
  const client = new Anthropic();
  const models = {
    heavy: env.CLAUDE_MODEL_HEAVY || 'claude-opus-5',
    fast: env.CLAUDE_MODEL_FAST || 'claude-sonnet-5',
  };
  const modelFor = (tier) => models[tier] || tier;

  function withFallbacks(params) {
    if (!FALLBACK_CAPABLE.has(params.model)) return { api: client.messages, params };
    return { api: client.beta.messages, params: { ...params, betas: [FALLBACK_BETA], fallbacks: 'default' } };
  }

  function assertNotRefused(message) {
    if (message.stop_reason === 'refusal') {
      const why = message.stop_details?.explanation || message.stop_details?.category || 'no details';
      throw new Error(`Claude declined this request (${why}).`);
    }
  }

  return {
    id: 'anthropic',
    describe: () => ({ id: 'anthropic', label: 'Claude', models }),
    modelFor,

    async *stream({ system, prompt, tier, effort, abortSignal }) {
      const t = tier in models ? tier : 'heavy';
      const { api, params } = withFallbacks({
        model: modelFor(tier),
        max_tokens: 32000,
        system,
        thinking: { type: 'adaptive', display: 'summarized' },
        output_config: { effort: effort || DEFAULT_EFFORT[t] },
        messages: [{ role: 'user', content: prompt }],
      });
      const stream = api.stream(params, { signal: abortSignal });
      for await (const event of stream) {
        if (event.type !== 'content_block_delta') continue;
        if (event.delta.type === 'text_delta') yield { kind: 'text', text: event.delta.text };
        else if (event.delta.type === 'thinking_delta') yield { kind: 'thinking', text: event.delta.thinking };
      }
      const final = await stream.finalMessage();
      assertNotRefused(final);
      if (final.stop_reason === 'max_tokens') yield { kind: 'text', text: '\n\n*[truncated at max_tokens]*' };
    },

    async json({ system, prompt, schema, tier = 'fast', abortSignal }) {
      const response = await client.messages.parse(
        {
          model: modelFor(tier),
          max_tokens: 8000,
          system,
          output_config: { effort: 'low', format: jsonSchemaOutputFormat(schema) },
          messages: [{ role: 'user', content: prompt }],
        },
        { signal: abortSignal },
      );
      assertNotRefused(response);
      if (!response.parsed_output) throw new Error('Claude returned output that did not match the evaluation schema.');
      return response.parsed_output;
    },
  };
}
