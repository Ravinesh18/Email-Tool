import { getGmailClient } from './auth/google';
import { getOutlookClient } from './auth/outlook';
import { open, Configuration } from 'openai';

const openai = new open(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

export const processEmails = async (email: any, provider: string) => {
  const content = email.body;
  const context = await analyzeContent(content);
  const label = categorizeEmail(context);
  await respondToEmail(email, label, provider);
};

const analyzeContent = async (content: string) => {
  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: `Analyze the following email content and provide a context:\n${content}`,
    max_tokens: 150,
  });

  return response.data.choices[0].text.trim();
};

const categorizeEmail = (context: string) => {
  if (context.includes('interested')) return 'Interested';
  if (context.includes('not interested')) return 'Not Interested';
  return 'More information';
};

const respondToEmail = async (email: any, label: string, provider: string) => {
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
  }

  if (provider === 'gmail') {
    const gmail = getGmailClient();
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
    const client = await getOutlookClient('');
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
