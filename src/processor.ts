import { getGmailClient, getToken } from './auth/google';
import { getOutlookClient } from './auth/outlook';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const respondToEmail = async (email: any, label: string, provider: string) => {
  let responseText = '';

  switch (label) {
    case 'Interested':
      responseText = 'Thank you for your interest! Are you available for a demo call?';
      break;
    case 'Not Interested':
      responseText = 'Thank you for your time.';
      break;
    case 'More information':
      responseText = 'Could you please provide more information?';
      break;
    default:
      responseText = 'Could you please clarify your request?';
      break;
  }

  // Generate additional context using OpenAI
  const context = await analyzeContent(email.body);

  // Append OpenAI-generated response to the email response
  responseText += `\n\nOpenAI Context:\n${context}`;

  // Send response based on provider
  if (provider === 'gmail') {
    const tokens = await getToken(email.code); // Assuming you have a way to get tokens
    const gmail = getGmailClient(tokens);
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: Buffer.from(
          `To: ${email.from}\r\n` +
          `Subject: Re: ${email.subject}\r\n` +
          `\r\n` +
          `${responseText}`
        ).toString('base64')
      }
    });
  } else if (provider === 'outlook') {
    const client = await getOutlookClient(email.code); // Assuming you have a way to get tokens
    await client.api('/me/sendMail').post({
      message: {
        subject: `Re: ${email.subject}`,
        body: {
          contentType: 'Text',
          content: responseText,
        },
        toRecipients: [{
          emailAddress: {
            address: email.from,
          },
        }],
      }
    });
  }
};

const analyzeContent = async (content: string) => {
  try {
    const response = await openai.completions.create({
      model: 'text-davinci-003',
      prompt: `Analyze the following email content and provide a context:\n${content}`,
      max_tokens: 150,
    });

    // Ensure you handle the response properly
    const choices = response.choices;
    if (choices && choices.length > 0) {
      return choices[0].text.trim();
    } else {
      throw new Error('OpenAI response did not contain expected choices.');
    }
  } catch (error) {
    console.error('Error analyzing content:', error);
    throw error;
  }
};


export const processEmails = async (email: any, provider: string) => {
  const content = email.body;
  const context = await analyzeContent(content);
  const label = categorizeEmail(context);
  await respondToEmail(email, label, provider);
};
const categorizeEmail = (context: string) => {
  if (context.includes('interested')) return 'Interested';
  if (context.includes('not interested')) return 'Not Interested';
  return 'More information';
};