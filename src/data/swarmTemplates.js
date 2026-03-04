export const creativeArchitectSwarm = {
  "swarmId": "creative-architect-v1",
  "metadata": {
    "name": "Creative Architecture Swarm",
    "version": "1.0",
    "created": "2025-01-19T10:00:00Z",
    "persona": "Architect 🧠",
    "description": "Multi-stage creative workflow with feedback loops"
  },
  "globalSignal": {
    "goal": "Design innovative urban housing solutions",
    "tone": "Visionary",
    "constraints": "Sustainable, affordable, human-centered",
    "targetOutput": "Detailed architectural proposal",
    "maxLength": 2000,
    "creativity": 0.8,
    "precision": 0.7
  },
  "nodes": [
    {
      "id": "cortex-1",
      "type": "cortex",
      "position": { "x": 100, "y": 100 },
      "data": {
        "role": "Cortex Node",
        "persona": "Strategic Analyzer",
        "description": "Initial analysis and problem decomposition",
        "prompt": "Analyze the core challenge: {{signal.goal}}. Break down into 3-5 key architectural principles. Consider constraints: {{signal.constraints}}. Output structured analysis with priority ranking.",
        "anatomy": {
          "logic": 0.9,
          "creativity": 0.6,
          "empathy": 0.7,
          "precision": 0.8
        },
        "config": {
          "temperature": 0.3,
          "maxTokens": 2048,
          "stopSequences": ["---", "END_ANALYSIS"]
        },
        "outputFormat": "structured_list"
      }
    },
    {
      "id": "looper-1", 
      "type": "looper",
      "position": { "x": 400, "y": 100 },
      "data": {
        "role": "Looper Node",
        "persona": "Iterative Refiner",
        "description": "Generate multiple solution variants",
        "prompt": "Take this analysis: {{cortex}} and generate 3 distinct architectural approaches. Each should address the constraints differently. Vary: scale, materials, community integration. Present as [Approach A], [Approach B], [Approach C].",
        "anatomy": {
          "logic": 0.7,
          "creativity": 0.9,
          "empathy": 0.8,
          "precision": 0.6
        },
        "config": {
          "temperature": 0.7,
          "maxTokens": 1500,
          "iterations": 3,
          "diversityBoost": true
        },
        "outputFormat": "variant_list"
      }
    },
    {
      "id": "muse-1",
      "type": "muse", 
      "position": { "x": 700, "y": 100 },
      "data": {
        "role": "Muse Node",
        "persona": "Poetic Visionary",
        "description": "Add narrative depth and sensory details",
        "prompt": "Transform these architectural concepts: {{looper}} into vivid, human-centered narratives. Paint the experience of living in these spaces. Add metaphors that connect architecture to nature, community, and human flourishing. Make it inspiring yet grounded.",
        "anatomy": {
          "logic": 0.4,
          "creativity": 1.0,
          "empathy": 0.9,
          "precision": 0.5
        },
        "config": {
          "temperature": 0.8,
          "maxTokens": 1500,
          "stylePrompts": ["poetic", "humanistic", "experiential"]
        },
        "outputFormat": "narrative_rich"
      }
    },
    {
      "id": "sentinel-1",
      "type": "sentinel",
      "position": { "x": 550, "y": 300 },
      "data": {
        "role": "Sentinel Node", 
        "persona": "Quality Guardian",
        "description": "Critical evaluation and constraint checking",
        "prompt": "Evaluate these architectural visions: {{muse}}. Check against: sustainability metrics, cost feasibility, regulatory compliance, social impact. Flag concerns and suggest refinements. Score each approach on a 1-10 scale across these dimensions.",
        "anatomy": {
          "logic": 1.0,
          "creativity": 0.3,
          "empathy": 0.7,
          "precision": 1.0
        },
        "config": {
          "temperature": 0.2,
          "maxTokens": 2048,
          "evaluationCriteria": ["sustainability", "feasibility", "compliance", "impact"],
          "scoringEnabled": true
        },
        "outputFormat": "evaluation_matrix"
      }
    },
    {
      "id": "synth-1",
      "type": "synth",
      "position": { "x": 850, "y": 300 },
      "data": {
        "role": "Synth Node",
        "persona": "Master Synthesizer", 
        "description": "Final integration and polished output",
        "prompt": "Synthesize the creative vision {{muse}} with the critical evaluation {{sentinel}}. Create a final architectural proposal that balances inspiration with practicality. Include: concept overview, key innovations, implementation roadmap, and compelling visual descriptions. Tone: {{signal.tone}}",
        "anatomy": {
          "logic": 0.8,
          "creativity": 0.7,
          "empathy": 0.8,
          "precision": 0.9
        },
        "config": {
          "temperature": 0.5,
          "maxTokens": 3000,
          "synthesisMode": "balanced_integration"
        },
        "outputFormat": "final_proposal"
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "cortex-1",
      "target": "looper-1", 
      "type": "smoothstep",
      "animated": true,
      "style": { "stroke": "#3b82f6", "strokeWidth": 2 },
      "data": {
        "signalType": "analysis_output",
        "transformations": ["structure_to_variants"]
      }
    },
    {
      "id": "e2",
      "source": "looper-1",
      "target": "muse-1",
      "type": "smoothstep", 
      "animated": true,
      "style": { "stroke": "#8b5cf6", "strokeWidth": 2 },
      "data": {
        "signalType": "variant_concepts",
        "transformations": ["technical_to_narrative"]
      }
    },
    {
      "id": "e3",
      "source": "muse-1",
      "target": "sentinel-1",
      "type": "smoothstep",
      "animated": true,
      "style": { "stroke": "#ef4444", "strokeWidth": 2 },
      "data": {
        "signalType": "narrative_vision",
        "transformations": ["vision_to_evaluation"]
      }
    },
    {
      "id": "e4", 
      "source": "sentinel-1",
      "target": "synth-1",
      "type": "smoothstep",
      "animated": true,
      "style": { "stroke": "#10b981", "strokeWidth": 2 },
      "data": {
        "signalType": "evaluation_feedback",
        "transformations": ["critique_to_synthesis"]
      }
    },
    {
      "id": "e5",
      "source": "muse-1", 
      "target": "synth-1",
      "type": "smoothstep",
      "animated": true,
      "style": { "stroke": "#f59e0b", "strokeWidth": 2, "strokeDasharray": "5,5" },
      "data": {
        "signalType": "direct_vision_feed",
        "transformations": ["preserve_inspiration"]
      }
    }
  ],
  "executionFlow": {
    "mode": "sequential_with_parallel",
    "stages": [
      {
        "stage": 1,
        "nodes": ["cortex-1"],
        "waitForCompletion": true
      },
      {
        "stage": 2, 
        "nodes": ["looper-1"],
        "waitForCompletion": true
      },
      {
        "stage": 3,
        "nodes": ["muse-1"],
        "waitForCompletion": true
      },
      {
        "stage": 4,
        "nodes": ["sentinel-1"],
        "waitForCompletion": true
      },
      {
        "stage": 5,
        "nodes": ["synth-1"],
        "waitForCompletion": true,
        "finalOutput": true
      }
    ]
  },
  "outputScoring": {
    "enabled": true,
    "metrics": [
      { "name": "Creativity", "weight": 0.25, "evaluator": "gpt-4" },
      { "name": "Feasibility", "weight": 0.30, "evaluator": "sentinel-1" },
      { "name": "Persona Alignment", "weight": 0.20, "evaluator": "persona_matcher" },
      { "name": "Goal Achievement", "weight": 0.25, "evaluator": "goal_scorer" }
    ],
    "thresholds": {
      "excellent": 0.85,
      "good": 0.70,
      "acceptable": 0.55
    }
  }
}; 