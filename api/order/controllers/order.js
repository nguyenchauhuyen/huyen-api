"use strict";
const { sanitizeEntity } = require("strapi-utils");

// const _ = require("lodash");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async create(ctx) {
    let entity = await strapi.services.order.create(ctx.request.body);
    if (entity.id) {
      try {
        await strapi.plugins["email"].services.email.send({
          to: strapi.config.get("server.bookingEmailTo"),
          // from: "admin@strapi.io",
          subject: `New Order from ${entity.customerName}`,
          text: `The product ${entity.product.name} has been booked.
Customer Name: ${entity.customerName}
Customer Phone: ${entity.customerPhone}
Customer Email: ${entity.customerEmail}
Customer Address: ${entity.customerAddress}
Total Amount: ${entity.amount}
Note: ${entity.bookingNote}`
        });
      } catch (error) {
        entity.emailStatus = error;
        console.log(error);
      }
    }
    return sanitizeEntity(entity, { model: strapi.models.order });
  }
};
