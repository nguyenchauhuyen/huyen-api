module.exports = ({ env }) => ({
  "defaultConnection": "default",
  "connections": {
    "default": {
      "connector": "mongoose",
      "settings": {
        "uri": env("DB_URI", "")
      },
      "options": {
        ssl: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        minPoolSize: 2,
      }
    }
  }
});
