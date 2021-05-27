'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
 
    async getAllOrders(ctx) {

        console.log(ctx);

        //getting user id
        const { id } = await strapi.plugins[
            'users-permissions'
        ].services.jwt.getToken(ctx);
        console.log("User id is ", id)


        let entities;
        entities = await strapi.services.webapp.find();

        console.log("Results"  , entities);
         
        return entities;

    
    }
}
