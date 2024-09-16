require("dotenv").config();
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Disable sandbox mode (set it to false)
sgMail.setSandboxMode(false);

const msg = {
  to: "kuba.piskorz@gmail.com",
  from: process.env.SENDGRID_SENDER_EMAIL,
  subject: "Test email from SendGrid",
  text: "This is a test email sent from SendGrid!",
  html: "<strong>This is a test email sent from SendGrid!</strong>",
};

sgMail
  .send(msg)
  .then(() => {
    console.log("Test email sent successfully!");
  })
  .catch((error) => {
    console.error("Error sending email:", error);
  });

console.log("SENDGRID_API_KEY:", process.env.SENDGRID_API_KEY);
