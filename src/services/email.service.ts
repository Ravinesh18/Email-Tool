import OpenAI from 'openai';
import { EmailModel } from '../models/email.model';

export class EmailProcessorService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async processEmail(email: EmailModel) {
    const context = await this.analyzeEmailContext(email);
    const category = this.categorizeEmail(context);
    const response = await this.generateResponse(email, category);

    return { email, category, response };
  }

  private async analyzeEmailContext(email: EmailModel): Promise<string> {
    const aiResponse = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'Analyze email intent and context precisely' 
        },
        { 
          role: 'user', 
          content: `Email Subject: ${email.subject}\nEmail Body: ${email.body}` 
        }
      ]
    });

    return aiResponse.choices[0].message.content || '';
  }

  private categorizeEmail(context: string): EmailModel['category'] {
    const lowercaseContext = context.toLowerCase();
    
    if (lowercaseContext.includes('interested')) return 'Interested';
    if (lowercaseContext.includes('more info')) return 'More Information';
    return 'Not Interested';
  }

  private async generateResponse(
    email: EmailModel, 
    category: EmailModel['category']
  ): Promise<string> {
    const aiResponse = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: `Generate a professional email response for category: ${category}` 
        },
        { 
          role: 'user', 
          content: `Original Email: ${email.body}\nCategory: ${category}` 
        }
      ]
    });

    return aiResponse.choices[0].message.content || '';
  }
}