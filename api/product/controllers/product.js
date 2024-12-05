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

    const countQuery = {
      category: ctx.query.category || null,
      price_gte: ctx.query.price_gte || null,
      price_lte: ctx.query.price_lte || null,
    };

    const limit = parseInt(ctx.query._limit) || 100;
    const start = parseInt(ctx.query._start) || 0;

    if (ctx.query._q) {
      const _q = ctx.query._q;
      const q = _q.split("*").join(".*") + (_q[_q.length - 1] !== "*" ? "$" : "");
      const nameRegex = { $regex: new RegExp(q, '') };

      const query = {
        name: nameRegex,
        category: ctx.query.category || null,
        price_gte: ctx.query.price_gte || null,
        price_lte: ctx.query.price_lte || null,
        _start: start,
        _limit: limit,
        _sort: ctx.query._sort || "id:desc"
      };

      countQuery.name = nameRegex;
      entities = await strapi.services.product.find(query);

    } else {
      entities = await strapi.services.product.find(ctx.query);
    }

    const totalCount = limit === 48 ? await strapi.services.product.count(countQuery) : -1;

    return {
      data: entities.map(entity => {
        return sanitizeEntity(entity, { model: strapi.models.product });
      }),
      totalCount
    };
  },
  async count(ctx) {
    const query = ctx.query;
    if (ctx.query._q) {
      const _q = ctx.query._q;
      const q = _q.split("*").join(".*") + (_q[_q.length - 1] !== "*" ? "$" : "");
      query.name = { $regex: new RegExp(q, '') };
    }

    return await strapi.services.product.count(query);
  }
};
