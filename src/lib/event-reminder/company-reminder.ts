import nodeCron from 'node-cron';
import {
  readCompaniesFromCSV,
  readCompanyOfficersFromCSV,
  getUpcomingEvents,
  sendCompanyEventReminderEmails
} from "./message-sender";


export async function sendReminders(): Promise<void> {
  console.log(`Running scheduled job at : ${new Date().toISOString()}`);
  
  try {
    const companyOfficers = await readCompanyOfficersFromCSV('data/company-officers.csv');
    console.log(`Recipients: ${companyOfficers.map((r) => r.firstname).join(', ')}`);

    const companies = await readCompaniesFromCSV('data/companies.csv');
    const { accountsDue, returnsDue } = await getUpcomingEvents(companies);
    console.log(`Upcoming Due Accounts: ${accountsDue.map((company) => company.companyName + ' - ' + company.companyNumber)}`);
    console.log(`Upcoming Due Returns: ${returnsDue.map((company) => company.companyName + ' - ' + company.companyNumber)}`);

    await sendCompanyEventReminderEmails(companyOfficers, accountsDue, returnsDue);
    console.log(`ALL DONE at : ${new Date().toISOString()}`);

  } catch (error) {
    console.log('Sending Message failed');
    console.log(error);
  }
};

const job = nodeCron.schedule("* * * * *", sendReminders);
