import nodemailer from 'nodemailer';

const account = await nodemailer.createTestAccount();

console.log('\nEthereal account created:\n');

console.log(`User: ${account.user}`);
console.log(`Password: ${account.pass}`);
console.log(`SMTP Host: ${account.smtp.host}`);
console.log(`SMTP Port: ${account.smtp.port}`);
console.log(`Web: ${account.web}`);

console.log('\nSave these credentials in your .env file.');