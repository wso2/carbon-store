/*
 *  Copyright (c) 2005-2014, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */
var api = {};
(function(api) {
    var server = require('store').server;
    var carbon = require('carbon');
    var rxt = require('rxt');
    var log = new Log('storage-api');
    /**
     * Checks if the resource of a given asset can be accessed 
     * @param  {String}  type         The type of the asset
     * @param  {String}  assetId      The asset UUID
     * @param  {String}  resourceName The resource path
     * @param  {Object}  session      The session object
     * @param  {Number}  tenantId     The id of the tenant
     * @return {Boolean}              True if the asset resource is accessible,else False
     */
    api.isAssetResourceAccessible = function(type, assetId, resourcePath, session, tenantId) {
        var user = server.current(session);
        var am;
        var asset;
        //Check if the tenant has not been provided and then eagerly assign the super tenant id
        tenantId = tenantId || carbon.server.superTenant.tenantId;
        //If there is a logged in user the tenant id should be picked up 
        //from the user
        if (user) {
            am = rxt.asset.createUserAssetManager(session, type);
            tenantId = tenantId ? tenantId : user.tenantId;
        } else {
            am = rxt.asset.createAnonAssetManager(session, type, tenantId);
        }
        //Attempt to retrieve the asset details
        try {
            asset = am.get(assetId);
        } catch (e) {
            log.error('Unable to obtain asset ' + assetId + ' type: ' + type+' for user in tenant '+tenantId, e);
        }
        if (asset) {
            return true;
        }
        if (log.isDebugEnabled) {
            log.debug('Unauthorized access attempt for ' + resourcePath + ' by user in tenant ' + tenantId);
        }
        return false;
    };
}(api));