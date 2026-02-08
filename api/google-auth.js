const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
];

function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

async function getTokensFromCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

async function getUserCalendars(accessToken) {
  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const response = await calendar.calendarList.list();
  return response.data.items;
}

async function getCalendarEvents(accessToken, calendarId, timeMin, timeMax) {
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
