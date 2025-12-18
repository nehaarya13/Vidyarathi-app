const cron = require('node-cron');
const axios = require('axios');

// Example reminder function
const sendReminder = (user) => {
  console.log(`Reminder sent to ${user.name} at ${new Date().toLocaleTimeString()}`);
  // Optional: call push notification service or email
};

// Schedule reminders: 9AM & 5PM daily
cron.schedule('0 9 * * *', () => sendReminder({ name: 'Neha' }));
cron.schedule('0 17 * * *', () => sendReminder({ name: 'Neha' }));

console.log('Reminder scheduler running...');
