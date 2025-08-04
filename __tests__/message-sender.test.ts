import {
  Company,
  FamilyMember,
  getMonthCelebrants,
  getTodayCelebrants,
  getUpcomingEvents,
  sendEmail,
} from '../src/lib/event-reminder/message-sender';
import dayjs from 'dayjs';
import nodemailer from 'nodemailer';

jest.mock('nodemailer');


describe('getMonthCelebrants', () => {
  it('should return empty arrays when no family members are provided', () => {
    const familyMembers: FamilyMember[] = [];
    const { birthdays, anniversaries } = getMonthCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual([]);
  });

  it('should return empty arrays when family members have no valid dates', () => {
    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: undefined, weddingDate: undefined, deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: undefined, weddingDate: undefined, deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getMonthCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual([]);
  });

  it('should return birthdays for the current month', () => {
    const today = new Date();
    const currentMonth = today.getMonth();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: new Date(today.getFullYear(), currentMonth, 15), weddingDate: undefined, deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: new Date(today.getFullYear(), currentMonth, 20), weddingDate: undefined, deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getMonthCelebrants(familyMembers);

    expect(birthdays).toEqual(familyMembers);
    expect(anniversaries).toEqual([]);
  });

  it('should return anniversaries for the current month', () => {
    const today = new Date();
    const currentMonth = today.getMonth();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: undefined, weddingDate: new Date(today.getFullYear(), currentMonth, 15), deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: undefined, weddingDate: new Date(today.getFullYear(), currentMonth, 20), deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getMonthCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual(familyMembers);
  });

  it('should return both birthdays and anniversaries for the current month', () => {
    const today = new Date();
    const currentMonth = today.getMonth();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: new Date(today.getFullYear(), currentMonth, 15), weddingDate: new Date(today.getFullYear(), currentMonth, 20), deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: new Date(today.getFullYear(), currentMonth, 10), weddingDate: new Date(today.getFullYear(), currentMonth, 25), deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getMonthCelebrants(familyMembers);

    expect(birthdays).toEqual(familyMembers);
    expect(anniversaries).toEqual(familyMembers);
  });

  it('should exclude birthdays and anniversaries outside the current month', () => {
    const today = new Date();
    const currentMonth = today.getMonth();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: new Date(today.getFullYear(), currentMonth - 1, 15), weddingDate: new Date(today.getFullYear(), currentMonth + 1, 20), deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: new Date(today.getFullYear(), currentMonth + 1, 10), weddingDate: new Date(today.getFullYear(), currentMonth - 1, 25), deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getMonthCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual([]);
  });
});

describe('getTodayCelebrants', () => {
  it('should return empty arrays when no family members are provided', () => {
    const familyMembers: FamilyMember[] = [];
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual([]);
  });

  it('should return empty arrays when family members have no valid dates', () => {
    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: undefined, weddingDate: undefined, deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: undefined, weddingDate: undefined, deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual([]);
  });

  it('should return birthdays for today', () => {
    const today = new Date();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: today, weddingDate: undefined, deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), weddingDate: undefined, deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);

    expect(birthdays).toEqual([
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: today, weddingDate: undefined, deathDate: undefined, spouses: [] },
    ]);
    expect(anniversaries).toEqual([]);
  });

  it('should return anniversaries for today', () => {
    const today = new Date();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: undefined, weddingDate: today, deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: undefined, weddingDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual([
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: undefined, weddingDate: today, deathDate: undefined, spouses: [] },
    ]);
  });

  it('should return both birthdays and anniversaries for today', () => {
    const today = new Date();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: today, weddingDate: today, deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), weddingDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);

    expect(birthdays).toEqual([
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: today, weddingDate: today, deathDate: undefined, spouses: [] },
    ]);
    expect(anniversaries).toEqual([
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: today, weddingDate: today, deathDate: undefined, spouses: [] },
    ]);
  });

  it('should exclude birthdays and anniversaries not matching today', () => {
    const today = new Date();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), weddingDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), weddingDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual([]);
  });
});

describe('getUpcomingEvents', () => {
  it('should return empty arrays when no companies are provided', async () => {
    const companies: Company[] = [];
    const { accountsDue, returnsDue } = await getUpcomingEvents(companies);

    expect(accountsDue).toEqual([]);
    expect(returnsDue).toEqual([]);
  });

  it('should return empty arrays when no companies have upcoming events', async () => {
    const companies: Company[] = [
      {
        id: '1',
        companyName: 'ABC Ltd',
        companyNumber: '12345',
        companyType: 'Private',
        incorporationDate: new Date('2020-01-01'),
        companyStatus: 'Active',
        registeredAddress: '123 ABC Street',
        accountsDueDate: new Date('2025-07-01'),
        accountsNextDueDate: new Date('2025-07-01'),
        accountsLastMadeUpDate: new Date('2024-07-01'),
        returnsDueDate: new Date('2025-08-01'),
        returnsNextDueDate: new Date('2025-08-01'),
        returnsLastMadeUpDate: new Date('2024-08-01'),
      },
    ];
    const { accountsDue, returnsDue } = await getUpcomingEvents(companies);

    expect(accountsDue).toEqual([]);
    expect(returnsDue).toEqual([]);
  });

  it('should return companies with accounts due in 30 days', async () => {
    const thirtyDaysFromNow = dayjs().add(30, 'day').toDate();

    const companies: Company[] = [
      {
        id: '1',
        companyName: 'ABC Ltd',
        companyNumber: '12345',
        companyType: 'Private',
        incorporationDate: new Date('2020-01-01'),
        companyStatus: 'Active',
        registeredAddress: '123 ABC Street',
        accountsDueDate: thirtyDaysFromNow,
        accountsNextDueDate: new Date('2025-07-01'),
        accountsLastMadeUpDate: new Date('2024-07-01'),
        returnsDueDate: new Date('2025-08-01'),
        returnsNextDueDate: new Date('2025-08-01'),
        returnsLastMadeUpDate: new Date('2024-08-01'),
      },
    ];
    const { accountsDue, returnsDue } = await getUpcomingEvents(companies);

    expect(accountsDue).toEqual([companies[0]]);
    expect(returnsDue).toEqual([]);
  });

  it('should return companies with returns due in 30 days', async () => {
    const thirtyDaysFromNow = dayjs().add(30, 'day').toDate();

    const companies: Company[] = [
      {
        id: '1',
        companyName: 'ABC Ltd',
        companyNumber: '12345',
        companyType: 'Private',
        incorporationDate: new Date('2020-01-01'),
        companyStatus: 'Active',
        registeredAddress: '123 ABC Street',
        accountsDueDate: new Date('2025-07-01'),
        accountsNextDueDate: new Date('2025-07-01'),
        accountsLastMadeUpDate: new Date('2024-07-01'),
        returnsDueDate: thirtyDaysFromNow,
        returnsNextDueDate: new Date('2025-08-01'),
        returnsLastMadeUpDate: new Date('2024-08-01'),
      },
    ];
    const { accountsDue, returnsDue } = await getUpcomingEvents(companies);

    expect(accountsDue).toEqual([]);
    expect(returnsDue).toEqual([companies[0]]);
  });

  it('should return companies with both accounts and returns due in 30 days', async () => {
    const thirtyDaysFromNow = dayjs().add(30, 'day').toDate();

    const companies: Company[] = [
      {
        id: '1',
        companyName: 'ABC Ltd',
        companyNumber: '12345',
        companyType: 'Private',
        incorporationDate: new Date('2020-01-01'),
        companyStatus: 'Active',
        registeredAddress: '123 ABC Street',
        accountsDueDate: thirtyDaysFromNow,
        accountsNextDueDate: new Date('2025-07-01'),
        accountsLastMadeUpDate: new Date('2024-07-01'),
        returnsDueDate: thirtyDaysFromNow,
        returnsNextDueDate: new Date('2025-08-01'),
        returnsLastMadeUpDate: new Date('2024-08-01'),
      },
    ];
    const { accountsDue, returnsDue } = await getUpcomingEvents(companies);

    expect(accountsDue).toEqual([companies[0]]);
    expect(returnsDue).toEqual([companies[0]]);
  });

  it('should exclude companies with accounts or returns due outside 30 days', async () => {
    const thirtyDaysFromNow = dayjs().add(30, 'day').toDate();

    const companies: Company[] = [
      {
        id: '1',
        companyName: 'ABC Ltd',
        companyNumber: '12345',
        companyType: 'Private',
        incorporationDate: new Date('2020-01-01'),
        companyStatus: 'Active',
        registeredAddress: '123 ABC Street',
        accountsDueDate: new Date('2025-07-01'),
        accountsNextDueDate: new Date('2025-07-01'),
        accountsLastMadeUpDate: new Date('2024-07-01'),
        returnsDueDate: new Date('2025-08-01'),
        returnsNextDueDate: new Date('2025-08-01'),
        returnsLastMadeUpDate: new Date('2024-08-01'),
      },
      {
        id: '2',
        companyName: 'XYZ Ltd',
        companyNumber: '67890',
        companyType: 'Public',
        incorporationDate: new Date('2019-05-15'),
        companyStatus: 'Active',
        registeredAddress: '456 XYZ Avenue',
        accountsDueDate: thirtyDaysFromNow,
        accountsNextDueDate: new Date('2025-07-01'),
        accountsLastMadeUpDate: new Date('2024-07-01'),
        returnsDueDate: thirtyDaysFromNow,
        returnsNextDueDate: new Date('2025-08-01'),
        returnsLastMadeUpDate: new Date('2024-08-01'),
      },
    ];
    const { accountsDue, returnsDue } = await getUpcomingEvents(companies);

    expect(accountsDue).toEqual([companies[1]]);
    expect(returnsDue).toEqual([companies[1]]);
  });
});

describe('sendEmail', () => {
  const mockSendMail = jest.fn();
  const mockCreateTransport = nodemailer.createTransport as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateTransport.mockReturnValue({ sendMail: mockSendMail });
  });

  it('should send an email successfully', async () => {
    mockSendMail.mockResolvedValueOnce('Email sent');

    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASSWORD = 'password';
    process.env.APP_NAME = 'Event Announcer';

    await sendEmail('recipient@example.com', 'Test Subject', '<p>Test Body</p>');

    expect(mockCreateTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'user@example.com',
        pass: 'password',
      },
    });

    expect(mockSendMail).toHaveBeenCalledWith({
      from: '"Event Announcer" <user@example.com>',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Test Body</p>',
    });
  });

  it('should throw an error if environment variables are missing', async () => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;

    await expect(
      sendEmail('recipient@example.com', 'Test Subject', '<p>Test Body</p>')
    ).rejects.toThrow('Email configuration is not properly set in environment variables.');
  });

  it('should throw an error if "to" email address is invalid', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASSWORD = 'password';
    process.env.APP_NAME = 'Event Announcer';

    await expect(
      sendEmail('invalid-email', 'Test Subject', '<p>Test Body</p>')
    ).rejects.toThrow('Invalid email address: invalid-email');
  });

  it('should throw an error if "to", "subject", or "html" is missing', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASSWORD = 'password';
    process.env.APP_NAME = 'Event Announcer';

    await expect(sendEmail('', 'Test Subject', '<p>Test Body</p>')).rejects.toThrow(
      'Email parameters (to, subject, html) must be provided.'
    );

    await expect(sendEmail('recipient@example.com', '', '<p>Test Body</p>')).rejects.toThrow(
      'Email parameters (to, subject, html) must be provided.'
    );

    await expect(sendEmail('recipient@example.com', 'Test Subject', '')).rejects.toThrow(
      'Email parameters (to, subject, html) must be provided.'
    );
  });

  it('should throw an error if "subject" or "html" is not a string', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASSWORD = 'password';
    process.env.APP_NAME = 'Event Announcer';

    await expect(
      sendEmail('recipient@example.com', 123 as unknown as string, '<p>Test Body</p>')
    ).rejects.toThrow('Subject and HTML content must be strings.');

    await expect(
      sendEmail('recipient@example.com', 'Test Subject', 123 as unknown as string)
    ).rejects.toThrow('Subject and HTML content must be strings.');
  });

  it('should log an error if sending the email fails', async () => {
    mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASSWORD = 'password';
    process.env.APP_NAME = 'Event Announcer';

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await sendEmail('recipient@example.com', 'Test Subject', '<p>Test Body</p>');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error sending email to recipient@example.com: Error: SMTP error'
    );

    consoleErrorSpy.mockRestore();
  });
});