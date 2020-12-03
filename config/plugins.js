module.exports = ({ env }) => ({
  // ...
  email: {
    provider: "amazon-ses",
    providerOptions: {
      key: 'AKIA6P7QHXWWJRXPSFG2',
      secret: "BIQxmNFs90gu5eDShuGzCWmlvzOASGGE2xHmmyChLtzg",
      amazon: "https://email-smtp.us-east-2.amazonaws.com"
    },
    settings: {
      defaultFrom: "noreply@simdep4g.com",
      defaultReplyTo: "nguyenchauhuyen@gmail.com"
    }
  }
  // ...
});
