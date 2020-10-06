module.exports = ({ env }) => ({
  "defaultConnection": "default",
  "connections": {
    "default": {
      "connector": "mongoose",
      "settings": {
        "uri": "mongodb+srv://huyensim:S6WMcslBxWooJIPR@cluster0.o6qt3.mongodb.net/db"
      },
      "options": {
        "ssl": true
      }
    }
  }
});
