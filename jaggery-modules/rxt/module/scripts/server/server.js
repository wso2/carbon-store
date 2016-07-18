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
/**
 * The server namespace contains logic which is executed whenever a set of predefined events occur
 * @namespace
 * @example
 *     var server = require('rxt').server;
 *     server.init();
 * @requires event
 */
var server = {};
(function(server, core) {
    /**
     * Registers a login event listener which calls each of the login callbacks
     * registered in the asset.js of asset extensions
     * @param  {Object} options system configuration object
     */
    server.init = function(options) {
        var carbonUtils = Packages.org.wso2.carbon.utils.CarbonUtils;
        var proxyContextPath = carbonUtils.getProxyContextPath(true);
        application.put(constants.PROXY_CONTEXT_PATH, proxyContextPath);
        application.put(constants.SERVER_URL, options.server.https);
        application.put(constants.PROXY_URL, options.server.proxyServer);

        var event = require('event');
        event.on('login', function(tenantId, user, session) {
            var rxtManager = core.rxtManager(tenantId);
            var rxts = rxtManager.listRxtTypes();
            var context; // = core.createAssetContext(session, type, tenantId);
            var assetResources;
            var rxt;
            var instance;
            for (var index in rxts) {
                type = rxts[index];
                context = core.createAssetContext(session, type, tenantId);
                assetResources = core.assetResources(tenantId, type);
                if (assetResources.server) {
                    instance = assetResources.server(context);
                } else {
                    instance = assetResources._default.server(context);
                }
                //Check if a user logged in callback is present
                //annd then execute it with the username
                if (instance.onUserLoggedIn) {
                    instance.onUserLoggedIn(context);
                }
            }
        });
    };

    /**
     * Method used to build complete server url appending proxy context path given the sub context of the url
     * @param  sub context url (does not contain proxy contex path).
     * @return complete url with server url + proxy context path.
     */
    server.buildURL = function (path) {
        if ( (path.indexOf('/') != 0) && ( path.indexOf('http') != 0 ) ) {
            path = "/" + path;
        }
        if(application.get(constants.PROXY_URL) && application.get(constants.PROXY_URL).length >0){
            return application.get(constants.PROXY_URL) + application.get(constants.PROXY_CONTEXT_PATH) + path;
        }
        return application.get(constants.PROXY_CONTEXT_PATH) + path;
    };

    /**
     * Method used to build complete server url. Input should contain proxy context path and application context
     * (For ex : /publisher or /store)
     * @param  sub context url (contain proxy context path + application context).
     * @return complete url with server url
     */
    server.buildAppURL = function (path) {
        if ( (path.indexOf('/') != 0) && ( path.indexOf('http') != 0 ) ) {
            path = "/" + path;
        }
        if(application.get(constants.PROXY_URL) && application.get(constants.PROXY_URL).length >0){
            return application.get(constants.PROXY_URL) + path;
        }
        return path;
    };

    /**
     * Method used to get the proxy context path defined in the carbon.xml
     * @return proxy context path.
     */
    server.getProxyContextPath = function () {
        return application.get(constants.PROXY_CONTEXT_PATH);
    }
}(server, core));
