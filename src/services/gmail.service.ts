import { google } from 'googleapis';
import { EmailModel } from '../models/email.model';

export class GmailService {
  private oauth2Client;

  constructor(credentials: any) {
    this.oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );
    this.oauth2Client.setCredentials({
      access_token: credentials.token?.access_token || process.env.GMAIL_ACCESS_TOKEN,
      refresh_token: credentials.token?.refresh_token || process.env.GMAIL_REFRESH_TOKEN,
    });
  }

  async fetchEmails(): Promise<EmailModel[]> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    try {
      const response = await gmail.users.messages.list({
        userId: 'ayushbpit195@gmail.com',
        maxResults: 10
      });
      console.log('line 23',{response})

      const emails: EmailModel[] = await Promise.all(
        (response.data.messages || []).map(async (message) => {
          if (!message.id) {
            throw new Error('Message ID is undefined');
          }

          const msg = await gmail.users.messages.get({
            userId: 'me',
            id: message.id
          });

          if (!msg.data || !msg.data.payload) {
            throw new Error('Invalid message data');
          }

          return {
            id: message.id,
            provider: 'gmail',
            from: this.getHeader(msg.data.payload.headers || [], 'From') || '',
            to: this.getHeader(msg.data.payload.headers || [], 'To') || '',
            subject: this.getHeader(msg.data.payload.headers || [], 'Subject') || '',
            body: this.getMessageBody(msg.data.payload),
            timestamp: msg.data.internalDate ? new Date(parseInt(msg.data.internalDate)) : new Date(),
            category: undefined
          };
        })
      );
      console.log(emails)
      return emails;
    } catch (error) {
      console.error('Gmail fetch error:', error);
      return [];
    }
  }

  private getHeader(headers: any[], name: string): string {
    const header = headers.find(h => h.name === name);
    return header ? header.value : '';
  }

  private getMessageBody(payload: any): string {
    try {
      // Handle different parts of the email
      if (payload.body && payload.body.data) {
        return Buffer.from(payload.body.data, 'base64').toString('utf-8');
      }
      
      // Check for parts in multipart messages
      if (payload.parts) {
        const textPart = payload.parts.find((part: any) => 
          part.mimeType === 'text/plain'
        );
        
        if (textPart && textPart.body && textPart.body.data) {
          return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      }
      
      return '';
    } catch (error) {
      console.error('Error extracting message body:', error);
      return '';
    }
  }
}