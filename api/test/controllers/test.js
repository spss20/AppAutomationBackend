'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
const request = require('request');
const { v4: uuidv4 } = require('uuid');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  async create(ctx) {
    let entity;

    const port = process.env.HOST
    console.log(port);

    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.test.create(data, { files });
    } else {
      entity = await strapi.services.test.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.test });
  },

};
