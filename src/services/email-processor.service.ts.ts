// src/services/email-processor.service.ts
import OpenAI from 'openai';
import { EmailModel } from '../models/email.model';

import nodemailer from 'nodemailer';

import * as dotenv from 'dotenv';

dotenv.config()
export class EmailProcessorService {
  private openai: OpenAI;
  private transporter: nodemailer.Transporter;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Configure nodemailer transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log(this.transporter)
  }

  async processEmail(email: EmailModel) {
    const context = await this.analyzeEmailContext(email);
    const category = this.categorizeEmail(context);
    const response = await this.generateResponse(email, category);

    // Send reply
    await this.sendReply(email, response);

    return { email, category, response };
  }

  private async sendReply(originalEmail: EmailModel, responseText: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: originalEmail.from,
        subject: `Re: ${originalEmail.subject}`,
        text: responseText
      });
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  }


  private async analyzeEmailContext(email: EmailModel) {
    const aiResponse = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: 'Analyze email intent and context' 
        },
        { 
          role: 'user', 
          content: email.body 
        }
      ]
    });

    return aiResponse.choices[0].message.content;
  }

  private categorizeEmail(context: string) {
    // Implement AI-based categorization logic
    return context.includes('interested') 
      ? 'Interested' 
      : context.includes('more info') 
        ? 'More Information' 
        : 'Not Interested';
  }

  private async generateResponse(
    email: EmailModel, 
    category: EmailModel['category']
  ): Promise<string> {
    // Refine the system prompt based on category
    const systemPrompts: Record<EmailModel['category'], string> = {
      'Interested': 'Generate a professional response scheduling a demo call',
      'Not Interested': 'Craft a polite acknowledgment and closing response',
      'More Information': 'Provide a detailed informative response with next steps'
    };
  
    const aiResponse = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { 
          role: 'system', 
          content: systemPrompts[category] || 'Generate a professional email response' 
        },
        { 
          role: 'user', 
          content: `
            Original Email Context:
            Subject: ${email.subject}
            Body: ${email.body}
            Category: ${category}
  
            Guidelines:
            - Be professional
            - Directly address the email's intent
            - Provide clear next steps
          `
        }
      ],
      max_tokens: 150  // Limit response length
    });
  
    return aiResponse.choices[0].message.content?.trim() || 'Thank you for your email.';
  }
}