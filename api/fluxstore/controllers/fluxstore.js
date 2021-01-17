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
            entity = await strapi.services.fluxstore.create(data, { files });
        } else {
            ctx.request.body.user = [id];
            entity = await strapi.services.fluxstore.create(ctx.request.body);
        }

        if (entity.appIcon == null) {
            return {
                "status": 400,
                "error": "Cannot call api without company logo"
            };
        }

        //find website server 
        const serverEntity = await strapi.query('server').findOne({ type: 'apps' });

        //Preparing Command
        const fileName = "fluxstore_" + uuidv4().substring(0, 8) + ".txt";

        const cmd = `/home/${serverEntity.username}/scripts/flux/multivendorapp.sh ` +
            ' -a "' + entity.appName + '"' +
            ' -b "' + entity.baseUrl + '"' +
            ' -k "' + entity.consumerKey + '"' +
            ' -s "' + entity.consumerSecret + '"' +
            ' -r "' + entity.razorpayKey + '"' +
            ' -p "' + entity.phone + '"' +
            ' -e "' + entity.email + '"' +
            ' -o "' + entity.packageName + '"' +
            ' -m "' + entity.mapApi + '"' +
            (entity.appIcon ? ' -l "' + process.env.HOST + entity.appIcon.url + '"' : '') +
            (entity.headerLogo ? ' -h "' + process.env.HOST + entity.headerLogo.url + '"' : '') +
            (entity.splashImage ? ' -n "' + process.env.HOST + entity.splashImage.url + '"' : '') +
            (entity.googleJson ? ' -g "' + process.env.HOST + entity.googleJson.url + '"' : '') +
            ' -c "' + entity.versionCode + '"' +
            ' -v "' + entity.versionName + '"' +
            ' > ../process/' + fileName;

        console.log("Command: ", cmd);

        //execute the command
        const apiUrl = serverEntity.url + "api/executecommand.php";

        // request to the website server
        const fields = { form: { 'cmd': cmd  , 'accessToken' : serverEntity.accessToken } };
        request.post(apiUrl, fields , function (err, httpResponse, body) { 
            console.log("Error: " , err)
            console.log("Body: " , body);
        })

        //return output
        entity.outputUrl = serverEntity.url + "/process/" + fileName;
        return sanitizeEntity(entity, { model: strapi.models.cpanel });
    },

};
