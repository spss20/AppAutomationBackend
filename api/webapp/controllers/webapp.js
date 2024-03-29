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
            entity = await strapi.services.webapp.create(data, { files });
        } else {
            ctx.request.body.user = [id];
            entity = await strapi.services.webapp.create(ctx.request.body);
        }

        if (entity.icon == null) {
            return {
                "status": 204,
                "error": "Cannot call api without company logo"
            };
        }

        //find website server 
        const serverEntity = await strapi.query('server').findOne({ type: 'apps' });

        //Preparing Command
        const fileName = "webapp_" + uuidv4().substring(0, 8) + ".txt";

        const cmd = `/home/${serverEntity.username}/scripts/webapp/makewebapp.sh ` +
            ' -n "' + entity.appname + '"' +
            ' -u "' + entity.website + '"' +
            ' -c "' + entity.version_code + '"' +
            ' -l "' + process.env.HOST + entity.icon.url + '"' +
            ' -v "' + entity.version_name + '"' +
            ' -p "' + entity.package + '"' +
            ' > ../process/' + fileName;

        console.log("Command: ", cmd);

        //execute the command
        const apiUrl = serverEntity.url + "api/executecommand.php";

        // request to the website server
        const fields = { form: { 'cmd': cmd  , 'accessToken' : serverEntity.accessToken } };
        request.post(apiUrl, fields , function (err, httpResponse, body) { 
            console.log("Http Reponse: " , httpResponse)
            console.log("Error: " , err)
            console.log("Body: " , body);
        })

        //return output
        entity.outputUrl = serverEntity.url + "/process/" + fileName;
        return sanitizeEntity(entity, { model: strapi.models.cpanel });
    },

};
