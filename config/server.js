module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  admin: {
    url: '/dashboard',
    auth: {
      secret: env('ADMIN_JWT_SECRET', '3fa7baedfb859ba1db9d263a89c9022b'),
    },
  },
  bookingEmailTo: env('BOOKING_EMAIL_TO', 'nguyenchauhuyen@gmail.com')
});
