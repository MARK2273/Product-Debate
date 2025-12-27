import { gemini } from './gemini';

interface Product {
  name: string;
  details?: any;
}

interface DebateMessage {
  sender: string; // 'Moderator' | Product Name
  content: string;
  type: 'intro' | 'argument' | 'rebuttal' | 'conclusion';
}

export class DebateManager {
  private products: Product[];
  private history: DebateMessage[] = [];
  private round: number = 0;

  constructor(products: Product[]) {
    this.products = products;
  }

  async startDebate() {
    this.round = 1;
    // Round 1: Opening Statements
    const promises = this.products.map(p => this.generateOpening(p));
    const results = await Promise.all(promises);
    this.history.push(...results);
    return results;
  }

  async nextRound() {
    this.round++;
    let messages: DebateMessage[] = [];

    if (this.round === 2) {
       // Strengths & Weaknesses
       const promises = this.products.map(p => this.generateProsCons(p));
       messages = await Promise.all(promises);
    } else if (this.round === 3) {
       // Cross Criticism
       // Each agent needs to see the history
       for (const p of this.products) {
          const msg = await this.generateCriticism(p);
          messages.push(msg);
       }
    } else if (this.round === 4) {
       // Rebuttals
       for (const p of this.products) {
          const msg = await this.generateRebuttal(p);
          messages.push(msg);
       }
    } else {
       // Conclusion
       const conclusion = await this.generateConclusion();
       messages.push(conclusion);
       this.round = 99; // Finished
    }
    
    this.history.push(...messages);
    return messages;
  }

  // --- Agent Logic ---

  private async generateOpening(product: Product): Promise<DebateMessage> {
    const prompt = `You are the representative for ${product.name}. 
    Product Details: ${JSON.stringify(product.details)}. 
    Competitors: ${this.products.filter(p => p.name !== product.name).map(p => p.name).join(', ')}.
    Action: Give a short, punchy opening statement introducing your product and why it's the best. Be biased but professional.
    CRITICAL CONSTRAINT: Write exactly ONE short paragraph (max 3 sentences). No lists. No fluff. Be high-energy.`;
    
    const text = await gemini.generateText(prompt);
    return { sender: product.name, content: text, type: 'intro' };
  }

  private async generateProsCons(product: Product): Promise<DebateMessage> {
    const prompt = `You are representing ${product.name}.
    Action: Highlight your killer features and address one trade-off confidentally.
    CRITICAL CONSTRAINT: Write exactly ONE short paragraph (max 4 sentences). Do NOT use bullet points. Make it flow as a powerful statement.`;
    const text = await gemini.generateText(prompt);
    return { sender: product.name, content: text, type: 'argument' };
  }

  private async generateCriticism(product: Product): Promise<DebateMessage> {
    const context = this.history.map(m => `${m.sender}: ${m.content}`).join('\n');
    const prompt = `You are representing ${product.name}.
    Debate History:
    ${context}
    
    Action: Critically attack the claims made by your competitors in the history above. Point out flaws, pricing issues, or missing features. Be aggressive but strategic. Reference their specific claims.
    CRITICAL CONSTRAINT: Write exactly ONE short paragraph (max 3 sentences). Be direct and ruthless.`;
    const text = await gemini.generateText(prompt);
    return { sender: product.name, content: text, type: 'argument' };
  }

  private async generateRebuttal(product: Product): Promise<DebateMessage> {
    const context = this.history.map(m => `${m.sender}: ${m.content}`).join('\n');
    const prompt = `You are representing ${product.name}.
    Debate History:
    ${context}
    
    Action: Rebut the criticisms leveled against you in the last round. Defend your product's value. Why are the competitors wrong or nitpicking?
    CRITICAL CONSTRAINT: Write exactly ONE short paragraph (max 3 sentences). Dismiss them effectively.`;
    const text = await gemini.generateText(prompt);
    return { sender: product.name, content: text, type: 'rebuttal' };
  }

  private async generateConclusion(): Promise<DebateMessage> {
    const context = this.history.map(m => `${m.sender}: ${m.content}`).join('\n');
    const products = this.products.map(p => p.name).join(', ');
    const prompt = `You are a Neutral Moderator. 
    Products debated: ${products}.
    Debate Transcript:
    ${context}
    
    Action: Provide a final verdict. 
    1. Best Overall.
    2. Best Value (if applicable).
    3. Winner for specific use cases.
    Be objective. Base it on the arguments presented.
    CRITICAL CONSTRAINT: Keep the verdict concise. Use bullet points for the 3 categories, but keep descriptions short. Max 150 words total.`;
    
    const text = await gemini.generateText(prompt);
    return { sender: 'Moderator', content: text, type: 'conclusion' };
  }
}
