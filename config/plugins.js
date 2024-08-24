module.exports = ({ env }) => ({
  // ...
  email: {
    provider: "sendgrid",
    providerOptions: {
      apiKey: env('SENDGRID_API_KEY')
    },
    settings: {
      defaultFrom: env('BOOKING_EMAIL_TO'),
      // defaultReplyTo: "nguyenchauhuyen@gmail.com",
    }
  }
  // ...
});
