module.exports = ({ env }) => ({
  // ...
  email: {
    provider: "sendgrid",
    providerOptions: {
      apiKey: env('SENDGRID_API_KEY')
    },
    settings: {
      defaultFrom: "admin@simdep4g.com",
      // defaultReplyTo: "nguyenchauhuyen@gmail.com",
    }
  }
  // ...
});
