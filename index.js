/**
 * This script reads a list of recipients from a CSV file and sends them a birthday notice message.
 * It uses node-cron to schedule the job to run every minute.
 * The recipients' first names are extracted from the CSV file.
 */

// TODO: for wedding anniversaries, check if celebrants are spouses, then send a single message with both names


import chalk from 'chalk';
import nodeCron from 'node-cron';
import ora from 'ora';
import fs from 'fs';
import csvParser from 'csv-parser';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';


dotenv.config();

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';


// Enable advanced formatting for dayjs
dayjs.extend(advancedFormat);

// Define the messages to be sent
const ANNIVERSARY_NOTICE_MESSAGE = `<div>
  <h1>ANNIVERSARY REMINDER 🎊</h1>
  <p>Hi [[RECIPIENT_FIRSTNAME]], 👋🏽</p>
  <p>This is a friendly wedding anniversary reminder.</p>
  <p>Today, <b>[[ANNIVERSARY_DATE]]</b> is <b><i>[[ANNIVERSARY_CELEBRANT]]'s</i></b> wedding anniversary!🎊</p>
  <p>Best regards,</p>
  <p>[[APP_NAME]] Team</p>
</div>`;
const BIRTHDAY_NOTICE_MESSAGE = `<div>
  <h1>BIRTHDAY REMINDER 🎉</h1>
  <p>Hi [[RECIPIENT_FIRSTNAME]], 👋🏽</p>
  <p>This is a friendly birthday reminder.</p>
  <p>Today, <b>[[BIRTH_DATE]]</b> is <b><i>[[BIRTH_DAY_CELEBRANT]]'s</i></b> birthday!🎉</p>
  <p>Best regards,</p>
  <p>[[APP_NAME]] Team</p>
</div>`;

// Function to read family members data from CSV
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

// Function to read recipients data from CSV
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


    for (const recipient of recipients) {
      for (const birthdayCelebrant of birthdayCelebrants) {
        spinner.text = `Sending message to ${recipient.firstname} about ${birthdayCelebrant.firstname} ${birthdayCelebrant.lastname}... `;
        spinner.render();

        const birthDayMessage = BIRTHDAY_NOTICE_MESSAGE.replace('[[RECIPIENT_FIRSTNAME]]', recipient.firstname)
          .replace('[[BIRTH_DAY_CELEBRANT]]', `${birthdayCelebrant.firstname} ${birthdayCelebrant.lastname}`)
          .replace('[[BIRTH_DATE]]', `${dayjs(birthdayCelebrant.birthDate).format('dddd, Do MMMM')}`)
          .replace('[[APP_NAME]]', `${process.env.APP_NAME || 'Event Announcer'}`);
        
        await sendEmail(recipient.email, "Birthday Reminder", birthDayMessage);

        console.log(chalk.green(`Birthday reminder sent: ${birthDayMessage}`));
       
        spinner.succeed(`Message(s) sent successfully to ${recipient.firstname} in ${Date.now() - date}ms`);
      }

      for (const anniversaryCelebrant of anniversaryCelebrants) {
        spinner.text = `Sending message to ${recipient.firstname} about ${anniversaryCelebrant.firstname} ${anniversaryCelebrant.lastname}... `;
        spinner.render();
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const anniversaryMessage = ANNIVERSARY_NOTICE_MESSAGE.replace('[[RECIPIENT_FIRSTNAME]]', recipient.firstname)
          .replace('[[ANNIVERSARY_CELEBRANT]]', `${anniversaryCelebrant.firstname} ${anniversaryCelebrant.lastname}`)
          .replace('[[ANNIVERSARY_DATE]]', `${dayjs(anniversaryCelebrant.weddingDate).format('dddd, Do MMMM')}`);
        
        await sendEmail(recipient.email, "Wedding Anniversary Reminder", anniversaryMessage);
        console.log(chalk.green(`Wedding anniversary reminder sent: ${anniversaryMessage}`));
       
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
// const job = nodeCron.schedule("*/1 * * * *", sendMessages);
const job = nodeCron.schedule("0 2 * * *", sendMessages);
