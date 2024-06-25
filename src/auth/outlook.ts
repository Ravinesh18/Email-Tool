import * as msal from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import dotenv from 'dotenv';

dotenv.config();

const msalConfig = {
  auth: {
    clientId: process.env.OUTLOOK_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT_ID || ''}`,
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
  },
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

export const getOutlookAuthUrl = async () => {
  const authCodeUrlParameters = {
    scopes: ['Mail.Read', 'Mail.Send'],
    redirectUri: 'http://localhost:3000/auth/outlook/callback',
  };

  try {
    const response = await cca.getAuthCodeUrl(authCodeUrlParameters);
    return response;
  } catch (error) {
    console.error('Error in getAuthCodeUrl:', JSON.stringify(error));
    throw error;
  }
};

export const getOutlookClient = async (code: string) => {
  const tokenRequest = {
    code,
    scopes: ['Mail.Read', 'Mail.Send'],
    redirectUri: 'http://localhost:3000/auth/outlook/callback',
  };

  try {
    const response = await cca.acquireTokenByCode(tokenRequest);
    const client = Client.init({
      authProvider: (done) => {
        done(null, response.accessToken);
      },
    });
    return client;
  } catch (error) {
    console.error('Error in acquireTokenByCode:', JSON.stringify(error));
    throw error;
  }
};
