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
}(server, core))
