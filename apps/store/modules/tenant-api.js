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
    var userMod = require('store').user;
    var rxt = require('rxt');
    var log = new Log('tenant-api');
    PrivilegedCarbonContext = org.wso2.carbon.context.PrivilegedCarbonContext;
    var isUserDomainAndUrlDomainDifferent = function(domain, urlTenantId, tenantId) {
        return ((domain) && (tenantId !== urlTenantId));
    };
    var getTenantDetails = function() {
        var carbonContext = PrivilegedCarbonContext.getThreadLocalCarbonContext();
        var details = {};
        details.domain = carbonContext.getTenantDomain();
        details.id = carbonContext.getTenantId();
        return details;
    };
    api.debug = function() {
        var carbonContext = PrivilegedCarbonContext.getThreadLocalCarbonContext();
        log.info('[tenant debug] ###');
        log.info('[tenant debug] domain: ' + carbonContext.getTenantDomain());
        log.info('[tenant debug] id: ' + carbonContext.getTenantId());
        log.info('[tenant debug] ###')
    };
    api.tenantContext = function(session) {
        var tenantDetails = getTenantDetails();
        var user = server.current(session);
        var details = {};
        details.urlTenantDomain = tenantDetails.domain;
        details.urlTenantId = tenantDetails.id;
        if(!user){
            user ={};
            user.tenantId = carbon.server.superTenant.tenantId;
        }
        details.userTenantDomain = carbon.server.tenantDomain({
            tenantId: user.tenantId
        });
        details.userTenantId = user.tenantId;
        return details;
    };
    api.activeTenant = function(){
        return getTenantDetails();
    };
    api.createTenantDetails = function(req, session) {
        var tenantPattern = '/{context}/t/{domain}/{+suffix}';
        var defaultPattern = '/{context}/{+suffix}';
        var uriMatcher = new URIMatcher(req.getRequestURI());
        uriMatcher.match(tenantPattern) || uriMatcher.match(defaultPattern);
        var options = uriMatcher.elements();
        var user = server.current(session);
        var domain = options.domain;
        var tenantId = carbon.server.superTenant.tenantId;
        var urlTenantId = carbon.server.superTenant.tenantId;
        var details = {};
        var resolvedTenantId = tenantId;
        if (domain) {
            urlTenantId = carbon.server.tenantId({
                domain: domain
            });
        }
        if (user) {
            tenantId = user.tenantId;
            //Case: A logged in user visiting the store in another tenant domain
            if (isUserDomainAndUrlDomainDifferent(domain, urlTenantId, tenantId)) {
                resolvedTenantId = urlTenantId;
            }
            //Case: A logged in user visiting the store by either giving their tenant domain or not 
            else {
                resolvedTenantId = tenantId;
            }
        } else {
            //Case: All other cases
            resolvedTenantId = urlTenantId;
        }
        details.tenantId = resolvedTenantId;
        details.domain = domain;
        details.urlParams = options;
        return details;
    };
    api.createTenantAwareAssetResources = function(session, options) {
        options = options || {};
        //Check if the params have the domain provided,if not
        //fill it in with the domain set in the carbon context
        if (!options.domain) {
            options.domain = getTenantDetails().domain;
        }
        var user = server.current(session);
        var domain = options.domain;
        var type = options.type;
        var tenantId = carbon.server.superTenant.tenantId;
        var urlTenantId = carbon.server.superTenant.tenantId;
        var resources = {};
        var am;
        var appManager;
        var context;
        if (!type) {
            throw 'Cannot create an Asset Manager when type is not provided';
        }
        //Set the urlTenantId if a domain was provided
        if (domain) {
            urlTenantId = carbon.server.tenantId({
                domain: domain
            });
        }
        if (user) {
            tenantId = user.tenantId;
            //Case: A logged in user visiting the store in another tenant domain
            if (isUserDomainAndUrlDomainDifferent(domain, urlTenantId, tenantId)) {
                context = rxt.core.createAnonAssetContext(session, type, urlTenantId);
                //Build an anon asset manager for the urlTenantId
                am = rxt.asset.createAnonAssetManager(session, type, urlTenantId);
                appManager = rxt.app.createAnonAppManager(session, urlTenantId);
            }
            //Case: A logged in user visiting the store by either giving their tenant domain or not 
            else {
                context = rxt.core.createUserAssetContext(session, type);
                //Build a user asset manager for the tenantId of the logged in user
                am = rxt.asset.createUserAssetManager(session, type);
                appManager = rxt.app.createUserAppManager(session);
            }
        } else {
            context = rxt.core.createAnonAssetContext(session, type, urlTenantId);
            //Build an anon asset manager instance for the urlTenantId
            am = rxt.asset.createAnonAssetManager(session, type, urlTenantId);
            appManager = rxt.app.createAnonAppManager(session, urlTenantId);
        }
        resources.am = am;
        resources.appManager = appManager;
        resources.context = context || {};
        return resources;
    };
    api.createTenantAwareAppResources = function(session, options) {
        options = options || {};
        //Check if the params have the domain provided,if not
        //fill it in with the domain set in the carbon context
        if (!options.domain) {
            options.domain = getTenantDetails().domain;
        }
        var user = server.current(session);
        var domain = options.domain;
        var type = options.type;
        var tenantId = carbon.server.superTenant.tenantId;
        var urlTenantId = carbon.server.superTenant.tenantId;
        var resources = {};
        var appManager;
        var context;
        resources.isUserDomainAndUrlDomainDifferent = false;
        //Set the urlTenantId if a domain was provided
        if (domain) {
            urlTenantId = carbon.server.tenantId({
                domain: domain
            });
        }
        if (user) {
            tenantId = user.tenantId;
            //Case: A logged in user visiting the store in another tenant domain
            if (isUserDomainAndUrlDomainDifferent(domain, urlTenantId, tenantId)) {
                appManager = rxt.app.createAnonAppManager(session, urlTenantId);
                context = rxt.core.createAnonAppContext(session,urlTenantId);
                resources.isUserDomainAndUrlDomainDifferent = true;
            }
            //Case: A logged in user visiting the store by either giving their tenant domain or not 
            else {
                appManager = rxt.app.createUserAppManager(session);
                context = rxt.core.createUserAppContext(session);
            }
        } else {
            appManager = rxt.app.createAnonAppManager(session, urlTenantId);
            context = rxt.core.createAnonAppContext(session,urlTenantId);
        }
        resources.appManager = appManager;
        resources.context = context;
        return resources;
    };
}(api));