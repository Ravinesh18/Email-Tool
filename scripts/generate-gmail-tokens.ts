import express from "express";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import fs from 'fs';

dotenv.config();
const redirectUri = "http://localhost:3000/oauth2callback";

const app = express();
const oauth2Client = new OAuth2Client(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  redirectUri
);

app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    console.log("Tokens:", tokens);
    // Save the tokens to the .env file
    const envVariables = `
GMAIL_ACCESS_TOKEN=${tokens.access_token || ""}
GMAIL_REFRESH_TOKEN=${tokens.refresh_token || ""}
GMAIL_EXPIRY_DATE=${tokens.expiry_date || ""}
`;

    fs.appendFileSync(".env", envVariables);
    console.log("Tokens saved to .env file");
    res.send("Authentication successful");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Authentication failed");
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
    ],
  });
  console.log("Authorize here:", authUrl);
});
