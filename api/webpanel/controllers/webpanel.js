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
            data.user_id = [id];
            entity = await strapi.services.webpanel.create(data, { files });
        } else {
            ctx.request.body.user_id = [id];
            entity = await strapi.services.webpanel.create(ctx.request.body);
        }

      
        //TODO: Add a null cpanel check here for entity.cpanel
        //Preparing Command
        const product_id = {"id" : entity.product.product}
        console.log(product_id);
        const productEntity = await strapi.services.products.findOne(product_id);
        console.log(productEntity);

        //find website server 
        const serverEntity = await strapi.services.server.findOne(entity.cpanel.server);

        const fileName = entity.cpanel.username + "_" + uuidv4().substring(0, 8) + ".txt";

        const cmd = `sudo /home/${serverEntity.username}/scripts/` + productEntity.slug +
            '/install_admin_panel.sh ' +
            (entity.subdomain ? ' -s "' + entity.subdomain + '"' : '') +
            ' -d "' + entity.cpanel.domain + '"' +
            ' -u "' + entity.cpanel.username + '"' +
            (entity.company_logo ? ' -l "' + process.env.HOST + entity.company_logo.url + '"' : '') +
            ' -n "' + entity.company_name + '"' +
            ' -x "' + productEntity.slug + '"' +
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
        return sanitizeEntity(entity, { model: strapi.models.webpanel });
    },
};
