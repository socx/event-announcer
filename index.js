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
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';


// Enable advanced formatting for dayjs
dayjs.extend(advancedFormat);

// Define the messages to be sent
const BIRTHDAY_NOTICE_MESSAGE = `Hello [[RECIPIENT_FIRSTNAME]], tomorrow, [[BIRTH_DATE]] is [[BIRTH_DAY_CELEBRANT]]'s birthday!`;
const ANNIVERSARY_NOTICE_MESSAGE = `Hello [[RECIPIENT_FIRSTNAME]], tomorrow, [[ANNIVERSARY_DATE]] is [[ANNIVERSARY_CELEBRANT]]'s wedding anniversary!`;


// Function to read family members data from CSV
async function readFamilyMembersFromCSV(filePath) {
  const familyMembers = [];

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
            weddingDate: new Date(row.weddingDate),
            parent1: row.parent1,
            parent2: row.parent2,
            spouses: row.spouses,
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
    const tomorrow = dayjs().add(1, 'day').toDate();
    spinner.succeed(`Fetched ${familyMembers.length} family members successfully.`);

    const birthdayCelebrants = familyMembers.filter(
      (member) =>
        member.birthDate.getDate() === tomorrow.getDate() &&
        member.birthDate.getMonth() === tomorrow.getMonth()
    );

    const anniversaryCelebrants = familyMembers.filter(
      (member) =>
        member.weddingDate.getDate() === tomorrow.getDate() &&
        member.weddingDate.getMonth() === tomorrow.getMonth()
    );

    spinner.succeed(`Filtered ${anniversaryCelebrants.length} anniversaryCelebrants for tomorrow.`);
    console.log(chalk.blue.bold(`anniversary Celebrants: ${anniversaryCelebrants.map((c) => `${c.firstname} ${c.lastname}`).join(', ')}`));

    spinner.succeed(`Filtered ${birthdayCelebrants.length} birthdayCelebrants for tomorrow.`);
    console.log(chalk.blue.bold(`Birthday Celebrants: ${birthdayCelebrants.map((c) => `${c.firstname} ${c.lastname}`).join(', ')}`));
    console.log();

    // Read recipients from CSV file
    spinner.text = "Reading recipients from CSV file... ";
    spinner.render();
    const recipients = await readRecipientsFromCSV('./recipients.csv');
    spinner.succeed(`Fetched ${recipients.length} recipients successfully.`);
    console.log(chalk.blue.bold(`Recipients: ${recipients.map((r) => r.firstname).join(', ')}`));
    console.log();

    // Loop through the recipients and send messages
    for (const recipient of recipients) {
      // Send birthday notice message
      for (const birthdayCelebrant of birthdayCelebrants) {
        spinner.text = `Sending message to ${recipient.firstname} about ${birthdayCelebrant.firstname} ${birthdayCelebrant.lastname}... `;
        spinner.render();
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const birthDayMessage = BIRTHDAY_NOTICE_MESSAGE.replace('[[RECIPIENT_FIRSTNAME]]', recipient.firstname)
          .replace('[[BIRTH_DAY_CELEBRANT]]', `${birthdayCelebrant.firstname} ${birthdayCelebrant.lastname}`)
          .replace('[[BIRTH_DATE]]', `${dayjs(birthdayCelebrant.birthDate).format('Do MMM')}`);
        console.log(chalk.green(`Birthday reminder sent: ${birthDayMessage}`));
       
        spinner.succeed(`Message(s) sent successfully to ${recipient.firstname} in ${Date.now() - date}ms`);
      }

      // Send wedding anniversary notice message
      for (const anniversaryCelebrant of anniversaryCelebrants) {
        spinner.text = `Sending message to ${recipient.firstname} about ${anniversaryCelebrant.firstname} ${anniversaryCelebrant.lastname}... `;
        spinner.render();
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const anniversaryMessage = ANNIVERSARY_NOTICE_MESSAGE.replace('[[RECIPIENT_FIRSTNAME]]', recipient.firstname)
          .replace('[[ANNIVERSARY_CELEBRANT]]', `${anniversaryCelebrant.firstname} ${anniversaryCelebrant.lastname}`)
          .replace('[[ANNIVERSARY_DATE]]', `${dayjs(anniversaryCelebrant.weddingDate).format('Do MMM')}`);
        console.log(chalk.green(`Wedding anniversary reminder sent: ${anniversaryMessage}`));
       
        spinner.succeed(`Message(s) sent successfully to ${recipient.firstname} in ${Date.now() - date}ms`);
      }
    }
    
    console.log(
      chalk.yellow.bold(`ALL DONE at : `),
      chalk.blue.bold(`${new Date().toISOString()}`)
    );

  } catch (error) {
    // Print failed on the terminal if process is unsuccessful
    spinner.fail({ text: "Sending Message failed" });
    // Remove the spinner from the terminal
    spinner.clear();
    // Print the error message on the terminal
    console.log(error);
  }
};

// Schedule a job to run every two minutes
const job = nodeCron.schedule("*/1 * * * *", sendMessages);
