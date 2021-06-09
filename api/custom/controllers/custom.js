'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
 
    async getAllOrders(ctx) {

        let outputA = [];

        //getting user id
        const { id } = await strapi.plugins[
            'users-permissions'
        ].services.jwt.getToken(ctx);
        console.log("User id is ", id)

        const webapps = await strapi.services.webapp.find({"user" : id});
        console.log(webapps[0])
        webapps.forEach(element => {
            const {appname , website : baseUrl , icon : appIcon , created_at , updated_at} = element;
            console.log(appIcon);
            outputA.push({appname , baseUrl , appIcon , created_at , updated_at});
        });
        
        // const fluxstores = await strapi.services.fluxstore.find({"user" : id})
        // outputA = outputA.concat(fluxstores)

        return outputA;
    
    }
}
