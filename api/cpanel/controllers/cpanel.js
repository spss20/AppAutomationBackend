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
          console.log("user id is: " + id);

        //find website server 
        const serverEntity = await strapi.services.server.findOne(1);

        console.log(serverEntity);
        const fileName = ctx.request.body.username + "_" + uuidv4().substring(0, 8) + ".txt";

        const cmd = 'sudo /home/ssoft/scripts/create_cpanel.sh ' +
            ' -d "' + ctx.request.body.domain + '"' +
            ' -u "' + ctx.request.body.username + '"' +
            ' -p "' + ctx.request.body.password + '"' +
            ' -e "' + ctx.request.body.email + '"' +
            ' > ../process/' + fileName;

        //execute the command
        const apiUrl = serverEntity.url + "api/executecommand.php";

        // request to the website server
        request.post(apiUrl, { form: { 'cmd': cmd } })

         //Create database entry
         let entity;
         if (ctx.is('multipart')) {
             const { data, files } = parseMultipartData(ctx);
             data.user_id = [id];
             data.server = [serverEntity.id]
             entity = await strapi.services.cpanel.create(data, { files });
         } else {
             ctx.request.body.user_id = [id] ;
             ctx.request.body.server = [serverEntity.id];
             entity = await strapi.services.cpanel.create(ctx.request.body);
         }

        //return output
        entity.outputUrl = serverEntity.url + "/process/" + fileName;
        return sanitizeEntity(entity, { model: strapi.models.cpanel });
    },
};
