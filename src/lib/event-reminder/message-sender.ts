// import chalk from 'chalk';
import csvParser from 'csv-parser';
import dayjs from 'dayjs';
import dotenv from 'dotenv';
import fs from 'fs';
import nodeCron from 'node-cron';
import nodemailer from 'nodemailer';
import path from 'path';

import { CELEBRANT_REMINDER_EMAIL_MESSAGE, COMPANY_EVENT_REMINDER_EMAIL_MESSAGE } from './messageTemplates';


dotenv.config();

export interface Recipient {
  id: string;
  firstname: string;
  lastname: string;
  mobileNo: string;
  email: string;
  familyId: string;
}

export interface CompanyOfficer {
  id: string;
  firstname: string;
  lastname: string;
  mobileNo: string;
  email: string;
}

export interface FamilyMember {
  id: string;
  firstname: string;
  middlename: string;
  lastname: string;
  gender: string;
  parents: string[];
  birthDate?: Date;
  weddingDate?: Date;
  deathDate?: Date;
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

export interface CompaniesWithEvents {
  accountsDue: Company[];
  returnsDue: Company[];
}

export interface Company {
  id: string;
  companyName: string;
  companyNumber: string;
  companyType: string;
  incorporationDate: Date;
  companyStatus: string;
  registeredAddress: string;
  accountsDueDate: Date;
  accountsNextDueDate: Date;
  accountsLastMadeUpDate: Date;
  returnsDueDate: Date;
  returnsNextDueDate: Date;
  returnsLastMadeUpDate: Date;
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

export const getMonthCelebrants = (familyMembers: FamilyMember[]): Celebrants => {
  const today = dayjs();
  const currentMonth = today.month();

  let birthdays: FamilyMember[] = [];
  let anniversaries: FamilyMember[] = [];

  if (!familyMembers || familyMembers.length === 0) {
    console.warn('No family members provided for celebrant lookup.');
    return { birthdays, anniversaries };
  }

  birthdays = familyMembers.filter(
    (member: FamilyMember) =>
      member.birthDate &&
      dayjs(member.birthDate).month() === currentMonth
  );

  anniversaries = familyMembers.filter(
    (member) =>
      member.weddingDate &&
      dayjs(member.weddingDate).month() === currentMonth
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
};

export const readCompaniesFromCSV = (filePath: string): Promise<Company[]> => {
  try {
    return new Promise((resolve, reject) => {
      const companies: Company[] = [];
      fs.createReadStream(path.resolve(__dirname, filePath))
      .pipe(csvParser())
      .on('data', (data: any) => {
        companies.push({
          id: data.id,
          companyName: data.company_name,
          companyNumber: data.company_number,
          companyType: data.company_type,
          incorporationDate: new Date(data.incorporation_date),
          companyStatus: data.company_status,
          registeredAddress: data.registered_address,
          accountsDueDate: new Date(data.accounts_due_date),
          accountsNextDueDate: new Date(data.accounts_next_due_date),
          accountsLastMadeUpDate: new Date(data.accounts_last_made_up_date),
          returnsDueDate: new Date(data.returns_due_date),
          returnsNextDueDate: new Date(data.returns_next_due_date),
          returnsLastMadeUpDate: new Date(data.returns_last_made_up_date),
        });
      })
      .on('end', () => {
        resolve(companies);
      })
      .on('error', (error) => {
        reject(error);
      });
    });
  }  catch (error) {
    console.error(`Error reading companies from CSV: ${error}`);
    throw error;
  }
}

export const readCompanyOfficersFromCSV = (filePath: string): Promise<CompanyOfficer[]> => {
  try {
    return new Promise((resolve, reject) => {
      const companyOfficers: CompanyOfficer[] = [];
      fs.createReadStream(path.resolve(__dirname, filePath))
        .pipe(csvParser())
        .on('data', (data: any) => {
          companyOfficers.push({
            id: data.id,
            firstname: data.firstname,
            lastname: data.lastname,
            mobileNo: data.mobileNo,
            email: data.email,
          });
        })
        .on('end', () => {
          resolve(companyOfficers);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  } catch (error) {
    console.error(`Error reading company officers from CSV: ${error}`);
    throw error;
  }
}

export const getUpcomingEvents = (companies: Company[]): Promise<CompaniesWithEvents> => {
  const thirtyDaysTime = dayjs().add(30, 'day');

  let accountsDue: Company[] = [];
  let returnsDue: Company[] = [];

  if (!companies || companies.length === 0) {
    console.warn('No companies have upcoming.');
    return new Promise((resolve, reject) => resolve({ accountsDue, returnsDue }));
  }

  accountsDue = companies.filter(
    (company: Company) =>
      company.accountsDueDate &&
        dayjs(company.accountsDueDate).format('YYYY-MM-DD') === thirtyDaysTime.format('YYYY-MM-DD')
  );

  returnsDue = companies.filter(
    (company: Company) =>
      company.returnsDueDate &&
        company.returnsDueDate &&
          dayjs(company.returnsDueDate).format('YYYY-MM-DD') === thirtyDaysTime.format('YYYY-MM-DD')
  );

  return new Promise((resolve, reject) => resolve({ accountsDue, returnsDue }));
}

export const sendCompanyEventReminderEmails = async (
  companyOfficers: CompanyOfficer[],
  accountsDue: Company[],
  returnsDue: Company[]
) : Promise<void> => {
  if (accountsDue.length === 0 && returnsDue.length === 0) {
    console.log("No upcoming company events to notify today.");
    return;
  }

  if (companyOfficers.length === 0) {
    console.log('No company officers found to send reminders.');
    return;
  }

  for (const companyOfficer of companyOfficers) {
    const accountsDueCompanies: string = accountsDue.map(
      (accountsDueCo: Company) => `${accountsDueCo.companyName}(${accountsDueCo.companyNumber})`
    ).join(', ') || 'None';

    const returnsDueCompanies: string = returnsDue.map(
      (returnsDueCo: Company) => `${returnsDueCo.companyName}(${returnsDueCo.companyNumber})`
    ).join(', ') || 'None';

    const emailMessage = COMPANY_EVENT_REMINDER_EMAIL_MESSAGE
      .replace('[[RECIPIENT_FIRSTNAME]]', companyOfficer.firstname)
      .replace('[[ACCOUNT_DUE_COMPANIES]]', accountsDueCompanies)
      .replace('[[RETURNS_DUE_COMPANIES]]', returnsDueCompanies)
      .replace('[[APP_NAME]]', process.env.APP_NAME || 'Event Announcer');

    try {
      await sendEmail(companyOfficer.email, "Upcoming Company event Reminder 🗣️", emailMessage);
      console.log(`Company event reminder email sent to ${companyOfficer.firstname} (${companyOfficer.email})`);
    } catch (error) {
      console.error(`Failed to send reminder email to ${companyOfficer.firstname} (${companyOfficer.email}):`, error);
    }
  }
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
