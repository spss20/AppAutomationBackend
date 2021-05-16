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

        //getting user id
        const { id } = await strapi.plugins[
            'users-permissions'
        ].services.jwt.getToken(ctx);

        //Create database entry
        let entity;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            data.user = [id];
            entity = await strapi.services.adminpanels.create(data, { files });
        } else {
            ctx.request.body.user = [id];
            entity = await strapi.services.adminpanels.create(ctx.request.body);
        }

        //TODO: Add a null cpanel check here for entity.cpanel
        //Preparing Command

        //find website server 
        const serverEntity = await strapi.services.server.findOne(entity.cpanel.server);

        const fileName = entity.cpanel.username + "_" + uuidv4().substring(0, 8) + ".txt";
        const host = "http://" + process.env.HOST + ":" + process.env.PORT;
        const cmd = `sudo /home/${serverEntity.username}/scripts/` + entity.product.slug +
            '/install_admin_panel.sh ' +
            (entity.subdomain ? ' -s "' + entity.subdomain + '"' : '') +
            ' -d "' + entity.cpanel.domain + '"' +
            ' -u "' + entity.cpanel.username + '"' +
            (entity.company_logo ? ' -l "' + host + entity.company_logo.url + '"' : '') +
            ' -n "' + entity.company_name + '"' +
            ' -x "' + entity.product.slug + '"' +
            ' > ../process/' + fileName;
        console.log(cmd);

        //execute the command
        const apiUrl = serverEntity.url + "api/executecommand.php";

        // request to the website server
        const fields = { form: { 'cmd': cmd, 'accessToken': serverEntity.accessToken } };
        request.post(apiUrl, fields, function (err, httpResponse, body) {
            console.log("Error: ", err)
            console.log("Body: ", body);
        })

        //return output
        entity.outputUrl = serverEntity.url + "/process/" + fileName;
        return sanitizeEntity(entity, { model: strapi.models.adminpanels });
    },


    async find(ctx) {

        //getting user id
        const { id } = await strapi.plugins[
            'users-permissions'
        ].services.jwt.getToken(ctx);
        console.log("User id is ", id)

        let entities;
        ctx.query.user = id;
        ctx.query._sort = "id:DESC";
        if (ctx.query._q) {
            console.log("Query ", ctx.query)
            entities = await strapi.services.adminpanels.search(ctx.query);
        } else {
            console.log("Raw ", ctx.query)
            entities = await strapi.services.adminpanels.find(ctx.query);
        }

        return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.adminpanels }));
    },

    async findOne(ctx) {
        const { id } = ctx.params;
        //getting user id
        const userData = await strapi.plugins[
            'users-permissions'
        ].services.jwt.getToken(ctx);

        const entity = await strapi.services.adminpanels.findOne({ id });
        if (entity == null) {
            return null
        }

        if (entity.user.id == userData.id) {
            return sanitizeEntity(entity, { model: strapi.models.adminpanels });
        } else {
            ctx.status = 403
            return {
                "status": 403,
                "error": "Access Forbidden"
            };
        }
    },

    async update(ctx) {
        const { id } = ctx.params;
        //getting user id
        const userData = await strapi.plugins[
            'users-permissions'
        ].services.jwt.getToken(ctx);

        const entity = await strapi.services.adminpanels.findOne({ id });
        if (entity == null) {
            return null
        }

        if (entity.user.id == userData.id) {
            let entity;
            if (ctx.is('multipart')) {
                const { data, files } = parseMultipartData(ctx);
                if (data.hasOwnProperty("domain")) {
                    return {
                        "status": 404,
                        "error": "Domain cannot be updated once adminpanels is created"
                    };
                }

                entity = await strapi.services.adminpanels.update({ id }, data, {
                    files,
                });
            } else {
                if (ctx.request.body.hasOwnProperty("domain")) {
                    return {
                        "status": 404,
                        "error": "Domain cannot be updated once adminpanels is created"
                    };
                }
                entity = await strapi.services.adminpanels.update({ id }, ctx.request.body);
            }

            return sanitizeEntity(entity, { model: strapi.models.adminpanels });
        } else {
            ctx.status = 403
            return {
                "status": 403,
                "error": "Access Forbidden"
            };
        }

    },
};
