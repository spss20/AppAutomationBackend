'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

    async create(ctx) {
        //getting user id
        const { id } = await strapi.plugins[
            'users-permissions'
        ].services.jwt.getToken(ctx);

        //Create database entry
        let entity;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            data.user = [id];
            entity = await strapi.services.orders.create(data, { files });
        } else {
            ctx.request.body.user = [id];
            entity = await strapi.services.orders.create(ctx.request.body);
        }
        return sanitizeEntity(entity, { model: strapi.models.orders });
    },
    async find(ctx) {

        //getting user id
        const { id } = await strapi.plugins[
            'users-permissions'
        ].services.jwt.getToken(ctx);
        console.log("User id is ", id)

        let entities;
        ctx.query.user = id;
        if (ctx.query._q) {
            console.log("Query ", ctx.query)
            entities = await strapi.services.orders.search(ctx.query);
        } else {
            console.log("Raw ", ctx.query)
            entities = await strapi.services.orders.find(ctx.query);
        }

        return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.orders }));
    },

    async findOne(ctx) {
        const { id } = ctx.params;
        //getting user id
        const userData = await strapi.plugins[
            'users-permissions'
        ].services.jwt.getToken(ctx);
        console.log("User id is ", userData.id)

        if (userData.id == id) {
            const entity = await strapi.services.orders.findOne({ id });
            return sanitizeEntity(entity, { model: strapi.models.orders });
        } else {
            ctx.status = 403
            return {
                "status": 403,
                "error": "Access Forbidden"
            };
        }
    },
};