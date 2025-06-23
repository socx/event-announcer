// Define the messages to be sent
export const ANNIVERSARY_REMINDER_EMAIL_MESSAGE = `<div>
  <h1>ANNIVERSARY REMINDER 🎊</h1>
  <p>Hi [[RECIPIENT_FIRSTNAME]], 👋🏽</p>
  <p>This is a friendly wedding anniversary reminder.</p>
  <p>Today, <b>[[ANNIVERSARY_DATE]]</b> is <b><i>[[ANNIVERSARY_CELEBRANT]]'s</i></b> wedding anniversary!🎊</p>
  <p>Best regards,</p>
  <p>[[APP_NAME]] Team</p>
</div>`;

export const BIRTHDAY_REMINDER_EMAIL_MESSAGE = `<div>
  <h1>BIRTHDAY REMINDER 🎉</h1>
  <p>Hi [[RECIPIENT_FIRSTNAME]], 👋🏽</p>
  <p>This is a friendly birthday reminder.</p>
  <p>Today, <b>[[BIRTH_DATE]]</b> is <b><i>[[BIRTH_DAY_CELEBRANT]]'s</i></b> birthday!🎉</p>
  <p>Best regards,</p>
  <p>[[APP_NAME]] Team</p>
</div>`;
