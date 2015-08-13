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
    permissions.ANON_ROLE = 'Internal/everyone';
    var getAnonRole = function(tenantId) {
        return permissions.ANON_ROLE;
    };
    var wso2AnonUsername = function() {
        return 'wso2.anonymous.user';
    };
    var systemPermissionPath = function(path) {
        return '/_system/governance' + path;
    };
    var governanceRooted = function(path) {
        path = path || '';
        if (path == '') {
            throw 'Unable to root the root as the path was returned as empty';
        }
        if (path.charAt(0) !== '/') {
            path = '/' + path;
        }
        return '/_system/governance' + path;
    };
    /**
     * Returns the root of the permission tree for given
     * application (support store,publisher,admin and sso apps)
     * @param  {[type]} appName [description]
     * @return {[type]}         A path in the permission tree alocated for the provided app
     */
    var esPermissionRoot = function(appName) {
        return '/permission/admin/enterprisestore/apps' + appName;
    };
    var esFeaturePermissionRoot = function() {
        return '/features';
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
        return ['/assets/' + type + '/' + url];
    };
    var buildAssetAPIPermissions = function(url, type) {
        var base = '/assets/' + type + '/apis/' + url;
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
        //Check if the path starts with a / if not add one
        if (path.charAt(0) !== '/') {
            path = '/' + path;
        }
        //Check if the permission already exists
        if (!systemRegistry.exists(path)) {
            if(log.isDebugEnabled()){
                log.debug('[permissions] creating permission path: ' + path);
            }
            //Add the permission
            recursivelyCreatePath(path, systemRegistry);
            return true;
        }
        if(log.isDebugEnabled()){
            log.debug('[permissions] permision path ' + path + ' not created as it already exists');
        }
        return false;
    };
    var addPermissionsToRole = function(permissionMap, role, tenantId) {
        var server = require('store').server;
        var um = server.userManager(tenantId);
        var permission;
        var action = 'ui.execute';
        for (var key in permissionMap) {
            if (permissionMap.hasOwnProperty(key)) {
                permission = permissionMap[key];
                if (typeof permission === 'string') {
                    try {
                        um.authorizeRole(role, permission, action);
                    } catch (e) {
                        log.error('[permissions] unable to assign permission ' + permission + ' to role ' + role);
                    }
                }
            }
        }
    };
    var addRole = function(role, tenantId) {
        var server = require('store').server;
        var um = server.userManager(tenantId);
        var users = [];
        var permissions = [];
        if (!um.roleExists(role)) {
            log.info('[permissions] creating new role: ' + role);
            try {
                um.addRole(role, users, permissions);
                return true;
            } catch (e) {
                log.error('[permissions] role: ' + role + ' was not created', e);
                return false;
            }
        }
        if(log.isDebugEnabled()){
            log.debug('[permissions] role ' + role + ' was not created as it already exists');
        }
        return true;
    };
    /**
     * Creates a permission string which defines an asset level feature
     * @param  {[type]} permission [description]
     * @param  {[type]} type       [description]
     * @return {[type]}            [description]
     */
    var assetFeaturePermissionString = function(permission, type) {
        //Get the base app
        var appName = app.getContext();
        var root = esPermissionRoot(appName);
        var featureRoot;
        if (!type) {
            throw 'Unable to create an asset feature permission string without the type';
        }
        featureRoot = root + esFeaturePermissionRoot() + '/assets/' + type;
        if (permission.charAt(0) !== '/') {
            permission = '/' + permission;
        }
        return featureRoot + permission;
    };
    var appFeaturePermissionString = function(permission) {
        //Get the base app
        var appName = app.getContext();
        var root = esPermissionRoot(appName);
        var featureRoot;
        if (!permission) {
            throw 'Unable to create an asset feature permission string without the permission';
        }
        featureRoot = root + esFeaturePermissionRoot() + '/app';
        if (permission.charAt(0) !== '/') {
            permission = '/' + permission;
        }
        return featureRoot + permission;
    };
    var assetFeaturePermissionKey = function(feature, type) {
        if ((!feature) || (!type)) {
            throw 'Unable to generate asset feature permission key without a feature name and a type';
        }
        return 'ASSET_' + type.toUpperCase() + '_' + feature.toUpperCase();
    };
    var appFeaturePermissionKey = function(feature) {
        if (!feature) {
            throw 'Unable to generate app feature permission key without a feature name';
        }
        return 'APP_' + feature.toUpperCase();
    }
    permissions.init = function() {
        var event = require('event');
        event.on('tenantLoad', function(tenantId) {
            loadPermissions(tenantId);
            loadRegistryPermissions(tenantId);
        });
        event.on('assetTypesHotDeploy',function(tenantId){
            if(log.isDebugEnabled()){
                log.debug('Permissions hor deployed');
            }
            loadPermissions(tenantId);
            loadRegistryPermissions(tenantId);
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
        return '/assets/' + type + '/apis/' + path + '/' + httpMethod;
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
        var isAllowed = um.authorizer.isUserAuthorized(options.username, permissions, 'read');
        return isAllowed;
    };
    //var permissionKeySet = ['ASSET_SEARCH', 'ASSET_LIST', 'ASSET_CREATE', 'ASSET_UPDATE', 'ASSET_DELETE', 'ASSET_LIFECYCLE_MANAGEMENT', 'ASSET_BOOKMARK', 'ASSET_MYITEMS'];
    permissions.ASSET_LIST = 'ASSET_LIST';
    permissions.ASSET_DETAILS = 'ASSET_DETAILS';
    permissions.ASSET_CREATE = 'ASSET_CREATE';
    permissions.ASSET_UPDATE = 'ASSET_UPDATE';
    permissions.ASSET_DELETE = 'ASSET_DELETE';
    permissions.ASSET_SEARCH = 'ASSET_SEARCH';
    permissions.ASSET_LIFECYCLE = 'ASSET_LIFECYCLE';
    permissions.ASSET_BOOKMARK = 'ASSET_BOOKMARK';
    permissions.APP_LOGIN = 'APP_LOGIN'
    permissions.APP_STATISTICS = 'APP_STATISTICS';
    permissions.APP_MYITEMS = 'APP_MYITEMS';
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
    var buildPermissionContext = function(tenantId, options) {
        options = options || {};
        var context = {};
        if (!tenantId) {
            throw 'Unable to create a permission context without a tenantId';
        }
        context = core.createSystemContext(tenantId);
        context.utils = {};
        //context.utils.addPermission = addPermission;
        context.utils.registerPermissions = registerPermissions; //TODO: fix to accept just permission and not tenantid
        context.utils.assetFeaturePermissionString = assetFeaturePermissionString;
        context.utils.appFeaturePermissionString = appFeaturePermissionString;
        context.utils.addPermissionsToRole = addPermissionsToRole;
        context.utils.addRole = addRole;
        context.utils.assetFeaturePermissionKey = assetFeaturePermissionKey;
        context.utils.appFeaturePermissionKey = appFeaturePermissionKey;
        context.utils.anonRole = getAnonRole;
        context.utils.authorizeActionsForEveryone = authorizeActionsForEveryone;
        context.utils.authorizeActionsForRole = authorizeActionsForRole;
        context.utils.denyActionsForEveryone = denyActionsForEveryone;
        context.utils.denyActionsForRole = denyActionsForRole;
        context.utils.governanceRooted = governanceRooted;
        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                context[key] = options[key];
            }
        }
        return context;
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
        var modifiedPath;
        for (var key in map) {
            if (map.hasOwnProperty(key)) {
                permission = map[key];
                if (typeof permission === 'string') {
                    if (permission.charAt(0) !== '/') {
                        permission = '/' + permission;
                    }
                    permission = systemPermissionPath(permission);
                    //log.info('Registering permission ' + permission);
                    addPermission(permission, tenantId);
                }
            }
        }
    };
    var loadRegistryPermissions = function(tenantId) {
        var rxtManager = core.rxtManager(tenantId);
        var types = rxtManager.listRxtTypes();
        var type;
        var context;
        var ptr;
        for (var index = 0; index < types.length; index++) {
            type = types[index];
            context = buildPermissionContext(tenantId, {
                type: type
            });
            ptr = rxtManager.getRegistryConfigureFunction(type);
            if(log.isDebugEnabled()){
                log.debug('[permissions] executing registry permission configure function for type: ' + type);      
            }
            ptr(context);
        }
    };
    var loadAppPermissions = function(tenantId) {
        var appExtensions = app.getAppResources(tenantId);
        var path;
        var file;
        var api;
        var server = require('store').server;
        //var userManager = server.userManager(tenantId);
        var permissions = assetPermissionMap(DEFAULT_ASSET, tenantId);
        var context = buildPermissionContext(tenantId);
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
        var context = buildPermissionContext(tenantId);
        var server = require('store').server;
        //var userManager = server.userManager(tenantId);
        var file;
        var path;
        basePath = resolveDefaultAssetPermissionPath(tenantId);
        file = new File(basePath);
        //context.userManager = userManager;
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
            file = new File(basePath);
            if (file.isExists()) {
                api = require(basePath);
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
        var context = buildPermissionContext(tenantId);
        //var server = require('store').server;
        //var userManager = server.userManager(tenantId);
        for (var index = 0; index < types.length; index++) {
            type = types[index];
            map = buildEmptyPermissionMap();
            path = resolveAssetPermissionPath(type, tenantId);
            file = new File(path);
            if (file.isExists()) {
                context.permissions = map;
                //context.userManager = userManager;
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
        if(log.isDebugEnabled()){
            log.debug('[permissions] loading permissions for tenant ' + tenantId);
        }
        //Load the asset extension permissions.js
        loadDefaultAssetPermissions(tenantId);
        loadAssetPermissions(tenantId);
        //Load the app extension permissions.js
        loadAppPermissions(tenantId);
        if(log.isDebugEnabled()){
            log.debug('[permissions] finished loading permissions for tenant ' + tenantId);
        }
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
            log.error('[permissions] unable to locate permission for  ' + key);
        }
        return permission;
    };
    var mapToAppPermission = function(key, tenantId, appName) {
        var permissions = assetPermissionMap(DEFAULT_ASSET, tenantId);
        var permission = permissions[key];
        if(log.isDebugEnabled()){
            log.debug('AppPermission entry for the key '+ key + ' : ' + permission)
        }
        if (!permission) {
            log.error('[permissions] unable to locate permissions for ' + key);
        }
        return permission;
    };
    var checkPermissionString = function(username, permission, action, authorizer) {
        var isAuthorized = false;
        try {
            if ((!username) || (username === wso2AnonUsername())) {
                 if(log.isDebugEnabled()){
                    log.debug('[permissions] username not provided to check ' + permission + '.The anon role will be used to check permissions');                    
                 }
                isAuthorized = authorizer.isRoleAuthorized(getAnonRole(), permission, action);
            } else {
                if(log.isDebugEnabled()) {
                    log.debug('[permissions] using username: ' + username + ' to check permission');
                }
                isAuthorized = authorizer.isUserAuthorized(username, permission, action);
            }
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
    var isPermissable = function(permission, tenantId, username, options) {
        //Determine if the permission is a string or a function
        options = options || {};
        var isPermissionString = (typeof permission === 'string') ? true : false;
        var isPermissionFunction = (typeof permission === 'function') ? true : false;
        var server = require('store').server;
        var userManager = server.userManager(tenantId);
        var authorizer = userManager.authorizer;
        var action = 'ui.execute';
        var isAuthorized = false; //Assume authorization will fail
        var context;
        var result;
        if (!tenantId) {
            throw 'Unable to resolve permissions without a tenantId';
        }
        if (isPermissionString) {
            return checkPermissionString(username, permission, action, authorizer);
        }
        if (!isPermissionFunction) {
            log.error('[permissions] unable to resolve the permission type (it is neither a string permission or a function');
            return isAuthorized;
        }
        options.username = username;
        context = buildPermissionContext(tenantId, options);
        //context.userManager = userManager;
        try {
            result = permission(context) || true;
            if (typeof result === 'string') {
                //log.info('Dynamic permission function evaluated to permission string ' + result);
                isAuthorized = checkPermissionString(username, result, action, authorizer);
            } else if (typeof result === 'boolean') {
                isAuthorized = result;
            } else {
                log.error('[permissions] permission callback did not return a string or a boolean value');
                isAuthorized = false;
            }
        } catch (e) {
            log.error(e);
        }
        return isAuthorized;
    };
    var checkAssetPermission = function(key, type, tenantId, username, options) {
        var permission;
        options = options || {};
        permission = mapToAssetPermission(key, type, tenantId);
        if (!permission) {
            log.error('[permissions] permission key ' + key + ' was not found');
            return false;
        }
        options.username = username;
        return isPermissable(permission, tenantId, username, options);
    };
    var checkAppPermission = function(key, tenantId, username, options) {
        var permission;
        options = options || {};
        permission = mapToAppPermission(key, tenantId);
        if (!permission) {
            log.error('[permissions] permission ' + key + ' was not found');
            return false;
        }
        options.username = username;
        return isPermissable(permission, tenantId, username, options);
    };
    var authorizeActionsForRole = function(tenantId, path, role, actions) {
        var obj = {};
        var actionArr = [];
        var server = require('store').server;
        var um = server.userManager(tenantId);
        var systemRegistry = server.systemRegistry(tenantId);
        var success = false;
        if (typeof actions === 'string') {
            actionArr.push(actions);
        } else {
            actionArr = actions;
        }

        //Check if the path exists
        if(!systemRegistry.exists(path)) {
            log.debug('[permissions] Recursively creating path in order to eagerly assign actions : '+path);
            recursivelyCreatePath(path, systemRegistry);
        }
        obj[path] = actions;
        try {
            um.authorizeRole(role, obj);
            success = true;
        } catch (e) {
            log.error('[permissions] unable to authorize actions for path: ' + path + ' to role: ' + role + ' tenantId: ' + tenantId, e);
        }
        return success;
    };
    var denyActionsForRole = function(tenantId, path, role, actions) {
        var obj = {};
        var actionArr = [];
        var server = require('store').server;
        var um = server.userManager(tenantId);
        var success = false;
        if (typeof actions === 'string') {
            actionArr.push(actions);
        } else {
            actionArr = actions;
        }
        obj[path] = actions;
        try {
            um.denyRole(role, obj);
            success = true;
        } catch (e) {
            log.error('[permissions] unable to deny actions for path: ' + path + ' to role: ' + role + ' tenantId: ' + tenantId, e);
        }
        return success;
    };
    var authorizeActionsForEveryone = function(tenantId, path) {
        var actions = [constants.REGISTRY_ADD_ACTION, constants.REGISTRY_GET_ACTION, constants.REGISTRY_DELETE_ACTION, constants.REGISTRY_AUTHORIZE_ACTION];
        return authorizeActionsForRole(tenantId, path, constants.ROLE_EVERYONE, actions);
    };
    var denyActionsForEveryone = function(tenantId, path) {
        var actions = [constants.REGISTRY_DELETE_ACTION, constants.REGISTRY_ADD_ACTION, constants.REGISTRY_AUTHORIZE_ACTION];
        return denyActionsForRole(tenantId, path, constants.ROLE_EVERYONE, actions);
    };
    permissions.hasAssetPermission = function() {
        var key = arguments[0];
        var type = arguments[1];
        var tenantId;
        var username;
        var options = {};
        var authorized;
        options.type = type;
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
        if ((!tenantId)) {
            throw 'Unable to resolve permissions without the tenantId';
        }
        if(log.isDebugEnabled()){
            log.debug('[permissions] checking permission ' + key + ' for ' + username + ' tenantId ' + tenantId + ' type ' + type);        
        }
        authorized = checkAssetPermission(key, type, tenantId, username, options);
        if(log.isDebugEnabled()){
            log.debug('[permissions] authorized :' + authorized);       
        }
        return authorized;
    };
    permissions.hasAppPermission = function() {
        var key = arguments[0];
        var tenantId;
        var username;
        var authorized;
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
        if(log.isDebugEnabled()){
            log.debug('[permissions] checking permissions' + key + ' for ' + username + ' tenantId ' + tenantId);           
        }
        authorized = checkAppPermission(key, tenantId, username);
        if(log.isDebugEnabled()){
            log.debug('[permissions] authorized: ' + authorized);          
        }
        return authorized;
    };
    var locateEndpointDetails = function(endpoints, url) {
        var endpoint;
        for (var index = 0; index < endpoints.length; index++) {
            endpoint = endpoints[index];
            if (endpoint.url === url) {
                return endpoint;
            }
        }
        return endpoint;
    };
    var assetPageEndpoint = function(type, tenantId, url) {
        var endpoints = asset.getSessionlessAssetPageEndpoints(type, tenantId);
        return locateEndpointDetails(endpoints, url);
    }
    var assetAPIEndpoint = function(type, tenantId, url) {
        var endpoints = asset.getSessionlessAssetApiEndpoints(type, tenantId);
        return locateEndpointDetails(endpoints, url);
    };
    permissions.hasAssetPagePermission = function(type, pageURL, tenantId, username) {
        var details = assetPageEndpoint(type, tenantId, pageURL);
        var permission;
        var permissionString;
        var key;
        var options = {};
        options.type = type;
        if (!details) {
            log.error('[permissions] unable to locate information on page: ' + pageURL + ' to determine permissions');
            return true;
        }
        key = details.permission;
        if (!key) {
            if(log.isDebugEnabled()){
                log.debug('[permissions] permissions not defined for page ' + pageURL);      
            }
            //TODO: Use route permissions to determine if it is accessible
            return true;
        }
        //Locate the mapping
        permission = key; //Assume that it may be a function
        permissionString = (typeof permission === 'string') ? true : false;
        if (permissionString) {
            permission = mapToAssetPermission(permission, type, tenantId);
        }
        if (!permission) {
            log.error('[permissions] Unable to locate a mapping for permission ' + key);
            return true;
        }
        return isPermissable(permission, tenantId, username, options);
    };
    permissions.hasAssetAPIPermission = function(type, apiURL, tenantId, username) {
        var details = assetAPIEndpoint(type, tenantId, apiURL);
        var permission;
        var permissionString;
        var key;
        var options = {};
        options.type = type;
        if (!details) {
            log.error('[permissions] unable to locate information on api: ' + apiURL + ' to determine permissions');
            return true;
        }
        key = details.permission;
        if (!key) {
            if(log.isDebugEnabled()){
                log.debug('[permissions] permissions not defined for api ' + apiURL);           
            }
            //TODO: Use route permissions to determine if it is accessible
            return true;
        }
        //Locate the mapping
        permission = key; //Assume that a function may be provided
        permissionString = (typeof permission === 'string') ? true : false;
        if (permissionString) {
            permission = mapToAssetPermission(key, type, tenantId);
        }
        if (!permission) {
            log.error('[permissions] unable to locate a mapping for permission ' + key);
            return true;
        }
        return isPermissable(permission, tenantId, username, options);
    };
    permissions.hasAppPagePermission = function(pageURL, tenantId, username) {
        var details = app.getPageEndpoint(tenantId, pageURL);
        var permission;
        var permissionString;
        var key;
        if (!details) {
            log.error('[permissions] unable to locate information on page: ' + pageURL + ' to determine permissions');
            return true;
        }
        key = details.permission;
        if (!key) {
            if(log.isDebugEnabled()){
                log.debug('[permissions] permissions not defined for page ' + pageURL);       
            }
            //TODO: Use route permissions to determine if it is accessible
            return true;
        }
        //Locate the mapping
        permission = key; //Assume that the key may be a function
        permissionString = (typeof key === 'string') ? true : false;
        if (permissionString) {
            permission = null;
            permission = mapToAppPermission(key, tenantId);
        }
        if (!permission) {
            log.error('[permissions] unable to locate a mapping for permission ' + key);
            return true;
        }
        return isPermissable(permission, tenantId, username);
    };
    permissions.hasAppAPIPermission = function(apiURL, tenantId, username) {
        var details = app.getApiEndpoint(tenantId, apiURL);
        var permission;
        var permissionString;
        var key;
        if (!details) {
            log.error('[permissions] unable to locate information on api: ' + apiURL + ' to determine permissions');
            return true;
        }
        key = details.permission;
        if (!key) {
            if(log.isDebugEnabled()){
                log.debug('[permissions] permissions not defined for api ' + apiURL);           
            }
            //TODO: Use route permissions to determine if it is accessible
            return true;
        }
        //Locate the mapping
        permission = key; //Assume that the key may be a function
        permissionString = (typeof permission === 'string') ? true : false;
        if (permissionString) {
            permission = mapToAppPermission(key, tenantId);
        }
        if (!permission) {
            log.error('[permissions] unable to locate a mapping for permission ' + key);
            return true;
        }
        return isPermissable(permission, tenantId, username);
    };
    permissions.hasActionPermissionforPath = function() {
        var permission = arguments[0];
        var action = arguments[1];
        var tenantId;
        var username;
        var authorized;
        var server = require('store').server;
        var user = server.current(arguments[2]);
        username = user.username;
        tenantId = user.tenantId;
        if ((!tenantId)) {
            throw 'Unable to resolve permissions without the tenantId';
        }
        var userManager = server.userManager(tenantId);
        var authorizer = userManager.authorizer;

        if(log.isDebugEnabled()){
            log.debug('[permissions] checking permission ' + action + ' for ' + username + ' tenantId ' + tenantId + ' path ' + path);
        }
        authorized = checkPermissionString(username, permission, action, authorizer);
        if(log.isDebugEnabled()){
            log.debug('[permissions] authorized :' + authorized);
        }
        return authorized;
    };
    permissions.getAnonRole = getAnonRole;
    permissions.wso2AnonUsername = wso2AnonUsername;
    permissions.denyActionsForRole = denyActionsForRole;
    permissions.denyActionsForEveryone = denyActionsForEveryone;
    permissions.authorizeActionsForRole = authorizeActionsForRole;
    permissions.authorizeActionsForEveryone = authorizeActionsForEveryone;
}(core, asset, app, permissions));
