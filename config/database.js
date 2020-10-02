module.exports = ({ env }) => ({
  "defaultConnection": "default",
  "connections": {
    "default": {
      "connector": "mongoose",
      "settings": {
        "uri": "mongodb+srv://huyensim:euuAms38ObPYazg8@cluster0.1idcq.mongodb.net/db"
      },
      "options": {
        "ssl": true
      }
    }
  }
});
