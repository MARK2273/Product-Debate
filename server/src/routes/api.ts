import { Router } from 'express';
import { gemini } from '../services/gemini';
import { DebateManager } from '../services/debateManager';

export const apiRoutes = Router();

// In-memory store for active debates (for MVP)
const debates = new Map<string, DebateManager>();

apiRoutes.post('/products/analyze', async (req, res) => {
  const { products } = req.body; // Array of { name, url }
  try {
    const analysisResults = await Promise.all(products.map(async (p: any) => {
      // If URL, we would scrape here. For now, we infer from Name + URL context.
      const prompt = `Analyze this product: Name: ${p.name}, URL: ${p.url}. 
      Return JSON with: { "specs": "summary of specs", "category": "category", "base_price": "estimated price" }`;
      
      const details = await gemini.generateJSON(prompt, "{ specs, category, base_price }");
      return { ...p, details };
    }));
    
    res.json(analysisResults);
  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
});

apiRoutes.post('/debate/start', async (req, res) => {
    const { products } = req.body; // Array of { name, details }
    const debateId = Date.now().toString();
    const manager = new DebateManager(products);
    
    try {
        const messages = await manager.startDebate();
        debates.set(debateId, manager);
        res.json({ debateId, messages, round: 1 });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to start debate" });
    }
});

apiRoutes.post('/debate/next', async (req, res) => {
    const { debateId } = req.body;
    const manager = debates.get(debateId);
    
    if (!manager) {
        return res.status(404).json({ error: "Debate not found" });
    }

    try {
        const messages = await manager.nextRound();
        res.json({ messages, round: manager['round'] });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to process round" });
    }
});
