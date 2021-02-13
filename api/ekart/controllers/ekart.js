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

        // //getting user id
        // const { id } = await strapi.plugins[
        //     'users-permissions'
        // ].services.jwt.getToken(ctx);

        //Create database entry
        let entity;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            // data.user = [id];
            entity = await strapi.services.ekart.create(data, { files });
        } else {
            // ctx.request.body.user = [id];
            entity = await strapi.services.ekart.create(ctx.request.body);
        }

        //validation
        if (entity.icon == null) {
            return {
                "status": 400,
                "error": "Cannot call api without app logo"
            };
        }
        
        //find website server 
        const serverEntity = await strapi.query('server').findOne({ type: 'apps' });

        //Preparing Command
        const fileName = "ekart_" + uuidv4().substring(0, 8) + ".txt";
        const host = "http://" + process.env.HOST + ":" + process.env.PORT;
        const cmd = `~/scripts/ekart/makeuserapp.sh ` +
            ' -a "' + entity.appName + '"' +
            ' -b "' + entity.baseUrl + '"' +
            ' -p "' + entity.packageName + '"' +
            (entity.icon ? ' -i "' + host + entity.icon.url + '"' : '') +
            (entity.splashImage ? ' -s "' + host + entity.splashImage.url + '"' : '') +
            (entity.googleJson ? ' -g "' + host + entity.googleJson.url + '"' : '') +
            (entity.versionCode ? ' -x "' + entity.versionCode + '"' : '') +
            (entity.versionName ? ' -v "' + entity.versionName + '"' : '') +
            ' > ../process/' + fileName;

        console.log("Command: ", cmd);

        //execute the command
        const apiUrl = serverEntity.url + "api/executecommand.php";

        // request to the app server
        const fields = { form: { 'cmd': cmd, 'accessToken': serverEntity.accessToken } };
        request.post(apiUrl, fields, function (err, httpResponse, body) {
            console.log("Error: ", err)
            console.log("Body: ", body);
        })

        //return output
        entity.outputUrl = serverEntity.url + "/process/" + fileName;
        return sanitizeEntity(entity, { model: strapi.models.ekart });
    },
};