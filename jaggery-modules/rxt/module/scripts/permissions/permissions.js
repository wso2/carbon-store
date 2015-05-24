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
    var DEFAULT_ASSET = '_default';
    var PERMISSION_LOAD_HOOK = 'tenantLoad';
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
    var addPermission = function(path, tenantId) {
        //Obtain the system registry for the provided tenant
        var server = require('store').server;
        var systemRegistry = server.systemRegistry(tenantId);
        var fullPath;
        //Check if the path starts with a / if not add one
        if (path.charAt(0) !== '/') {
            path = '/' + path;
        }
        fullPath = permissionTreeRoot() + path;
        //Check if the permission already exists
        if (!systemRegistry.exists(fullPath)) {
            //Add the permission
            recursivelyCreatePath(fullPath, systemRegistry);
        }
    };
    permissions.init = function() {
        var event = require('event');
        event.on('tenantLoad', function() {
            loadPermissions(tenantId);
        });
    };
    permissions.force = function(tenantId) {
        //registerAppAPIPermissions(tenantId);
        //registerAppPagePermissions(tenantId);
        //registerAssetPagePermissions(tenantId);
        //registerAssetAPIPermissions(tenantId);
        loadPermissions(tenantId);
    };
    permissions.getAssetPagePermission = function(path, type) {
        return buildAssetPagePermissions(path, type);
    };
    permissions.getAssetAPIPermission = function(path, httpMethod, type) {
        return '/asts/' + type + '/apis/' + path + '/' + httpMethod;
    };
    permissions.getAppPagePermission = function(path) {
        var base = buildAppPagePermissions(path);
        var appName = app.getContext();
        var root = esPermissionRoot(appName);
        return root + base;
    };
    permissions.getAppAPIPermission = function(path, httpMethod) {
        return '/apis/' + path + '/' + httpMethod;
    };
    permissions.isAssetPageAccessible = function(options) {
        var server = require('store').server;
        var um = server.userManager(options.tenantId);
        var permissions = this.getAppPagePermission(options.url);
        log.info('Checking permission for ' + permissions);
        var isAllowed = um.authorizer.isUserAuthorized(options.username, permissions, 'read');
        log.info('Is allowed? ' + isAllowed);
        return isAllowed;
    };
    //var permissionKeySet = ['ASSET_SEARCH', 'ASSET_LIST', 'ASSET_CREATE', 'ASSET_UPDATE', 'ASSET_DELETE', 'ASSET_LIFECYCLE_MANAGEMENT', 'ASSET_BOOKMARK', 'ASSET_MYITEMS'];
    permissions.ASSET_SEARCH = 'ASSET_SEARCH';
    permissions.ASSET_LIST = 'ASSET_LIST';
    permissions.ASSET_CREATE = 'ASSET_CREATE';
    permissions.ASSET_UPDATE = 'ASSET_UPDATE';
    permissions.ASSET_DELETE = 'ASSET_LIFECYCLE_MANAGEMENT';
    permissions.ASSET_BOOKMARK = 'ASSET_BOOKMARK';
    permissions.ASSET_MYITEMS = 'ASSET_MYITEMS';
    var buildEmptyPermissionMap = function() {
        var map = {};
        // for (var index = 0; index < permissionKeySet.length; index++) {
        //     map[permissionKeySet[index]] = '';
        // }
        return map;
    };
    var resolveAssetPermissionPath = function(type, tenantId) {
        return '/extensions/assets/' + type + '/permissions.js';
    };
    var resolveDefaultAssetPermissionPath = function(tenantId) {
        return '/extensions/assets/default/permissions.js';
    };
    var resolveAppPermissionPath = function(extension, tenantId) {
        return '/extensions/app/' + extension + '/permissions.js';
    };
    var tenantPermissionMap = function(tenantId) {
        var configs = core.configs(tenantId);
        if (!configs) {
            throw 'Unable to load configs for tenant ' + tenantId;
        }
        if (!configs.permissionMap) {
            configs.permissionMap = {};
        }
        return configs.permissionMap;
    };
    var assetPermissionMap = function(type, tenantId, permissions) {
        var map = tenantPermissionMap(tenantId);
        if (!map.types) {
            map.types = {};
        }
        //If permissions are given store it in the tenant configs
        if (permissions) {
            map.types[type] = permissions;
            return;
        }
        return map.types[type];
    };
    var registerPermissions = function(map, tenantId) {
        var permission;
        for (var key in map) {
            if (map.hasOwnProperty(key)) {
                permission = map[key];
                if (typeof permission === 'string') {
                    log.info('Registering permission ' + permission);
                    //addPermission(permission, tenantId);
                }
            }
        }
    };
    var loadAppPermissions = function(tenantId) {
        log.info('### Loading app extensions ###');
        var appExtensions = app.getAppResources(tenantId);
        var path;
        var file;
        var api;
        var server = require('store').server;
        var userManager = server.userManager(tenantId);
        var permissions = assetPermissionMap(DEFAULT_ASSET, tenantId);
        var context = {};
        if (permissions) {
            context.permissions = permissions;
        }
        for (var key in appExtensions) {
            path = resolveAppPermissionPath(key, tenantId);
            file = new File(path);
            if (file.isExists()) {
                api = require(path);
                if (api.hasOwnProperty(PERMISSION_LOAD_HOOK)) {
                    api[PERMISSION_LOAD_HOOK](context);
                }
            }
        }
        if (context.permissions) {
            assetPermissionMap(DEFAULT_ASSET, tenantId, context.permissions);
            registerPermissions(context.permissions, tenantId);
        }
    };
    var loadDefaultAssetPermissions = function(tenantId) {
        //First load the permissions file from the default directory
        var basePath;
        var api;
        var context = {};
        var server = require('store').server;
        var userManager = server.userManager(tenantId);
        var file;
        var path;
        basePath = resolveDefaultAssetPermissionPath(tenantId);
        file = new File(basePath);
        context.userManager = userManager;
        context.permissions = {};
        if (file.isExists()) {
            api = require(basePath);
            if (api.hasOwnProperty(PERMISSION_LOAD_HOOK)) {
                api[PERMISSION_LOAD_HOOK](context);
            }
        }
        //Load any app defaults
        var defaultMediator = core.defaultAppExtensionMediator();
        if (defaultMediator) {
            basePath = defaultMediator.path + '/permissions.js';
            file = new File(path);
            
            if (file.isExists()) {
                api = require(path);
                if (api.hasOwnProperty(PERMISSION_LOAD_HOOK)) {
                    api[PERMISSION_LOAD_HOOK](context);
                }
            }
        }
        if (context.permissions) {
            assetPermissionMap(DEFAULT_ASSET, tenantId, context.permissions);
            registerPermissions(context.permissions, tenantId);
        }
    };
    var loadAssetPermissions = function(tenantId) {
        //Available asset types
        var rxtManager = core.rxtManager(tenantId);
        var types = rxtManager.listRxtTypes() || [];
        var type;
        var path;
        var api;
        var file;
        var map;
        var context = {};
        var server = require('store').server;
        var userManager = server.userManager(tenantId);
        for (var index = 0; index < types.length; index++) {
            type = types[index];
            map = buildEmptyPermissionMap();
            path = resolveAssetPermissionPath(type, tenantId);
            file = new File(path);
            if (file.isExists()) {
                context.permissions = map;
                context.userManager = userManager;
                api = require(path);
                if (api.hasOwnProperty(PERMISSION_LOAD_HOOK)) {
                    api[PERMISSION_LOAD_HOOK](context);
                }
                if (context.permissions) {
                    //Add the permissions to the asset map
                    assetPermissionMap(type, tenantId, context.permissions);
                    registerPermissions(context.permissions, tenantId);
                }
            }
        }
    };
    var loadPermissions = function(tenantId) {
        //Load the asset extension permissions.js
        loadDefaultAssetPermissions(tenantId);
        loadAssetPermissions(tenantId);
        //Load the app extension permissions.js
        loadAppPermissions(tenantId);
    };
    var mapToAssetPermission = function(key, type, tenantId, appName) {
        //Get the asset specific map
        var permissions = assetPermissionMap(type, tenantId) || {};
        var permission = permissions[key];
        if (permission) {
            return permission;
        }
        permissions = assetPermissionMap(DEFAULT_ASSET, tenantId) || {};
        permission = permissions[key];
        if (!permission) {
            log.error('Unable to locate permission for  ' + key);
        }
        return permission;
    };
    var mapToAppPermission = function(key, tenantId, appName) {
        var permissions = assetPermissionMap(DEFAULT_ASSET, tenantId);
        var permission = permissions[key];
        if (!permission) {
            log.error('Unable to locate permissions for ' + key);
        }
        return permission;
    };
    var checkPermissionString = function(username, permission, action, authorizer) {
        var isAuthorized = false;
        try {
            isAuthorized = authorizer.isUserAuthorized(username, permission, action);
        } catch (e) {
            log.error(e);
        }
        return isAuthorized;
    };
    /**
     * Evaluates and checks if the user has given permission
     * @param  {[type]}  permission A string permission value or a function which returns true or false
     * @param  {[type]}  tenantId   Tenant Id
     * @param  {[type]}  username   The username of the user for which the permissions must be checked
     * @return {Boolean}            True if the user has the permission,else false
     */
    var isPermissable = function(permission, tenantId, username) {
        //Determine if the permission is a string or a function
        var isPermissionString = (typeof permission === 'string') ? true : false;
        var isPermissionFunction = (typeof permission === 'function') ? true : false;
        var server = require('store').server;
        var userManager = server.userManager(tenantId);
        var authorizer = userManager.authorizer;
        var action = 'ui.execute';
        var isAuthorized = false; //Assume authorization will fail
        var context;
        var result;
        if ((!username) || (!tenantId)) {
            throw 'Unable to resolve permissions without a username and tenantId';
        }
        if (isPermissionString) {
            return checkPermissionString(username, permission, action, authorizer);
        }
        if (!isPermissionFunction) {
            log.error('Unable to resolve the permission type (it is neither a string permission or a function');
            return isAuthorized;
        }
        context = {};
        context.userManager = userManager;
        try {
            result = permission(context) || true;
            if (typeof result === 'string') {
                log.info('Dynamic permission function evaluated to permission string ' + result);
                isAuthorized = checkPermissionString(username, result, action, authorizer);
            } else if (typeof result === 'boolean') {
                isAuthorized = result;
            } else {
                log.error('The permission callback did not return a string or a boolean value');
                isAuthorized = false;
            }
        } catch (e) {
            log.error(e);
        }
        return isAuthorized;
    };
    var checkAssetPermission = function(key, type, tenantId, username) {
        var permission;
        permission = mapToAssetPermission(key, type, tenantId);
        if (!permission) {
            log.error('Permission ' + key + ' not was not found');
            return false;
        }
        log.info('Using mapped permission: '+stringify(permission));
        return isPermissable(permission, tenantId, username);
    };
    var checkAppPermission = function(key, tenantId, username) {
        var permission;
        permission = mapToAppPermission(key, tenantId);
        if (!permission) {
            log.error('Permission ' + key + ' not was not found');
            return false;
        }
        log.info('Using mapped permission '+stringify(permission));
        return isPermissable(permission, tenantId, username);
    };
    permissions.hasAssetPermission = function() {
        var key = arguments[0];
        var type = arguments[1];
        var tenantId;
        var username;
        if (arguments.length === 3) {
            var server = require('store').server;
            var user = server.current(arguments[2]);
            if (user) {
                username = user.username;
                tenantId = user.tenantId;
            }
        } else if (arguments.length === 4) {
            tenantId = arguments[2];
            username = arguments[3];
        }
        if ((!username) || (!tenantId)) {
            throw 'Unable to resolve permissions without the tenantId and username';
        }
        log.info('Checking permission for ' + username + ' tenantId ' + tenantId);
        return checkAssetPermission(key, type, tenantId, username);
    };
    permissions.hasAppPermission = function() {
        var key = arguments[0];
        var tenantId;
        var username;
        if (arguments.length === 2) {
            var server = require('store').server;
            var user = server.current(arguments[1]);
            if (user) {
                username = user.username;
                tenantId = user.tenantId;
            }
        } else if (arguments.length === 3) {
            tenantId = arguments[1];
            username = arguments[2];
        }
        if ((!username) || (!tenantId)) {
            throw 'Unable to resolve permissios without the tenantId and username';
        }
        log.info('Checking permissions for ' + username + ' tenantId ' + tenantId);
        return checkAppPermission(key, tenantId, username);
    };
}(core, asset, app, permissions));