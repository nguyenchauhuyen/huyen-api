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
    if (entity && entity.merchant) {
      delete entity.merchant;
    }
    return sanitizeEntity(entity, { model: strapi.models.product });
  },
  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.product.search(ctx.query);
    } else {
      entities = await strapi.services.product.find(ctx.query);
    }

    return entities.map(entity => {
      const product = sanitizeEntity(entity, { model: strapi.models.product });
      if (product.merchant) {
        delete product.merchant;
      }
      return product;
    });
  }
};
