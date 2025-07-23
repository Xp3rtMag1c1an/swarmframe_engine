const fs = require('fs');
const { storePrompt } = require('./src/services/supermemoryService');

async function seedAdvancedPrompts() {
  const jsonData = JSON.parse(fs.readFileSync('advanced-prompts.json', 'utf8'));
  const prompts = jsonData.prompts;

  for (const item of prompts) {
    await storePrompt({
      title: `${item.category} Prompt`,
      content: item.prompt,
      tags: [item.category.replace(/-/g, ' '), 'advanced', 'meta-learning'],
      category: item.category
    });
  }
  console.log('Advanced seeding completed!');
}

seedAdvancedPrompts(); 