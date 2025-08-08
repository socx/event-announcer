// npm install googleapis csv-parse
// npm install --save-dev @types/node @types/csv-parse typescript ts-node

import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { parse } from 'csv-parse/sync';

interface Credentials {
  installed: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

interface CsvRecord {
  id: string;
  firstname: string;
  lastname: string;
  dateOfBirth: string;
}

const CREDENTIALS_PATH = path.join(__dirname, '../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../token.json');

function loadCredentials(): Credentials {
  const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
  return JSON.parse(content);
}

async function authorize(): Promise<OAuth2Client> {
  const credentials = loadCredentials();
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } else {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    console.log('Authorize this app by visiting this URL:', authUrl);
    throw new Error('Token not found. Complete OAuth flow and save token.json.');
  }
}

async function readCSVFromDrive(fileId: string): Promise<CsvRecord[]> {
  const auth = await authorize();
  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.files.get(
    {
      fileId,
      alt: 'media',
    },
    { responseType: 'stream' }
  );

  let csvData = '';
  await new Promise<void>((resolve, reject) => {
    res.data
      .on('data', (chunk: Buffer) => {
        csvData += chunk.toString();
      })
      .on('end', () => resolve())
      .on('error', err => reject(err));
  });

  const records: CsvRecord[] = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(records);
  return records;
}

// Replace with your actual CSV file ID
const FILE_ID = 'YOUR_CSV_FILE_ID_HERE';

readCSVFromDrive(FILE_ID).catch(console.error);
