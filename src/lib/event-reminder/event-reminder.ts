import nodeCron from 'node-cron';
import {
  readRecipientsFromCSV,
  readFamilyMembersFromCSV,
  getTodayCelebrants,
  sendCelebrantReminderEmails
} from "./message-sender";


export async function sendMessages() {
  console.log("Running scheduled job");
  
  try {
    const recipients = await readRecipientsFromCSV('data/recipients.csv');
    console.log(`Recipients: ${recipients.map((r) => r.firstname).join(', ')}`);
    
    const familyMembers = await readFamilyMembersFromCSV('data/family_members.csv');
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);
    console.log(`Today\'s Birthdays: ${birthdays.map((b) => b.firstname + ' ' + b.lastname)}`);
    console.log(`Today\'s Anniversaries: ${anniversaries.map((a) => a.firstname + ' ' + a.lastname)}`);
    
    await sendCelebrantReminderEmails(recipients, birthdays, anniversaries);
    console.log(`ALL DONE at : ${new Date().toISOString()}`);
    
  } catch (error) {
    console.log("Sending Message failed");
    console.log(error);
  }
};

const job = nodeCron.schedule("* * * * *", sendMessages);
