require("dotenv").config();
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: "kuba.piskorz@gmail.com",
  from: "kuba.piskorz@gmail.com",
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
