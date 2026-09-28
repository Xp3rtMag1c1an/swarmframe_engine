/**
 * Central API key resolution — BYOK first, build-time env as fallback.
 * The user can paste their own Gemini key in the header; it lives only
 * in their browser's localStorage, never in the repo or the bundle.
 */
import { useSwarmStore } from '../stores/swarmStore';

export const STORAGE_KEY = 'swarmframe_gemini_key';

export function getApiKey() {
  try {
    const fromStore = useSwarmStore.getState().userApiKey;
    if (fromStore) return fromStore;
  } catch {
    /* store not initialized yet */
  }
  return (typeof process !== 'undefined' && process.env.REACT_APP_GEMINI_API_KEY) || '';
}
