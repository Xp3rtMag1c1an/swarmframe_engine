// promptExecutor.js with Ollama integration

export async function executePrompt(promptTemplate, context = {}) {
  // Replace placeholders in prompt
  let prompt = promptTemplate;
  Object.entries(context).forEach(([key, value]) => {
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

  // Determine model based on context or default
  const defaultModel = process.env.REACT_APP_OLLAMA_DEFAULT_MODEL || 'llama3.1:8b';
  let model = defaultModel;
  if (context.config?.model) {
    model = context.config.model;
  } else if (context.nodeType) {
    // Example model routing based on node type
    switch (context.nodeType) {
      case 'creative':
        model = 'llama3.1:8b';
        break;
      case 'logic':
        model = 'llama3.1:70b';
        break;
      case 'code':
        model = 'codellama:7b';
        break;
    }
  }

  const baseUrl = process.env.REACT_APP_OLLAMA_BASE_URL || 'http://localhost:11434';
  const url = `${baseUrl}/api/generate`;

  const body = {
    model,
    prompt,
    stream: true, // Enable streaming
    options: {
      temperature: context.config?.temperature || 0.7,
      num_predict: context.config?.maxTokens || 500,
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      for (const line of lines) {
        const parsed = JSON.parse(line);
        if (parsed.response) {
          result += parsed.response;
        }
        if (parsed.done) {
          break;
        }
      }
    }

    return result.trim();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 30 seconds');
    }
    if (error.message.includes('ECONNREFUSED')) {
      throw new Error('Ollama server is offline. Please start Ollama and try again.');
    }
    if (error.message.includes('model')) {
      throw new Error(`Model '${model}' not found. Falling back to default or pull the model with 'ollama pull ${model}'.`);
    }
    throw error;
  }
} 