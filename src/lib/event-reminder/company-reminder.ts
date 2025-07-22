import nodeCron from 'node-cron';
import {
  readCompaniesFromCSV,
  readCompanyOfficersFromCSV,
  getUpcomingEvents,
  sendCompanyEventReminderEmails
} from "./message-sender";


async function sendReminders() {
  console.log();
  console.log(`Running scheduled job at : ${new Date().toISOString()}`);
  
  try {
    console.log();
    const companyOfficers = await readCompanyOfficersFromCSV('data/company-officers.csv');
    console.log(`Recipients: ${companyOfficers.map((r) => r.firstname).join(', ')}`);
    console.log();
    
    const companies = await readCompaniesFromCSV('data/companies.csv');
    const { accountsDue, returnsDue } = getUpcomingEvents(companies);
    console.log('Upcoming Due Accounts:', accountsDue.map((company) => `${company.companyName}(${company.companyNumber})`));
    console.log('Upcoming Due Returns:', returnsDue.map((company) => `${company.companyName}(${company.companyNumber})`));
    console.log();

    await sendCompanyEventReminderEmails(companyOfficers, accountsDue, returnsDue);
    console.log(`ALL DONE at : ${new Date().toISOString()}`);

  } catch (error) {
    console.log('Sending Message failed');
    console.log(error);
  }
};

const job = nodeCron.schedule("* * * * *", sendReminders);
