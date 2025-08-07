import { jest } from '@jest/globals';
import { printMonthCelebrants, sendMessages } from '../src/lib/event-reminder/event-reminder';
import {
  readRecipientsFromCSV,
  readFamilyMembersFromCSV,
  getTodayCelebrants,
  getMonthCelebrants,
  sendCelebrantReminderEmails,
  FamilyMember,
  Recipient,
  Celebrants,
} from '../src/lib/event-reminder/message-sender';

jest.mock('../src/lib/event-reminder/message-sender', () => ({
  readRecipientsFromCSV: jest.fn(),
  readFamilyMembersFromCSV: jest.fn(),
  getTodayCelebrants: jest.fn(),
  sendCelebrantReminderEmails: jest.fn(),
}));

describe('sendMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log and send reminders successfully', async () => {
    // Mock data
    const mockRecipients: Recipient[] = [
      { id: '1', firstname: 'John', lastname: 'Doe', mobileNo: '12345678901', email: 'john.doe@example.com', familyId: '1' },
      { id: '2', firstname: 'Jane', lastname: 'Smith', mobileNo: '12345678902', email: 'jane.smith@example.com', familyId: '2' },
    ];
    const mockFamilyMembers : FamilyMember[] = [
      { 
        id: '1', 
        firstname: 'Nick', 
        middlename: 'Chris', 
        lastname: 'Slater', 
        gender: 'Active', 
        parents: ['4', '5'], 
        birthDate: new Date('2020-01-01'), 
        weddingDate: new Date('2025-07-30'), 
        deathDate: new Date('2025-08-15'),
        spouses: ['2'], 
      },
      { 
        id: '2', 
        firstname: 'Debbie', 
        middlename: 'Soibhan', 
        lastname: 'Bailey', 
        gender: 'Active', 
        parents: ['6', '7'], 
        birthDate: new Date('2020-01-01'), 
        weddingDate: new Date('2025-07-30'), 
        deathDate: new Date('2025-08-15'),
        spouses: ['1'], 
      },
    ];
    const mockTodayCelebrants = {
      birthdays: [
        { 
          id: '9', 
          firstname: 'Mark', 
          middlename: 'Dave', 
          lastname: 'Sinner', 
          gender: 'Active', 
          parents: ['4', '5'], 
          birthDate: new Date('2020-01-01'), 
          weddingDate: new Date('2025-07-30'), 
          deathDate: new Date('2025-08-15'),
          spouses: ['10'], 
        }
      ],
      anniversaries: [
        { 
          id: '9', 
          firstname: 'Peter', 
          middlename: 'Parker', 
          lastname: 'Pan', 
          gender: 'Active', 
          parents: ['6', '7'], 
          birthDate: new Date('2020-01-01'), 
          weddingDate: new Date('2025-07-30'), 
          deathDate: new Date('2025-08-15'),
          spouses: ['12'], 
        },
      ],
    };

    // Mock implementations
    (readFamilyMembersFromCSV as jest.MockedFunction<typeof readFamilyMembersFromCSV>).mockResolvedValue(mockFamilyMembers);
    (readRecipientsFromCSV as jest.MockedFunction<typeof readRecipientsFromCSV>).mockResolvedValue(mockRecipients);
    (getTodayCelebrants as jest.Mock).mockReturnValue(mockTodayCelebrants);
    (sendCelebrantReminderEmails as jest.MockedFunction<typeof sendCelebrantReminderEmails>).mockResolvedValue(undefined);

    // Spy on console.log
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Call the function
    await sendMessages();

    // Assertions
    expect(readFamilyMembersFromCSV).toHaveBeenCalledWith('data/family_members.csv');
    expect(readRecipientsFromCSV).toHaveBeenCalledWith('data/recipients.csv');
    expect(getTodayCelebrants).toHaveBeenCalledWith(mockFamilyMembers);
    expect(sendCelebrantReminderEmails).toHaveBeenCalledWith(
      mockRecipients,
      mockTodayCelebrants.birthdays,
      mockTodayCelebrants.anniversaries
    );

    // Check console logs
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Running scheduled job'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Recipients: John, Jane'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Today\'s Birthdays: Mark Sinner'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Today\'s Anniversaries: Peter Pan'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('ALL DONE at'));

    // Restore console.log
    consoleLogSpy.mockRestore();
  });

  it('should handle errors gracefully', async () => {
    // Mock an error
    const mockError: Error = new Error('Test error');
    (readRecipientsFromCSV as jest.MockedFunction<typeof readRecipientsFromCSV>).mockRejectedValue(mockError);

    // Spy on console.log
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Call the function
    await sendMessages();

    // Assertions
    expect(readRecipientsFromCSV).toHaveBeenCalledWith('data/recipients.csv');
    expect(consoleLogSpy).toHaveBeenCalledWith('Sending Message failed');
    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);

    // Restore console.log
    consoleLogSpy.mockRestore();
  });
});

describe('printMonthCelebrants', () => {

  jest.mock('../src/lib/event-reminder/message-sender', () => ({
    readFamilyMembersFromCSV: jest.fn(),
    getMonthCelebrants: jest.fn(),
  }));

  const mockFamilyMembers : FamilyMember[] = [
    { 
      id: '1', 
      firstname: 'John', 
      middlename: 'Dave', 
      lastname: 'Doe', 
      gender: 'Active', 
      parents: ['4', '5'], 
      birthDate: new Date('2020-04-01'), 
      weddingDate: new Date('2025-07-30'), 
      deathDate: new Date('2025-08-15'),
      spouses: ['2'], 
    },
    { 
      id: '2', 
      firstname: 'Jane', 
      middlename: 'Parker', 
      lastname: 'Smith', 
      gender: 'Active', 
      parents: ['6', '7'], 
      birthDate: new Date('2020-01-01'), 
      weddingDate: new Date('2025-07-30'), 
      deathDate: new Date('2025-08-15'),
      spouses: ['1'], 
    },
  ];
  const mockCelebrants = {
    birthdays: [
      { 
        id: '9', 
        firstname: 'John', 
        middlename: 'Dave', 
        lastname: 'Doe', 
        gender: 'Active', 
        parents: ['4', '5'], 
        birthDate: new Date(`${new Date().getFullYear()}-${new Date().getMonth()}-01`), 
        weddingDate: new Date(`${new Date().getFullYear()}-${new Date().getMonth()}-01`), 
        deathDate: new Date('2025-08-15'),
        spouses: ['10'], 
      }
    ],
    anniversaries: [
      { 
        id: '9', 
        firstname: 'Jane', 
        middlename: 'Parker', 
        lastname: 'Smith', 
        gender: 'Active', 
        parents: ['6', '7'], 
        birthDate: new Date(`${new Date().getFullYear()}-${new Date().getMonth()}-01`), 
        weddingDate: new Date(`${new Date().getFullYear()}-${new Date().getMonth()}-01`),
        deathDate: new Date('2025-08-15'),
        spouses: ['12'], 
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // it('should log month celebrants successfully', async () => {
  //   (readFamilyMembersFromCSV as jest.MockedFunction<typeof readFamilyMembersFromCSV>).mockResolvedValue(mockFamilyMembers);
  //   (getMonthCelebrants as jest.Mock).mockReturnValue(mockCelebrants);

  //   const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  //   await printMonthCelebrants();

  //   expect(readFamilyMembersFromCSV).toHaveBeenCalledWith('data/family_members.csv');
  //   expect(getMonthCelebrants).toHaveBeenCalledWith(mockFamilyMembers);

  //   expect(consoleLogSpy).toHaveBeenCalledWith(
  //     `This Month\'s Birthdays: John Doe`
  //   );
  //   expect(consoleLogSpy).toHaveBeenCalledWith(
  //     `This Month\'s Anniversaries: Jane Smith`
  //   );

  //   consoleLogSpy.mockRestore();
  // });

  // it('should log empty lists when there are no celebrants', async () => {
  //   (readFamilyMembersFromCSV as jest.MockedFunction<typeof readFamilyMembersFromCSV>).mockResolvedValue([]);
  //   (getMonthCelebrants as jest.Mock).mockReturnValue({ birthdays: [], anniversaries: [] });

  //   const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  //   await printMonthCelebrants();

  //   expect(readFamilyMembersFromCSV).toHaveBeenCalledWith('data/family_members.csv');
  //   expect(getMonthCelebrants).toHaveBeenCalledWith([]);

  //   expect(consoleLogSpy).toHaveBeenCalledWith(`This Month's Birthdays: `);
  //   expect(consoleLogSpy).toHaveBeenCalledWith(`This Month's Anniversaries: `);

  //   consoleLogSpy.mockRestore();
  // });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Test error');
    (readFamilyMembersFromCSV as jest.MockedFunction<typeof readFamilyMembersFromCSV>).mockRejectedValue(mockError);

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await printMonthCelebrants();

    expect(readFamilyMembersFromCSV).toHaveBeenCalledWith('data/family_members.csv');
    expect(consoleLogSpy).toHaveBeenCalledWith('Sending Message failed');
    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);

    consoleLogSpy.mockRestore();
  });
});
