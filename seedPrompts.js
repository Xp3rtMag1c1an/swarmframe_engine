const fs = require('fs');
const { storePrompt } = require('./src/services/supermemoryService');

async function seedPrompts() {
  const jsonData = JSON.parse(fs.readFileSync('meta-learning-prompts.json', 'utf8'));
  const category = 'Meta-Learning & Mind Mastery';
  const prompts = jsonData[category].Prompts;

  for (const [subcategory, data] of Object.entries(prompts)) {
    if (Array.isArray(data)) {
      for (const prompt of data) {
        await storePrompt({
          title: `${subcategory} Prompt`,
          content: prompt,
          tags: [category.replace(/ &/g, ''), subcategory, ...(data.UseCases || [])],
          category: subcategory
        });
      }
    }
  }
  console.log('Seeding completed!');
}

seedPrompts(); 