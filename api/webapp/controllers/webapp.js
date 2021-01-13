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
             data.user = [id];
             entity = await strapi.services.webapp.create(data, { files });
         } else {
             ctx.request.body.user = [id] ;
             entity = await strapi.services.webapp.create(ctx.request.body);
         }
        
         if(entity.icon == null){
             return "Cannot call api without company logo";
         }

        const fileName =   "webapp_" + uuidv4().substring(0, 8) + ".txt";
        
        const cmd = '/home/webapp/scripts/webapp/makewebapp.sh ' +
            ' -n "' + entity.appname + '"' +
            ' -u "' + entity.website + '"' +
            ' -c "' + entity.version_code + '"' +
            ' -l "' + process.env.HOST + entity.icon.url + '"' +
            ' -v "' + entity.version_name + '"' +
            ' -p "' + entity.package + '"' +
            ' > ../process/' + fileName;

        console.log("Command: " , cmd);
        //find website server 
        const serverEntity = await strapi.query('server').findOne({type : 'apps'});
        console.log("Server : " ,serverEntity);

        //execute the command
        const apiUrl = serverEntity.url + "api/executecommand.php";

        // request to the website server
        request.post(apiUrl, { form: { 'cmd': cmd } })

        //return output
        entity.outputUrl = serverEntity.url + "/process/" + fileName;
        return sanitizeEntity(entity, { model: strapi.models.cpanel });
    },

};
