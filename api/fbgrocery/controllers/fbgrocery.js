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
            entity = await strapi.services.fbgrocery.create(data, { files });
        } else {
            ctx.request.body.user = [id];
            entity = await strapi.services.fbgrocery.create(ctx.request.body);
        }

        //Just for change
        let scriptFile;
        switch (entity.appType) {
            case "user":
                scriptFile = "makeuserapp.sh"
                break

            case "admin":
                scriptFile = "makeadminapp.sh"
                break

            case "delivery":
                scriptFile = "makedeliveryapp.sh"
                break
        }
        //find website server 
        const serverEntity = await strapi.query('server').findOne({ type: 'apps' });

        //Preparing Command
        const fileName = "fbgrocery_" + uuidv4().substring(0, 8) + ".txt";
        const host = "http://" + process.env.HOST + ":" + process.env.PORT;
        const cmd = `~/scripts/fbgrocery/${scriptFile} ` +
            ' -a "' + entity.appName + '"' +
            ' -b "' + entity.baseUrl + '"' +
            (entity.dynamicLink ? ' -d "' + entity.dynamicLink + '"' : '') +
            (entity.lowInventory ? ' -l "' + entity.lowInventory + '"' : '') +
            ' -p "' + entity.packageName + '"' +
            (entity.razorpayKey ? ' -r "' + entity.razorpayKey + '"' : '') +
            (entity.icon ? ' -i "' + host + entity.icon.url + '"' : '') +
            (entity.splash ? ' -s "' + host + entity.splash.url + '"' : '') +
            (entity.googleJson ? ' -g "' + host + entity.googleJson.url + '"' : '') +
            ' -c "' + entity.versionCode + '"' +
            ' -v "' + entity.versionName + '"' +
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
        return sanitizeEntity(entity, { model: strapi.models.fbgrocery });
    },
};