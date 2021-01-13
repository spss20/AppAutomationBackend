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
        const {id} = await strapi.plugins[
            'users-permissions'
          ].services.jwt.getToken(ctx);

        //Create database entry
         let entity;
         if (ctx.is('multipart')) {
             const { data, files } = parseMultipartData(ctx);
             data.user_id = [id];
             entity = await strapi.services.webpanel.create(data, { files });
         } else {
             ctx.request.body.user_id = [id] ;
             entity = await strapi.services.webpanel.create(ctx.request.body);
         }
        
         //Preparing Command
        const productEntity = await strapi.services.products.findOne(entity.product.product);

        const fileName = entity.cpanel.username + "_" + uuidv4().substring(0, 8) + ".txt";
        
        const cmd = 'sudo /home/webapp/scripts/' + productEntity.slug +
            '/install_admin_panel.sh ' +
            ' -s "' + entity.subdomain + '"' +
            ' -d "' + entity.cpanel.domain + '"' +
            ' -u "' + entity.cpanel.username + '"' +
            ' -l "' + process.env.HOST + entity.company_logo.url + '"' +
            ' -n "' + entity.company_name + '"' +
            ' -x "' + productEntity.slug + '"' +
            ' > ../process/' + fileName;

        //find website server 
        const serverEntity = await strapi.services.server.findOne(entity.cpanel.server);
        console.log(serverEntity);
        //execute the command
        const apiUrl = serverEntity.url + "api/executecommand.php";

        // request to the website server
        request.post(apiUrl, { form: { 'cmd': cmd } })

        //return output
        entity.outputUrl = serverEntity.url + "/process/" + fileName;
        return sanitizeEntity(entity, { model: strapi.models.cpanel });
    },
};
