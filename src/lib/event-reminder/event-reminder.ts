import nodeCron from 'node-cron';
import {
  readRecipientsFromCSV,
  readFamilyMembersFromCSV,
  getTodayCelebrants,
  sendCelebrantReminderEmails
} from "./message-sender";


const chalk = require('chalk')
const ora = require('ora')


async function sendMessages() {
  console.log();
  // console.log(chalk.green("Running scheduled job"));
  console.log("Running scheduled job");

  // Launch a loading spinner with an appropriate message on the terminal
  // const spinner = ora({
  //   text: "Launching event announcer... ",
  //   color: "blue",
  //   hideCursor: false,
  // }).start();
  
  
  try {
    console.log();

    // spinner.text = "Reading recipients from CSV file... ";
    // spinner.render();
    const recipients = await readRecipientsFromCSV('data/recipients.csv');
    // spinner.succeed(`Fetched ${recipients.length} recipients successfully.`);
    // console.log(chalk.blue.bold(`Recipients: ${recipients.map((r) => r.firstname).join(', ')}`));
    console.log(`Recipients: ${recipients.map((r) => r.firstname).join(', ')}`);
    console.log();

    // spinner.text = "Reading celebrants from CSV file... ";
    // spinner.render();
    const familyMembers = await readFamilyMembersFromCSV('data/family_members.csv');
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);
    // spinner.succeed(`Fetched ${birthdays.length + anniversaries.length} celebrants successfully.`);
    // console.log(chalk.cyanBright.bold('Today\'s Birthdays:', birthdays.map((b) => `${b.firstname} ${b.lastname}`)));
    // console.log(chalk.cyanBright.bold('Today\'s Anniversaries:', anniversaries.map((a) => `${a.firstname} ${a.lastname}`)));
    console.log('Today\'s Birthdays:', birthdays.map((b) => `${b.firstname} ${b.lastname}`));
    console.log('Today\'s Anniversaries:', anniversaries.map((a) => `${a.firstname} ${a.lastname}`));
    console.log();

    await sendCelebrantReminderEmails(recipients, birthdays, anniversaries);
    
    // console.log(
    //   chalk.yellow.bold(`ALL DONE at : `),
    //   chalk.blue.bold(`${new Date().toISOString()}`)
    // );

  } catch (error) {
    // spinner.fail({ text: "Sending Message failed" });
    // spinner.clear();
    console.log(error);
  }
};

const job = nodeCron.schedule("* * * * *", sendMessages);
