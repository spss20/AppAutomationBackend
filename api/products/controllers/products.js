'use strict';
const showdown = require('showdown');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async getDescription(ctx) {
    const { id } = ctx.params;
    const entity = await strapi.services.products.findOne({ id });

    const style = "<style>\r\n blockquote {\r\n    margin-top: 41px;\r\n    margin-bottom: 34px;\r\n    font-size: 16px;\r\n    font-weight: 400;\r\n    border-left: 5px solid rgb(238, 238, 238);\r\n    font-style: italic;\r\n    padding: 10px 20px;\r\n}\r\n</style>";

    var converter = new showdown.Converter();
    const htmlDesc = converter.makeHtml(style + "\n" + entity.description);

    return htmlDesc;
  }
};
