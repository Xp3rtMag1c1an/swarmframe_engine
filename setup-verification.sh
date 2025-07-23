#!/bin/bash

# Ollama Setup Verification Script

OLLAMA_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"

# Check connection
echo "Checking Ollama connection..."
curl -s "$OLLAMA_URL/api/version" > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Ollama is running."
else
  echo "❌ Ollama is not running. Start it with 'ollama serve' or check your OLLAMA_BASE_URL."
  exit 1
fi

# List models
echo "\nAvailable models:"
ollama list

# Test generation
echo "\nTesting generation with default model..."
curl -s "$OLLAMA_URL/api/generate" -d '{"model": "${OLLAMA_DEFAULT_MODEL:-llama3.1:8b}", "prompt": "Test prompt", "stream": false}' | jq '.response'

# Check system memory (basic)
echo "\nSystem Memory:"
free -h

echo "\nTroubleshooting Tips:"
echo "- Ensure Ollama is installed: https://ollama.ai"
echo "- Pull models: ollama pull <model>"
echo "- For large models, ensure sufficient RAM (e.g., 32GB+ for 70b)"
echo "- If connection fails, check if Ollama is running on the correct port." 