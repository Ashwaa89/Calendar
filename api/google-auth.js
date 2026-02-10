const { google } = require('googleapis');
require('dotenv').config();

let oauth2Client = null;

function getOAuth2Client() {
  if (!oauth2Client) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(`Missing OAuth configuration. Client ID: ${!!clientId}, Client Secret: ${!!clientSecret}, Redirect URI: ${!!redirectUri}`);
    }
    
    oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }
  return oauth2Client;
}

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
];

function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  console.log('🔑 OAuth Config:', {
    clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
    redirectUri: redirectUri
  });
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

async function getTokensFromCode(code) {
  const oauth2Client = getOAuth2Client();
  // Explicitly pass redirect_uri to ensure it matches what was used during authorization
  const { tokens } = await oauth2Client.getToken({
    code,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  });
  return tokens;
}

async function getUserCalendars(accessToken) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const response = await calendar.calendarList.list();
  return response.data.items;
}

async function getCalendarEvents(accessToken, calendarId, timeMin, timeMax) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const response = await calendar.events.list({
    calendarId: calendarId,
    timeMin: timeMin || new Date().toISOString(),
    timeMax: timeMax,
    singleEvents: true,
    orderBy: 'startTime'
  });
  
  return response.data.items;
}

async function getUserInfo(accessToken) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  
  const response = await oauth2.userinfo.get();
  return response.data;
}

module.exports = {
  getAuthUrl,
  getTokensFromCode,
  getUserCalendars,
  getCalendarEvents,
  getUserInfo
};
