module.exports = ({ env }) => ({
  settings: {
    cache: {
      enabled: true,
      type: env('REDIS_HOST') ? 'redis' : 'mem', // Use Redis for caching
      maxAge: 3600000 * 24, // 24 hours
      max: 25000, // Safe value for 1 KB entries
      redisConfig: {
        tls: env('REDIS_TLS') || false,
        host: env('REDIS_HOST'),
        port: env('REDIS_PORT'),
        password: env('REDIS_PASSWORD'),
        db: 0,                             // Redis DB (default is 0)
        //ttl: 86400,                         // Cache TTL (Time to live) in seconds
      },
      models: [
        {
          model: 'product',
          maxAge: 3600000 * 24, // 24 hours
        },
        {
          model: 'article',
          maxAge: 3600000 * 24 * 30, // 24 hours
        },
      ],
    },
  },
});
