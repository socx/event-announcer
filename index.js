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
  ANNIVERSARY_REMINDER_EMAIL_MESSAGE,
  ANNIVERSARY_REMINDER_WHATSAPP_MESSAGE,
  BIRTHDAY_REMINDER_EMAIL_MESSAGE,
  BIRTHDAY_REMINDER_WHATSAPP_MESSAGE,
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
    const date = Date.now();
    console.log();

    // Read recipients from CSV file
    spinner.text = "Reading recipients from CSV file... ";
    spinner.render();
    const familyMembers = await readFamilyMembersFromCSV('./family_members.csv');
    const today = dayjs().toDate();
    spinner.succeed(`Fetched ${familyMembers.length} family members successfully.`);

    const birthdayCelebrants = familyMembers.filter(
      (member) =>
        member.birthDate.getDate() === today.getDate() &&
        member.birthDate.getMonth() === today.getMonth()
    );

    const anniversaryCelebrants = familyMembers.filter(
      (member) =>
        member.weddingDate.getDate() === today.getDate() &&
        member.weddingDate.getMonth() === today.getMonth()
    );

    spinner.succeed(`Filtered ${anniversaryCelebrants.length} anniversaryCelebrants for today.`);
    console.log(chalk.blue.bold(`anniversary Celebrants: ${anniversaryCelebrants.map((c) => `${c.firstname} ${c.lastname}`).join(', ')}`));

    spinner.succeed(`Filtered ${birthdayCelebrants.length} birthdayCelebrants for today.`);
    console.log(chalk.blue.bold(`Birthday Celebrants: ${birthdayCelebrants.map((c) => `${c.firstname} ${c.lastname}`).join(', ')}`));
    console.log();

    spinner.text = "Reading recipients from CSV file... ";
    spinner.render();
    const recipients = await readRecipientsFromCSV('./recipients.csv');
    spinner.succeed(`Fetched ${recipients.length} recipients successfully.`);
    console.log(chalk.blue.bold(`Recipients: ${recipients.map((r) => r.firstname).join(', ')}`));
    console.log();

    // Check if there are any birthday or anniversary celebrants
    for (const recipient of recipients) {

      // Sending birthday reminder messages
      for (const birthdayCelebrant of birthdayCelebrants) {
        spinner.text = `Sending message to ${recipient.firstname} about ${birthdayCelebrant.firstname} ${birthdayCelebrant.lastname}... `;
        spinner.render();

        // Check if the recipient is the celebrant
        const isCelebrant = recipient.familyId === birthdayCelebrant.id;
        if (isCelebrant) {
          console.log(chalk.blue.bold(`${recipient.firstname} is the celebrant, skipping message`));
          continue;
        }
        // Send birthday email message
        const birthDayMessageEmail = BIRTHDAY_REMINDER_EMAIL_MESSAGE.replace('[[RECIPIENT_FIRSTNAME]]', recipient.firstname)
          .replace('[[BIRTH_DAY_CELEBRANT]]', `${birthdayCelebrant.firstname} ${birthdayCelebrant.lastname}`)
          .replace('[[BIRTH_DATE]]', `${dayjs(birthdayCelebrant.birthDate).format('dddd, Do MMMM')}`)
          .replace('[[APP_NAME]]', `${process.env.APP_NAME || 'Event Announcer'}`);
        await sendEmail(recipient.email, "Birthday Reminder", birthDayMessageEmail);
        console.log(chalk.green(`Email birthday reminder sent: ${birthDayMessageEmail}`));

        // Send birthday WhatsApp message
        const birthDayMessageWhatsApp = BIRTHDAY_REMINDER_WHATSAPP_MESSAGE.replace('[[RECIPIENT_FIRSTNAME]]', recipient.firstname)
          .replace('[[BIRTH_DAY_CELEBRANT]]', `${birthdayCelebrant.firstname} ${birthdayCelebrant.lastname}`)
          .replace('[[BIRTH_DATE]]', `${dayjs(birthdayCelebrant.birthDate).format('dddd, Do MMMM')}`);
        await sendWhatsAppMessage(recipient.mobileNo, birthDayMessageWhatsApp);
        console.log(chalk.green(`WhatsApp birthday reminder sent: ${birthDayMessageWhatsApp}`));
       
        spinner.succeed(`Message(s) sent successfully to ${recipient.firstname} in ${Date.now() - date}ms`);
      }

      // Sending wedding anniversary reminder messages
      for (const anniversaryCelebrant of anniversaryCelebrants) {
        spinner.text = `Sending message to ${recipient.firstname} about ${anniversaryCelebrant.firstname} ${anniversaryCelebrant.lastname}... `;
        spinner.render();
        // Check if the recipient is a spouse or the celebrant
        // If the recipient is a spouse or the celebrant, skip sending the message
        const isSpouse = anniversaryCelebrant.spouses && anniversaryCelebrant.spouses.includes(recipient.familyId);
        const isCelebrant = recipient.familyId === anniversaryCelebrant.id;
        if (isSpouse || isCelebrant) {
          console.log(chalk.blue.bold(`${recipient.firstname} is a either the celebrant or the spouse of the celebrant`));
          continue;
        }

        // Send anniversary email message
        const anniversaryMessageEmail = ANNIVERSARY_REMINDER_EMAIL_MESSAGE.replace('[[RECIPIENT_FIRSTNAME]]', recipient.firstname)
          .replace('[[ANNIVERSARY_CELEBRANT]]', `${anniversaryCelebrant.firstname} ${anniversaryCelebrant.lastname}`)
          .replace('[[ANNIVERSARY_DATE]]', `${dayjs(anniversaryCelebrant.weddingDate).format('dddd, Do MMMM')}`)
          .replace('[[APP_NAME]]', `${process.env.APP_NAME || 'Event Announcer'}`);
        await sendEmail(recipient.email, "Anniversary Reminder", anniversaryMessageEmail);
        console.log(chalk.green(`Email wedding anniversary reminder sent: ${anniversaryMessageEmail}`));

        // Send anniversary WhatsApp message
        const anniversaryMessageWhatsApp = ANNIVERSARY_REMINDER_WHATSAPP_MESSAGE.replace('[[RECIPIENT_FIRSTNAME]]', recipient.firstname)
          .replace('[[ANNIVERSARY_CELEBRANT]]', `${anniversaryCelebrant.firstname} ${anniversaryCelebrant.lastname}`)
          .replace('[[ANNIVERSARY_DATE]]', `${dayjs(anniversaryCelebrant.weddingDate).format('dddd, Do MMMM')}`);
        await sendWhatsAppMessage(recipient.mobileNo, anniversaryMessageWhatsApp);
        console.log(chalk.green(`WhatsApp wedding anniversary reminder sent: ${anniversaryMessageWhatsApp}`));
      
        spinner.succeed(`Message(s) sent successfully to ${recipient.firstname} in ${Date.now() - date}ms`);
        
      }
    }
    
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
// const job = nodeCron.schedule("0 2 * * *", sendMessages);
