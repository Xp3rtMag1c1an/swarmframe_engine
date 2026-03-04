/**
 * Supermemory Service
 *
 * Supermemory is the MEMORY layer for the swarm — not an LLM.
 * It stores node outputs as memories and retrieves relevant context
 * before each node runs, so the swarm learns across sessions.
 *
 * API: https://api.supermemory.ai/v3
 */

const API_KEY = process.env.REACT_APP_SUPERMEMORY_API_KEY;
const BASE_URL = 'https://api.supermemory.ai/v3';

function headers() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Store a memory in Supermemory.
 * Called after each node completes so future swarm runs have context.
 */
export async function storeMemory({ content, metadata = {} }) {
  if (!API_KEY) return null;

  try {
    const response = await fetch(`${BASE_URL}/memories`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ content, metadata }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.warn('Supermemory store failed:', err?.message || response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('Supermemory store error:', error.message);
    return null;
  }
}

/**
 * Search Supermemory for relevant past outputs.
 * Used before each node runs to inject learned context.
 *
 * Returns an array of memory objects: [{ content, metadata, score }]
 */
export async function searchMemories(query, limit = 5) {
  if (!API_KEY || !query) return [];

  try {
    const params = new URLSearchParams({ q: query, limit });
    const response = await fetch(`${BASE_URL}/memories/search?${params}`, {
      headers: headers(),
    });

    if (!response.ok) {
      console.warn('Supermemory search failed:', response.statusText);
      return [];
    }

    const data = await response.json();
    // Supermemory returns { results: [...] } or just an array depending on version
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch (error) {
    console.warn('Supermemory search error:', error.message);
    return [];
  }
}

/**
 * Load memories relevant to a specific node type and goal.
 * The swarmRunner calls this before executing each node.
 */
export async function loadPromptsForNode(nodeType, goal) {
  const query = `${nodeType} ${goal}`;
  return searchMemories(query, 5);
}

/**
 * List all stored memories (useful for a future "memory browser" UI).
 */
export async function listMemories(limit = 20) {
  if (!API_KEY) return [];

  try {
    const response = await fetch(`${BASE_URL}/memories?limit=${limit}`, {
      headers: headers(),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data) ? data : (data.results ?? []);
  } catch (error) {
    console.warn('Supermemory list error:', error.message);
    return [];
  }
}
