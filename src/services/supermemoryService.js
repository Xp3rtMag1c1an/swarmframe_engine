import { create } from 'zustand';

const API_KEY = process.env.REACT_APP_SUPERMEMORY_API_KEY || '';
const BASE_URL = process.env.REACT_APP_SUPERMEMORY_BASE_URL || 'https://api.supermemory.ai/v1';

// Local cache store
const usePromptCache = create((set) => ({
  prompts: {},
  setPrompt: (id, data) => set((state) => ({ prompts: { ...state.prompts, [id]: data } })),
}));

export async function searchPrompts(query, tags = [], limit = 10) {
  try {
    const params = new URLSearchParams({ query, limit });
    tags.forEach(tag => params.append('tags', tag));
    const response = await fetch(`${BASE_URL}/prompts/search?${params}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });
    if (!response.ok) throw new Error('Failed to search prompts');
    const results = await response.json();
    // Cache results
    results.forEach(prompt => usePromptCache.getState().setPrompt(prompt.id, prompt));
    return results;
  } catch (error) {
    console.error('Supermemory search error:', error);
    return [];
  }
}

export async function loadPromptsForNode(nodeType, goalContext) {
  const tags = [nodeType, ...goalContext.split(' ')];
  return searchPrompts(goalContext, tags);
}

export async function savePromptResult(promptId, result, rating) {
  try {
    const response = await fetch(`${BASE_URL}/prompts/${promptId}/results`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ result, rating }),
    });
    if (!response.ok) throw new Error('Failed to save prompt result');
    return await response.json();
  } catch (error) {
    console.error('Supermemory save result error:', error);
  }
}

export async function getPromptTemplates(category) {
  return searchPrompts(category, ['template']);
} 