module.exports = ({ env }) => ({
  "defaultConnection": "default",
  "connections": {
    "default": {
      "connector": "mongoose",
      "settings": {
        "uri": env("DB_URI", "")
      },
      "options": {
        "ssl": true
      }
    }
  }
});
