// import chalk from 'chalk';
import csvParser from 'csv-parser';
import dayjs from 'dayjs';
import dotenv from 'dotenv';
import fs from 'fs';
import nodeCron from 'node-cron';
import nodemailer from 'nodemailer';
import path from 'path';

import { CELEBRANT_REMINDER_EMAIL_MESSAGE } from './messageTemplates';


dotenv.config();

export interface Recipient {
  id: string;
  firstname: string;
  lastname: string;
  mobileNo: string;
  email: string;
  familyId: string;
}

export interface FamilyMember {
  id: string;
  firstname: string;
  middlename: string;
  lastname: string;
  gender: string;
  parents: string[];
  birthDate: Date;
  weddingDate: Date;
  deathDate: Date;
  spouses: string[];
}

export interface Celebrant {
  id: string;
  firstname: string;
  lastname: string;
  birthDate?: string;
  anniversary?: string;
}

export interface Celebrants {
  birthdays: FamilyMember[];
  anniversaries: FamilyMember[];
}

export const readFamilyMembersFromCSV = (filePath: string): Promise<FamilyMember[]> => {
  try {
    return new Promise((resolve, reject) => {
      const familyMembers: FamilyMember[] = [];
      fs.createReadStream(path.resolve(__dirname, filePath))
      .pipe(csvParser())
      .on('data', (data: any) => {
        familyMembers.push({
          id: data.id,
          firstname: data.firstname,
          middlename: data.middlename,
          lastname: data.lastname,
          gender: data.gender,
          birthDate: new Date(data.birthDate),
          weddingDate: new Date(data.weddingDate),
          deathDate: new Date(data.deathDate),
          spouses: data.spouses,
          parents: data.parents,
        });
      })
      .on('end', () => {
        resolve(familyMembers);
      })
      .on('error', (error) => {
        reject(error);
      });
    });
  }  catch (error) {
    console.error(`Error reading recipients from CSV: ${error}`);
    throw error;
  }
}

export const readRecipientsFromCSV = (filePath: string): Promise<Recipient[]> => {
  try {
    return new Promise((resolve, reject) => {
      const recipients: Recipient[] = [];
      fs.createReadStream(path.resolve(__dirname, filePath))
        .pipe(csvParser())
        .on('data', (data: any) => {
          recipients.push({
            id: data.id,
            firstname: data.firstname,
            lastname: data.lastname,
            mobileNo: data.mobileNo,
            email: data.email,
            familyId: data.familyId,
          });
        })
        .on('end', () => {
          resolve(recipients);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  } catch (error) {
    console.error(`Error reading recipients from CSV: ${error}`);
    throw error;
  }
}

export const getTodayCelebrants = (familyMembers: FamilyMember[]): Celebrants => {
  // const today = dayjs().format('MM-DD');
  const today = dayjs(); // Get today's date
  const todayDay = today.date(); // Day of the month
  const todayMonth = today.month(); // Month (0-indexed)

  let birthdays: FamilyMember[] = [];
  let anniversaries: FamilyMember[] = [];

  if (!familyMembers || familyMembers.length === 0) {
    console.warn('No family members provided for celebrant lookup.');
    return { birthdays, anniversaries };
  }

  birthdays = familyMembers.filter(
    (member: FamilyMember) =>
      member.birthDate &&
      dayjs(member.birthDate).date() === todayDay &&
      dayjs(member.birthDate).month() === todayMonth
  );

  anniversaries = familyMembers.filter(
    (member) =>
      member.weddingDate &&
      dayjs(member.weddingDate).date() === todayDay &&
      dayjs(member.weddingDate).month() === todayMonth
  );

  return { birthdays, anniversaries };
}

export const sendCelebrantReminderEmails = async (
  recipients: Recipient[],
  birthdayCelebrants: FamilyMember[],
  anniversaryCelebrants: FamilyMember[]
) => {
  if (birthdayCelebrants.length === 0 && anniversaryCelebrants.length === 0) {
    console.log("No celebrants to notify today.");
    return;
  }

  if (recipients.length === 0) {
    console.log('No recipients found to send celebrant reminders.');
    return;
  }

  for (const recipient of recipients) {
    const birthdays: string = birthdayCelebrants.map(
      (birthday: FamilyMember) => birthday.id == recipient.familyId ? 'Yourself' : `${birthday.firstname} ${birthday.lastname}`
    ).join(', ') || 'None';

    const anniversaries: string = anniversaryCelebrants.map(
      (celebrant: FamilyMember) => {
        if (celebrant.id === recipient.familyId) { return 'Yourself'; }
        if (celebrant.spouses && celebrant.spouses.includes(recipient.familyId)) { return 'Your spouse'; }
        return `${celebrant.firstname} ${celebrant.lastname}`;
      }
    ).join(', ') || 'None';

    const emailMessage = CELEBRANT_REMINDER_EMAIL_MESSAGE
      .replace('[[RECIPIENT_FIRSTNAME]]', recipient.firstname)
      .replace('[[BIRTHDAY_CELEBRANTS]]', birthdays)
      .replace('[[ANNIVERSARY_CELEBRANTS]]', anniversaries)
      .replace('[[APP_NAME]]', process.env.APP_NAME || 'Event Announcer');

    try {
      await sendEmail(recipient.email, "Today's Celebrations Reminder 🎉", emailMessage);
      console.log(`Celebrant reminder email sent to ${recipient.firstname} (${recipient.email})`);
    } catch (error) {
      console.error(`Failed to send celebrant reminder email to ${recipient.firstname} (${recipient.email}):`, error);
    }
  }
//   const celebrantList = birthdays.map(b => `${b.firstname} ${b.lastname}`).join(', ');
//   const anniversaryList = anniversaries.map(a => `${a.firstname} ${a.lastname}`).join(', ');
//   const celebrantMessage = `
//   <div>
//     <h1>Today's Celebrations 🎉</h1>
//     `+ (birthdays.length > 0 ? `<h2>Birthdays: ${celebrantList}</h2>` : '') +
//     `+ (anniversaries.length > 0 ? `<h2>Anniversaries: ${anniversaryList}</h2>` : '') + `
//     <p>Best regards,</p>
//     <p>${process.env.APP_NAME} Team</p>
//   </div>
//   `;
// import { CELEBRANT_REMINDER_EMAIL_MESSAGE } from './messageTemplates';
//   const emailPromises = recipients.map(async (recipient) => {
//     const emailContent = CELEBRANT_REMINDER_EMAIL_MESSAGE
//       .replace('[[RECIPIENT_FIRSTNAME]]', recipient.firstname)
//       .replace('[[BIRTHDAY_CELEBRANTS]]', celebrantList)
//       .replace('[[ANNIVERSARY_CELEBRANTS]]', anniversaryList)
//       .replace('[[APP_NAME]]', process.env.APP_NAME || 'Event Reminder App');
//     try {
//       await sendEmail(recipient.email, 'Celebration Reminder', emailContent);
//       console.log(`Email sent to ${recipient.firstname} ${recipient.lastname}`);
//     } catch (error) {
//       console.error(`Failed to send email to ${recipient.firstname} ${recipient.lastname}: ${error}`);
//     }
//   });
//   await Promise.all(emailPromises);
//   console.log(`Celebrant reminder emails sent to ${recipients.length} recipients.`);
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`;

  // Validate environment variables
  if (!host || !port || !user || !pass) {
    throw new Error('Email configuration is not properly set in environment variables.');
  }
  if (!to || !subject || !html) {
    throw new Error('Email parameters (to, subject, html) must be provided.');
  }
  if (!from) {
    throw new Error('From address is not set in environment variables.');
  }
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    throw new Error(`Invalid email address: ${to}`);
  }
  // Validate subject and html content
  if (typeof subject !== 'string' || typeof html !== 'string') {
    throw new Error('Subject and HTML content must be strings.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  const mailOptions = {
    from,
    to,
    subject,
    html,
  };

  try {
    console.log(`Email about to be sent to  ${to}`)
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}: ${error}`);
  }
}
