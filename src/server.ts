import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { getGoogleAuthUrl, getToken, getGmailClient } from './auth/google';
import { getOutlookAuthUrl, getOutlookClient } from './auth/outlook';

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.get('/auth/google', (req, res) => {
  const url = getGoogleAuthUrl();
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code as string;
  const tokens = await getToken(code);
  const gmailClient = getGmailClient(tokens);
  // Process emails with gmailClient
  res.send('Google OAuth successful');
});

app.get('/auth/outlook', async (req, res) => {
  const url = await getOutlookAuthUrl();
  res.redirect(url);
});

app.get('/auth/outlook/callback', async (req, res) => {
  const code = req.query.code as string;
  const outlookClient = await getOutlookClient(code);
  // Process emails with outlookClient
  res.send('Outlook OAuth successful');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
