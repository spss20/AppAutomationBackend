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
        console.log("user id is: " + id);

        //find website server 
        const serverEntity = await strapi.query('server').findOne({ type: 'website' });
        console.log(serverEntity);

        //Create database entry
        let entity;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            data.user_id = [id];
            data.server = [serverEntity.id]
            entity = await strapi.services.cpanel.create(data, { files });
        } else {
            ctx.request.body.user_id = [id];
            ctx.request.body.server = [serverEntity.id];
            entity = await strapi.services.cpanel.create(ctx.request.body);
        }


        const fileName = ctx.request.body.username + "_" + uuidv4().substring(0, 8) + ".txt";

        const cmd = `sudo /home/${serverEntity.username}/scripts/create_cpanel.sh ` +
            ' -d "' + ctx.request.body.domain + '"' +
            ' -u "' + ctx.request.body.username + '"' +
            ' -p "' + ctx.request.body.password + '"' +
            ' -e "' + ctx.request.body.email + '"' +
            ' > ../process/' + fileName;
        console.log(cmd)
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
        return sanitizeEntity(entity, { model: strapi.models.cpanel });
    },
};
