/**
 * This script reads a list of recipients from a CSV file and sends them a birthday notice message.
 * It uses node-cron to schedule the job to run every minute.
 * The recipients' first names are extracted from the CSV file.
 */

// TODO: for wedding anniversaries, check if celebrants are spouses, then send a single message with both names


import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import axios from 'axios';
import chalk from 'chalk';
import csvParser from 'csv-parser';
import dayjs from 'dayjs';
import dotenv from 'dotenv';
import fs from 'fs';
import nodeCron from 'node-cron';
import nodemailer from 'nodemailer';
import ora from 'ora';

import { WHATSAPP_BUSINESS_API_ENDPOINT } from './constants.js';
import {
  CELEBRANT_REMINDER_EMAIL_MESSAGE,
} from './messageTemplates.js';

// Load environment variables from .env file
dotenv.config();

// Enable advanced formatting for dayjs
dayjs.extend(advancedFormat);


// Read family members data from CSV
async function readFamilyMembersFromCSV(filePath) {
  const familyMembers = [];

  // id,firstname,middlename,lastname,birthDate,gender,parents,weddingDate,spouses,deathDate
  try {
    const readStream = fs.createReadStream(filePath);
    await new Promise((resolve, reject) => {
      readStream
        .pipe(csvParser())
        .on('data', (row) => {
          familyMembers.push({
            id: row.id,
            firstname: row.firstname,
            middlename: row.middlename,
            lastname: row.lastname,
            birthDate: new Date(row.birthDate),
            gender: row.gender,
            parents: row.parents,
            weddingDate: new Date(row.weddingDate),
            spouses: row.spouses,
            deathDate: row.deathDate,
          });
        })
        .on('end', () => {
          console.log(chalk.green(`Successfully read ${familyMembers.length} family members from CSV.`));
          resolve();
        })
        .on('error', (error) => {
          console.error(chalk.red('Error reading family members CSV file:'), error);
          reject(error);
        });
    });
  } catch (error) {
    console.error(chalk.red('Failed to read family members from CSV:'), error);
  }

  return familyMembers;
}

// Read recipients data from CSV
async function readRecipientsFromCSV(filePath) {
  const recipients = [];

  try {
    const readStream = fs.createReadStream(filePath);
    await new Promise((resolve, reject) => {
      readStream
        .pipe(csvParser())
        .on('data', (row) => {
          recipients.push({
            id: row.id,
            firstname: row.firstname,
            lastname: row.lastname,
            mobileNo: row.mobileNo,
            email: row.email,
            familyId: row.familyId,
          });
        })
        .on('end', () => {
          console.log(chalk.green(`Successfully read ${recipients.length} recipients from CSV.`));
          resolve();
        })
        .on('error', (error) => {
          console.error(chalk.red('Error reading recipients CSV file:'), error);
          reject(error);
        });
    });
  } catch (error) {
    console.error(chalk.red('Failed to read recipients from CSV:'), error);
  }

  return recipients;
}

/**
 * Filters family members to find those with birthdays or wedding anniversaries
 * that match today's day and month.
 * 
 * @param {Array} familyMembers - List of family members with birthDate and weddingDate fields.
 * @returns {Object} - An object containing two arrays: birthdays and anniversaries.
 */
function getTodayCelebrants(familyMembers) {
  const today = dayjs(); // Get today's date
  const todayDay = today.date(); // Day of the month
  const todayMonth = today.month(); // Month (0-indexed)

  const birthdays = familyMembers.filter(
    (member) =>
      member.birthDate &&
      dayjs(member.birthDate).date() === todayDay &&
      dayjs(member.birthDate).month() === todayMonth
  );

  const anniversaries = familyMembers.filter(
    (member) =>
      member.weddingDate &&
      dayjs(member.weddingDate).date() === todayDay &&
      dayjs(member.weddingDate).month() === todayMonth
  );

  return { birthdays, anniversaries };
}

/**
 * Sends celebrant reminder emails to recipients.
 * 
 * @param {Array} recipients - List of recipients.
 * @param {Array} birthdays - List of birthdays celebrants.
 * @param {Array} anniversaries - List of anniversary celebrants.
 */
async function sendCelebrantReminderEmails(recipients, birthdays, anniversaries) {
  for (const recipient of recipients) {
    // Format the list of birthday celebrants
    const birthdayCelebrants = birthdays.map(
      (b) => b.id == recipient.familyId ? 'Yourself' : `${b.firstname} ${b.lastname}`
    ).join(', ') || 'None';

    // Format the list of anniversary celebrants
    const anniversaryCelebrants = anniversaries.map(
      (a) => {
        if (a.id === recipient.familyId) { return 'Yourself'; }
        if (a.spouses && a.spouses.includes(recipient.familyId)) { return 'Your spouse'; }
        return `${a.firstname} ${a.lastname}`;
      }
    ).join(', ') || 'None';

    // Replace placeholders in the email template
    const emailMessage = CELEBRANT_REMINDER_EMAIL_MESSAGE
      .replace('[[RECIPIENT_FIRSTNAME]]', recipient.firstname)
      .replace('[[BIRTHDAY_CELEBRANTS]]', birthdayCelebrants)
      .replace('[[ANNIVERSARY_CELEBRANTS]]', anniversaryCelebrants)
      .replace('[[APP_NAME]]', process.env.APP_NAME || 'Event Announcer');

    // Send the email
    try {
      await sendEmail(recipient.email, "Today's Celebrations Reminder 🎉", emailMessage);
      console.log(chalk.green(`Celebrant reminder email sent to ${recipient.firstname} (${recipient.email})`));
    } catch (error) {
      console.error(chalk.red(`Failed to send celebrant reminder email to ${recipient.firstname} (${recipient.email}):`), error);
    }
  }
}

// Send an email using nodemailer
async function sendEmail(to, subject, html) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: true, // Use SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: `Socx Event Announcer ${process.env.SMTP_USER}`,
      to,
      subject,
      html,
    });
    console.log(chalk.green(`Email sent successfully to ${to}`));
  } catch (error) {
    console.error(chalk.red(`Failed to send email to ${to}:`), error);
  }
}

// Send a WhatsApp message
async function sendWhatsAppMessage(recipientPhone, messageText) {
  if (!process.env.WHATSAPP_TOKEN || !process.env.PHONE_NUMBER_ID) {
    console.error(chalk.red('Missing WhatsApp API credentials.'));
    return;
  }
  if (!recipientPhone || !messageText) {
    console.error(chalk.red('Missing recipient phone number or message text.'));
    return;
  }
  // Validate phone number format (E.164 format)
  const phoneRegex = /^\+\d{1,3}\d{1,14}$/; // E.164 format
  if (!phoneRegex.test(recipientPhone)) {
    console.error(chalk.red(`Invalid phone number format: ${recipientPhone}. Please use E.164 format (e.g., +1234567890).`));
    return;
  }
  const url = `${WHATSAPP_BUSINESS_API_ENDPOINT}/${process.env.PHONE_NUMBER_ID}/messages`;

  const headers = {
    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json'
  };

  const data = {
    messaging_product: 'whatsapp',
    to: recipientPhone,
    type: 'text',
    text: {
      body: messageText
    }
  };

  try {
    const response = await axios.post(url, data, { headers });
    console.log('WhatsApp message sent:', response.data);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
  }
}

async function sendMessages() {
  console.log();
  console.log(chalk.green("Running scheduled job"));

  // Launch a loading spinner with an appropriate message on the terminal
  const spinner = ora({
    text: "Launching event announcer... ",
    color: "blue",
    hideCursor: false,
  }).start();
  
  
  try {
    console.log();

    spinner.text = "Reading recipients from CSV file... ";
    spinner.render();
    const recipients = await readRecipientsFromCSV('./recipients.csv');
    spinner.succeed(`Fetched ${recipients.length} recipients successfully.`);
    console.log(chalk.blue.bold(`Recipients: ${recipients.map((r) => r.firstname).join(', ')}`));
    console.log();

    spinner.text = "Reading celebrants from CSV file... ";
    spinner.render();
    const familyMembers = await readFamilyMembersFromCSV('./family_members.csv');
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);
    spinner.succeed(`Fetched ${birthdays.length + anniversaries.length} celebrants successfully.`);
    console.log(chalk.cyanBright.bold('Today\'s Birthdays:', birthdays.map((b) => `${b.firstname} ${b.lastname}`)));
    console.log(chalk.cyanBright.bold('Today\'s Anniversaries:', anniversaries.map((a) => `${a.firstname} ${a.lastname}`)));
    console.log();

    await sendCelebrantReminderEmails(recipients, birthdays, anniversaries);
    
    console.log(
      chalk.yellow.bold(`ALL DONE at : `),
      chalk.blue.bold(`${new Date().toISOString()}`)
    );

  } catch (error) {
    spinner.fail({ text: "Sending Message failed" });
    spinner.clear();
    console.log(error);
  }
};

// Schedule a job to run
const job = nodeCron.schedule("*/1 * * * *", sendMessages);
