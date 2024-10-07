module.exports = ({ env }) => ({
  // ...
  email: {
    provider: "mailgun",
    providerOptions: {
      apiKey: env('MAILGUN_API_KEY'),
      domain: env('MAILGUN_DOMAIN'), // Required
      host: env('MAILGUN_HOST', 'api.mailgun.net'),
    },
    settings: {
      defaultFrom: env('BOOKING_EMAIL_TO'),
      // defaultReplyTo: "nguyenchauhuyen@gmail.com",
    }
  }
  // ...
});
