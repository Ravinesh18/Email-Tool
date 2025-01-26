// src/services/auth.service.ts
import { google } from 'googleapis';
import * as msal from '@azure/msal-node';

export class AuthService {
  setupGmailOAuth() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'http://localhost:3000/auth/gmail/callback'
    );

    // Generate authorization URL
    const scopes = ['https://mail.google.com/'];
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes
    });
  }

  setupOutlookOAuth() {
    const msalConfig = {
      auth: {
        clientId: process.env.OUTLOOK_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT_ID}`,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET
      }
    };

    const cca = new msal.ConfidentialClientApplication(msalConfig);
    return cca.getAuthCodeUrl({
      scopes: ['https://graph.microsoft.com/.default'],
      redirectUri: 'http://localhost:3000/auth/outlook/callback'
    });
  }
}