'use strict';
const { sanitizeEntity } = require('strapi-utils');
const showdown = require('showdown');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.products.search(ctx.query);
    } else {
      entities = await strapi.services.products.find(ctx.query);
    }

    // var converter = new showdown.Converter();
    // console.log(entities)
    // const descHtml = converter.makeHtml(entities.description);
    // console.log("The description is " , descHtml);
    // entities.description = descHtml;
    return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.products }));
  },
  async findOne(ctx) {
    const { id } = ctx.params;

    const entity = await strapi.services.products.findOne({ id });

    var converter = new showdown.Converter();
    const htmlDesc = converter.makeHtml(entity.description);
    entity.description = htmlDesc;
    return sanitizeEntity(entity, { model: strapi.models.products });
  },

  async getDescription(ctx) {
    const { id } = ctx.params;
    const entity = await strapi.services.products.findOne({ id });

    const style = "<style>\r\n blockquote {\r\n    margin-top: 41px;\r\n    margin-bottom: 34px;\r\n    font-size: 16px;\r\n    font-weight: 400;\r\n    border-left: 5px solid rgb(238, 238, 238);\r\n    font-style: italic;\r\n    padding: 10px 20px;\r\n}\r\n</style>";

    var converter = new showdown.Converter();
    const htmlDesc = converter.makeHtml(style + "\n" + entity.description);

    return htmlDesc;
  }
};
