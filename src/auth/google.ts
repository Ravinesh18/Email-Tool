import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'http://localhost:3000/auth/google/callback'
);

export const getGoogleAuthUrl = () => {
  const scopes = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'];
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  return url;
};

export const getGmailClient = (tokens: any) => {
  oAuth2Client.setCredentials(tokens);
  return google.gmail({ version: 'v1', auth: oAuth2Client });
};

export const getToken = async (code: string) => {
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
};
