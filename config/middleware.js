module.exports = ({ env }) => ({
  settings: {
    cache: {
      enabled: true,
      type: "mem",
      max: 50000,
      models: ["products"]
      //   redisConfig: {
      //     sentinels: [
      //       { host: "192.168.10.41", port: 26379 },
      //       { host: "192.168.10.42", port: 26379 },
      //       { host: "192.168.10.43", port: 26379 }
      //     ],
      //     name: "redis-primary"
      //   }
    }
  }
});
