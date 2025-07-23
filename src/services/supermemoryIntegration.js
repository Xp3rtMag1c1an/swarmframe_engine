const API_KEY = 'sm_ZiiKL4fBjZTN8WuSNb7iWK_XfpLqzptGOCyikpHqJaNEdNnhCpZLaFwkGGJGgbqYvbXLMzUWjNcUoIZNhlNLLTA';
const BASE_URL = 'https://api.supermemory.ai/v1'; // Assuming based on typical API structures; adjust if needed

export async function storePrompt(promptData) {
  try {
    const response = await fetch(`${BASE_URL}/prompts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(promptData),
    });
    if (!response.ok) throw new Error('Failed to store prompt');
    return await response.json();
  } catch (error) {
    console.error('Supermemory store error:', error);
    throw error;
  }
}

export async function retrievePrompts(query) {
  try {
    const response = await fetch(`${BASE_URL}/prompts?query=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });
    if (!response.ok) throw new Error('Failed to retrieve prompts');
    return await response.json();
  } catch (error) {
    console.error('Supermemory retrieve error:', error);
    throw error;
  }
}

// Additional functions for database operations as needed 