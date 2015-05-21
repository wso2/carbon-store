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
var permissions = {};
(function(core, asset, app, permissions) {
    var log = new Log('rxt-permissions');
    var permissionTreeRoot = function() {
        return '/_system/governance/permission';
    };
    /**
     * Returns the root of the permission tree for given
     * application (support store,publisher,admin and sso apps)
     * @param  {[type]} appName [description]
     * @return {[type]}         A path in the permission tree alocated for the provided app
     */
    var esPermissionRoot = function(appName) {
        return permissionTreeRoot() + '/es/apps' + appName;
    };
    var getPermissionNameFromPath = function(path) {
        var components = path.split('/');
        return components[components.length - 1];
    };
    var addPermissionCollection = function(path, registry) {
        var resource = {};
        var name = getPermissionNameFromPath(path);
        var collection = registry.registry.newCollection();
        collection.setProperty('name', name);
        registry.registry.put(path, collection);
    };
    var recursivelyCreatePath = function(path, registry) {
        path = path.substring(1);
        var components = path.split('/');
        recursivelyCreateCollections(0, components, registry);
    };
    var recursivelyCreateCollections = function(current, elements, registry) {
        if (current > elements.length - 1) {
            return;
        } else {
            var path = '';
            for (var index = 0; index <= current; index++) {
                path += '/' + elements[index];
            }
            //Check if the path exists
            if (!registry.exists(path)) {
                //Create the collection
                addPermissionCollection(path, registry);
            }
            current++;
            recursivelyCreateCollections(current, elements, registry);
        }
    };
    var buildAppPagePermissions = function(url) {
        return ['/pages/' + url];
    };
    var buildAppAPIPermissions = function(url) {
        var base = '/apis/' + url;
        var verbs = ['get', 'post', 'delete', 'put'];
        var permissions = [];
        for (var index = 0; index < verbs.length; index++) {
            permissions.push(base + '/' + verbs[index]);
        }
        return permissions;
    };
    var buildAssetPagePermissions = function(url, type) {
        return ['/asts/' + type + '/' + url];
    };
    var buildAssetAPIPermissions = function(url, type) {
        var base = '/asts/' + type + '/apis/' + url;
        var verbs = ['get', 'post', 'delete', 'put'];
        var permissions = [];
        for (var index = 0; index < verbs.length; index++) {
            permissions.push(base + '/' + verbs[index]);
        }
        return permissions;
    };
    var registerAppPagePermissions = function(tenantId) {
        var pages = app.getPageEndpoints(tenantId);
        var page;
        var permissions;
        for (var index = 0; index < pages.length; index++) {
            page = pages[index];
            permissions = buildAppPagePermissions(page.url);
            addPermissions(permissions, tenantId);
        }
    };
    var registerAppAPIPermissions = function(tenantId) {
        var apis = app.getApiEndpoints(tenantId);
        var api;
        var permissions;
        for (var index = 0; index < apis.length; index++) {
            api = apis[index];
            permissions = buildAppAPIPermissions(api.url);
            addPermissions(permissions, tenantId);
        }
    };
    var registerAssetPagePermissions = function(tenantId) {
        var rxtManager = core.rxtManager(tenantId);
        var types = rxtManager.listRxtTypes();
        var pages;
        var type;
        var page;
        var permissions;
        for (var index = 0; index < types.length; index++) {
            type = types[index];
            pages = asset.getSessionlessAssetPageEndpoints(type, tenantId);
            for (var currentIndex = 0; currentIndex < pages.length; currentIndex++) {
                page = pages[currentIndex];
                permissions = buildAssetPagePermissions(page.url, type);
                addPermissions(permissions, tenantId);
            }
        }
    };
    var registerAssetAPIPermissions = function(tenantId) {
        var rxtManager = core.rxtManager(tenantId);
        var types = rxtManager.listRxtTypes();
        var apis;
        var type;
        var api;
        var permissions;
        for (var index = 0; index < types.length; index++) {
            type = types[index];
            apis = asset.getSessionlessAssetApiEndpoints(type, tenantId);
            for (var currentIndex = 0; currentIndex < apis.length; currentIndex++) {
                api = apis[currentIndex];
                permissions = buildAssetAPIPermissions(api.url, type);
                addPermissions(permissions, tenantId);
            }
        }
    };
    var addPermissions = function(permissionPaths, tenantId) {
        var appName = app.getContext();
        var root = esPermissionRoot(appName);
        var permissionPath;
        var fullPermissionPath;
        //Obtain the system registry for the provided tenant
        var server = require('store').server;
        var systemRegistry = server.systemRegistry(tenantId);
        //Go through each provided permission path
        for (var index = 0; index < permissionPaths.length; index++) {
            permissionPath = permissionPaths[index];
            fullPermissionPath = root + permissionPath;
            //Check if the permission already exists
            if (!systemRegistry.exists(fullPermissionPath)) {
                //Add the permission
                recursivelyCreatePath(fullPermissionPath, systemRegistry);
            }
        }
    };
    permissions.init = function() {
        var event = require('event');
        event.on('tenantLoad', function() {});
    };
    permissions.force = function(tenantId) {
        registerAppAPIPermissions(tenantId);
        registerAppPagePermissions(tenantId);
        registerAssetPagePermissions(tenantId);
        registerAssetAPIPermissions(tenantId);
    };
    permissions.getAssetPagePermission = function(path, type) {
    	return buildAssetPagePermissions(path,type);
    };
    permissions.getAssetAPIPermission = function(path,httpMethod,type) {
    	return '/asts/'+type+'/apis/'+path+'/'+httpMethod;
    };
    permissions.getAppPagePermission = function(path) {
    	var base = buildAppPagePermissions(path);
    	var appName = app.getContext();
        var root = esPermissionRoot(appName);
        return root+base;
    };
    permissions.getAppAPIPermission = function(path,httpMethod) {
    	return '/apis/'+path+'/'+httpMethod;
    };
    permissions.isAssetPageAccessible = function(options) {
    	var server = require('store').server;
    	var um = server.userManager(options.tenantId);
    	var permissions = this.getAppPagePermission(options.url);
    	log.info('Checking permission for '+permissions);
    	var isAllowed = um.authorizer.isUserAuthorized(options.username,permissions,'read');
    	log.info('Is allowed? '+isAllowed);
    	return isAllowed;
    };
    permissions.isAssetAPIAccessible = function(options) {};
    permissions.isAppPageAccessible = function(options) {

    };
    permissions.isAppAPIAccessible = function(options) {};
}(core, asset, app, permissions));