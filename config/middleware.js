module.exports = ({ env }) => ({
  settings: {
    cache: {
      enabled: true,
      type: 'redis', // Use Redis for caching
      maxAge: 3600000 * 24, // 24 hours
      redisConfig: {
        password: env('REDIS_PASSWORD'),
        host: env('REDIS_HOST'),
        port: env('REDIS_PORT'),
        db: 0,                             // Redis DB (default is 0)
        //ttl: 86400,                         // Cache TTL (Time to live) in seconds
      },
      models: ['product'],
    },
  },
});
