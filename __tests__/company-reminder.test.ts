import { jest } from '@jest/globals';
import { sendReminders } from '../src/lib/event-reminder/company-reminder';
import {
  readCompaniesFromCSV,
  readCompanyOfficersFromCSV,
  getUpcomingEvents,
  sendCompanyEventReminderEmails,
  Company,
  CompanyOfficer,
} from '../src/lib/event-reminder/message-sender';

jest.mock('../src/lib/event-reminder/message-sender', () => ({
  readCompaniesFromCSV: jest.fn(),
  readCompanyOfficersFromCSV: jest.fn(),
  getUpcomingEvents: jest.fn(),
  sendCompanyEventReminderEmails: jest.fn(),
}));

describe('sendReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log and send reminders successfully', async () => {
    // Mock data
    const mockCompanyOfficers: CompanyOfficer[] = [
      { id: '1', firstname: 'John', lastname: 'Doe', mobileNo: '12345678901', email: 'john.doe@example.com' },
      { id: '2', firstname: 'Jane', lastname: 'Smith', mobileNo: '12345678902', email: 'jane.smith@example.com' },
    ];
    const mockCompanies : Company[] = [
      { 
        id: '1', 
        companyName: 'ABC Ltd', 
        companyNumber: '12345', 
        companyType: 'Private', 
        incorporationDate: new Date('2020-01-01'), 
        companyStatus: 'Active', 
        accountsDueDate: new Date('2025-07-30'), 
        returnsDueDate: new Date('2025-08-15'),
        registeredAddress: '123 ABC Street',
        accountsNextDueDate: new Date('2025-07-30'),
        accountsLastMadeUpDate: new Date('2024-07-30'),
        returnsNextDueDate: new Date('2025-08-15'),
        returnsLastMadeUpDate: new Date('2024-08-15'),
      },
      { 
        id: '2', 
        companyName: 'XYZ Ltd', 
        companyNumber: '67890', 
        companyType: 'Public', 
        incorporationDate: new Date('2019-05-15'), 
        companyStatus: 'Active', 
        accountsDueDate: new Date('2025-07-25'), 
        returnsDueDate: new Date('2025-08-10'),
        registeredAddress: '456 XYZ Avenue',
        accountsNextDueDate: new Date('2025-07-25'),
        accountsLastMadeUpDate: new Date('2024-07-25'),
        returnsNextDueDate: new Date('2025-08-10'),
        returnsLastMadeUpDate: new Date('2024-08-10'),
      },
    ];
    const mockUpcomingEvents = {
      accountsDue: [
        { companyName: 'ABC Ltd', companyNumber: '12345' },
        { companyName: 'XYZ Ltd', companyNumber: '67890' },
      ],
      returnsDue: [
        { companyName: 'XYZ Ltd', companyNumber: '67890' },
      ],
    };

    // Mock implementations
    (readCompanyOfficersFromCSV as jest.MockedFunction<typeof readCompanyOfficersFromCSV>).mockResolvedValue(mockCompanyOfficers);
    (readCompaniesFromCSV as jest.MockedFunction<typeof readCompaniesFromCSV>).mockResolvedValue(mockCompanies);
    (getUpcomingEvents as jest.Mock).mockReturnValue(mockUpcomingEvents);
    (sendCompanyEventReminderEmails as jest.MockedFunction<typeof sendCompanyEventReminderEmails>).mockResolvedValue(undefined);

    // Spy on console.log
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Call the function
    await sendReminders();

    // Assertions
    expect(readCompanyOfficersFromCSV).toHaveBeenCalledWith('data/company-officers.csv');
    expect(readCompaniesFromCSV).toHaveBeenCalledWith('data/companies.csv');
    expect(getUpcomingEvents).toHaveBeenCalledWith(mockCompanies);
    expect(sendCompanyEventReminderEmails).toHaveBeenCalledWith(
      mockCompanyOfficers,
      mockUpcomingEvents.accountsDue,
      mockUpcomingEvents.returnsDue
    );

    // Check console logs
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Running scheduled job at'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Recipients: John, Jane'));
    // expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Upcoming Due Accounts: ABC Ltd(12345), XYZ Ltd(67890)'));
    // expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Upcoming Due Returns: XYZ Ltd(67890)'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ALL DONE at'));

    // Restore console.log
    consoleLogSpy.mockRestore();
  });

  it('should handle errors gracefully', async () => {
    // Mock an error
    const mockError: Error = new Error('Test error');
    (readCompanyOfficersFromCSV as jest.MockedFunction<typeof readCompanyOfficersFromCSV>).mockRejectedValue(mockError);

    // Spy on console.log
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Call the function
    await sendReminders();

    // Assertions
    expect(readCompanyOfficersFromCSV).toHaveBeenCalledWith('data/company-officers.csv');
    expect(consoleLogSpy).toHaveBeenCalledWith('Sending Message failed');
    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);

    // Restore console.log
    consoleLogSpy.mockRestore();
  });
});
