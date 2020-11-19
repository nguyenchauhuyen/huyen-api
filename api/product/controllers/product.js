"use strict";
const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async findOne(ctx) {
    //check if the params id is an id or a slug
    const { id } = ctx.params;

    // if you use MongoDB database
    // we are validating that the id match ObjectID format
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      const entity = await strapi.services.product.findOne({ _id: id });
      return sanitizeEntity(entity, { model: strapi.models.product });
    }

    // so we find one by using name
    const entity = await strapi.services.product.findOne({ name: id });
    return sanitizeEntity(entity, { model: strapi.models.product });
  },
  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      const name =
        (ctx.query._q[0] !== "*" ? "^" : "") +
        ctx.query._q.split("*").join(".*") +
        (ctx.query._q[ctx.query._q.length - 1] !== "*" ? "$" : "");

      let query = {
        name: new RegExp(name),
        category: ctx.query.category || null,
        _start: parseInt(ctx.query._start) || 0,
        _limit: parseInt(ctx.query._limit) || 100,
        _sort: ctx.query._sort || "price:asc"
      };
      entities = await strapi.services.product.find(query);
    } else {
      entities = await strapi.services.product.find(ctx.query);
    }

    return entities.map(entity => {
      return sanitizeEntity(entity, { model: strapi.models.product });
    });
  },
  async count(ctx) {
    let count;
    if (ctx.query._q) {
      const name =
        (ctx.query._q[0] !== "*" ? "^" : "") +
        ctx.query._q.split("*").join(".*") +
        (ctx.query._q[ctx.query._q.length - 1] !== "*" ? "$" : "");
      let query = {
        name: new RegExp(name),
        category: ctx.query.category || null
      };
      count = await strapi.services.product.count(query);
    } else {
      count = await strapi.services.product.count(ctx.query);
    }
    return count;
  }
};
