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
 * The resource namespace contains methods that are used to load the asset extensions by reading the asset.js
 * @namespace
 * @example
 *          var resources=require('resources').resources;
 *          resources.init();
 * @requires event
 * @requires utils
 * @requires store
 */
var resources = {};
(function(core, resources, artifacts) {
    var log = new Log();
    var getRxtExtensionPath = function(type, options) {
        return options.CONFIG_BASE_PATH + options.EXTENSION_PATH + type;
    };
    var getAssetScriptPath = function(type, options) {
        return getRxtExtensionPath(type, options) + options.ASSET_SCRIPT_PATH;
    };
    var getDefaultAssetScriptPath = function(options) {
        return options.DEFAULT_ASSET_SCRIPT;
    };
    var getDefaultAssetTypeScriptPath = function(options, type) {
        return '/extensions/assets/' + type + '/asset.js';
    };
    var getAssetExtensionPath = function(type) {
        return constants.ASSET_EXTENSION_ROOT + '/' + type;
    };
    var addToConfigs = function(tenantId, type, assetResource) {
        var configs = core.configs(tenantId);
        if (!configs.assetResources) {
            configs.assetResources = {};
        }
        configs.assetResources[type] = assetResource;
    };
    var loadAssetScriptContent = function(path) {
        var file = new File(path);
        var content = '';
        if (!file.isExists()) {
            if (log.isDebugEnabled()) {
                log.debug('Unable to locate default asset script at path ' + path);
            }
            return content;
        }
        try {
            file.open('r');
            content = file.readAll();
        } catch (e) {
            log.error('Unable to read the default asset script.A custom asset script will not be loaded from ' + path);
        } finally {
            file.close();
        }
        return content;
    };
    var loadDefaultAssetScript = function(options, type, assetResource) {
        var content = loadAssetScriptContent(getDefaultAssetScriptPath(options));
        if (content) {
            assetResource = evalAssetScript(content, assetResource, 'default', 'default')
        }
        return assetResource;
    };
    var loadAssetScript = function(options, type, assetResource) {
        var path = getDefaultAssetTypeScriptPath(options, type);
        var content = loadAssetScriptContent(path);
        var defConfiguration = assetResource.configure();
        var ref = require('utils').reflection;
        if (content) {
            assetResource = evalAssetScript(content, assetResource, path, type);
            var ptr = assetResource.configure;
            //The configuration object of the default asset.js needs to be combined with 
            //what is defined by the user in per type asset script
            assetResource.configure = function() {
                var configs = defConfiguration; //Assume the user has not defined a configuration
                //If the user has defined some configuration logic
                if (ptr) {
                    var customConfig = ptr();
                    //Combine the configuration
                    //ref.copyAllPropValues(customConfig, configs);
                    ref.copyAllPropValuesWithFunctions(customConfig,configs);
                }
                return configs;
            };
        }
        return assetResource;
    };
    var evalAssetScript = function(scriptContent, assetResource, path, type) {
        var module = 'function(asset,log){' + scriptContent + '};';
        var modulePtr = null;
        try {
            modulePtr = eval(module);
        } catch (e) {
            log.error('Unable to evaluate asset script content at  path: ' + path + '.Exception: ' + e);
        }
        if (!modulePtr) {
            return modulePtr;
        }
        try {
            var assetLog = new Log('asset-' + type + '-script');
            modulePtr.call(this, assetResource, assetLog);
        } catch (e) {
            log.error('Unable execute asset script content of ' + path + '.Exception: ' + e);
        }
        return assetResource;
    };
    var buildDefaultResources = function(options, type, assetResource) {
        var asset = {};
        var ref = require('utils').reflection;
        asset.manager = null;
        asset.renderer = null;
        asset.server = null;
        asset.configure = null;
        asset = loadDefaultAssetScript(options, type, asset);
        assetResource._default = asset;
        assetResource.configure = asset.configure;
        var ptr = assetResource.configure;
        assetResource.configure = function() {
            var originalConfigs = ptr();
            var defaultAppExtensionMediator = core.defaultAppExtensionMediator();
            var customDefaultConfigs;
            var temp; 
            if (defaultAppExtensionMediator) {
                customDefaultConfigs = defaultAppExtensionMediator.configs() ? defaultAppExtensionMediator.configs() : function() {
                    return {}
                };
                temp = customDefaultConfigs();
                ref.copyAllPropValues(temp, originalConfigs);
            }
            return originalConfigs;
        };
    };
    var buildAssetResources = function(options, type, assetResource) {
        var asset = {};
        asset.manager = null;
        asset.renderer = null;
        asset.server = null;
        asset.configure = assetResource.configure;
        asset = loadAssetScript(options, type, asset);
        assetResource.manager = asset.manager;
        assetResource.renderer = asset.renderer;
        assetResource.server = asset.server;
        assetResource.configure = asset.configure;
    };
    /**
     * Loads the artifacts found within an asset
     * @param  String type     The asset type
     * @param  Number tenantId The tenant ID
     */
    var loadAssetArtifacts = function(type, tenantId) {
        var path = getAssetExtensionPath(type);
        artifacts.loadDirectory(path, tenantId, type);
    };
    /**
     * Loads the artifacts defined for the default asset type
     * @param  {[type]} options  [description]
     * @param  {[type]} type     [description]
     * @param  {[type]} tenantId [description]
     * @return {[type]}          [description]
     */
    var loadDefaultAssetArtifacts = function(tenantId) {
        loadAssetArtifacts('default', tenantId);
    };
    var loadResources = function(options, tenantId, sysRegistry) {
        var manager = core.rxtManager(tenantId);
        var rxts = manager.listRxtTypes();
        var type;
        var map = {};
        for (var index in rxts) {
            type = rxts[index];
            var asset = {};
            asset.manager = null;
            asset.renderer = null;
            asset.server = null;
            asset.configure = null;
            buildDefaultResources(options, type, asset);
            buildAssetResources(options, type, asset);
            //Perform any rxt mutations
            if (asset.configure) {
                manager.applyMutator(type, asset.configure());
            }
            addToConfigs(tenantId, type, asset);
            //Load any artifacts
            loadAssetArtifacts(type, tenantId);
        }
        loadDefaultAssetArtifacts(tenantId);
    };
    var matchFile = function(fileName, dir) {
        var files = dir.listFiles();
        var found = false;
        for (var index = 0;
            (index < files.length) && (!found); index++) {
            if (files[index].getName() === fileName) {
                found = true;
            }
        }
        return found;
    };
    var hasAppScript = function(dir) {
        return matchFile('app.js', dir);
    };
    var hasAssetScript = function(dir) {
        return matchFile('asset.js', dir);
    };
    var readScriptContent = function(file) {
        var content = '';
        try {
            file.open('r');
            content = file.readAll();
        } catch (e) {
            log.error('Unable to read contents of ' + file.getPath() + ' ' + file.getName(), e);
        } finally {
            file.close();
        }
        return content;
    };
    var appExtensionPath = function(dir) {
        return dir.getPath() + '/app.js';
    };
    var assetExtensionPath = function(dir) {
        return dir.getPath() + '/asset.js';
    }
    var evalExtensionScript = function(dir) {
        var file = new File(appExtensionPath(dir));
        var content = readScriptContent(file);
        var script = 'function(app,log){' + content + '}';
        var module = {};
        var l = new Log(file.getName());
        var ptr;
        module.dependencies = [];
        ptr = eval(script);
        ptr.call(this, module, l);
        return module;
    };

    function DefaultAppExtensionMediatorImpl(path,name) {
        this.path = '/extensions/app/'+name+'/';//path;
        this.assetExtension = {};
        this.init();
    }
    DefaultAppExtensionMediatorImpl.prototype.init = function() {
        var extensionDir = new File(this.path);
        var scriptFile = new File(assetExtensionPath(extensionDir));
        var content = readScriptContent(scriptFile);
        var extension = {};
        var script = 'function(asset,log) { ' + content + ' \n } ';
        var l = new Log();
        var ptr = eval(script);
        ptr.call(this, extension, l);
        this.assetExtension = extension || {};
        //log.info(this.assetExtension.renderer().pageDecorators);
    };
    DefaultAppExtensionMediatorImpl.prototype.manager = function() {
        return this.assetExtension.manager;
    };
    DefaultAppExtensionMediatorImpl.prototype.renderer = function() {
        return this.assetExtension.renderer;
    };
    DefaultAppExtensionMediatorImpl.prototype.configs = function() {
        return this.assetExtension.configure;
    };
    DefaultAppExtensionMediatorImpl.prototype.resolveCaramelResources = function(resourcePath, theme, caramelThemeResolver) {
        var file;
        var fullPath = this.path + '/' + resourcePath;
        file = new File(fullPath);
        if (file.isExists()) {
            return fullPath;
        }
        return caramelThemeResolver(theme, resourcePath);
    };

    function DefaultAppExtensionMediator(impl) {
        this.impl = impl;
    }
    DefaultAppExtensionMediator.prototype.manager = function() {
        if (!this.impl) {
            return null;
        }
        return this.impl.manager();
    };
    DefaultAppExtensionMediator.prototype.renderer = function() {
        if (!this.impl) {
            return null;
        }
        return this.impl.renderer();
    };
    DefaultAppExtensionMediator.prototype.configs = function() {
        if (!this.impl) {
            return null;
        }
        return this.impl.configs();
    };
    DefaultAppExtensionMediator.prototype.resolveCaramelResources = function(resourcePath, theme, caramelThemeResolver) {
        var file;
        var fullPath = this.path + '/' + resourcePath;
        theme = theme || {};
        caramelThemeResolver = caramelThemeResolver || function(theme, path) {
            return path
        };
        if (!this.impl) {
            return caramelThemeResolver(theme, path);
        }
        return this.impl.resolveCaramelResources(resourcePath, theme, caramelThemeResolver);
    };
    var loadDefaultAppExtensions = function() {
        //Go through each app extension 
        var dirPath = '/extensions/app';
        var dir = new File(dirPath);
        var extensionDir;
        var extensionDirs;
        var extension;
        var dependencies;
        var mediator;
        var mediatorImpl;
        var ignore = false;
        var found = false; //Assume that no default extensions will be found
        if (log.isDebugEnabled()) {
            log.debug('loading default asset app extensions');
        }
        if (!dir.isDirectory()) {
            log.error('Unable to read the app extension directory');
            return;
        }
        extensionDirs = dir.listFiles() || [];
        extensionDir;
        for (var index = 0; index < extensionDirs.length; index++) {
            extensionDir = extensionDirs[index];
            if (log.isDebugEnabled()) {
                log.debug('Checking extension: ' + extensionDir.getName());
            }
            //Check if there is an asset script
            if (hasAppScript(extensionDir)) {
                //Get the extension details
                extension = evalExtensionScript(extensionDir);
                dependencies = extension.dependencies || [];
                ignore = extension.ignoreExtension || false;
                if (((dependencies.indexOf(constants.DEFAULT_APP_EXTENSION) > -1) && (!ignore)) && (found)) {
                    log.error('An extension which overrides the default asset extension was already loaded, thus app extension: ' + extensionDir.getName() + ' will be ignored.Please make sure that there is only one app extension which declares a dependency to "default".');
                }
                //Check if "default" is one of the dependencies
                if (((dependencies.indexOf(constants.DEFAULT_APP_EXTENSION) > -1) && (!ignore)) && (!found)) {
                    if (log.isDebugEnabled()) {
                        log.debug('found an app extension which overrides the default asset extension: ' + extensionDir.getName());
                    }
                    found = true;
                    //Build a mediator
                    mediatorImpl = new DefaultAppExtensionMediatorImpl(extensionDir.getPath(),extensionDir.getName());
                    mediator = new DefaultAppExtensionMediator(mediatorImpl);
                    core.defaultAppExtensionMediator(mediator);
                }
            }
        }
        if (log.isDebugEnabled()) {
            log.debug('finished loading default asset app extensions');
        }
    };
    var init = function(tenantId) {
        var server = require('store').server;
        var options = server.options();
        if (!options.rxt) {
            log.error('Unable to locate rxt configuation block in provided tenant configuration.Check the configuration file that is the registry');
            throw 'Unable to locate rxt configuation block in provided tenant configuration.Check the configuration file that is the registry';
        }
        options = options.rxt;
        var sysRegistry = server.systemRegistry(tenantId);
        loadDefaultAppExtensions(); //TODO:Add support for tenants
        loadResources(options, tenantId, sysRegistry);
    };
    resources.manager = function(tenantId) {
        init(tenantId);
    };
    /**
     * Initializes the resource module and loads up all asset extensions.This method will internally invoke
     * logic that will first read, then evaluate the asset.js files defined in the asset extension directories.If one is not found
     * for a given asset type it will load the default asset.js located in the default asset extension
     */
    resources.init = function() {
        var event = require('event');
        event.on('tenantLoad', function(tenantId) {
            init(tenantId);
        });
        event.on('assetTypesHotDeploy',function(tenantId){
            if (log.isDebugEnabled()) {
                log.debug('Resources Hot Deployed');
                log.debug('Tenant ID: '+tenantId);
            }
            init(tenantId);
        });
    };
}(core, resources, artifacts));