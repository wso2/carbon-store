/*
 *  Copyright (c) 2005-2009, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
var pageDecorators = {};
(function() {
    var storeConstants = require('store').storeConstants;
    var tenantApi = require('/modules/tenant-api.js').api;
    var permissionsAPI = require('rxt').permissions;
    var log = new Log('store-page-decorators');
    pageDecorators.navigationBar = function(ctx, page, utils) {
        var app = require('rxt').app;
        //Change the context to support cross tenant views
        var tenantAppResources = tenantApi.createTenantAwareAppResources(ctx.session);
        //Support for cross tenant views
        ctx = tenantAppResources.context;
        var rxtManager = ctx.rxtManager;
        //Obtain all of the available rxt types
        var availableTypes = app.getActivatedAssets(ctx.tenantId);
        var types = [];
        var type;
        var currentType;
        page.navigationBar = {};
        for (var index in availableTypes) {
            type = availableTypes[index];
            if (permissionsAPI.hasAssetPermission(permissionsAPI.ASSET_LIST, type, ctx.tenantId, ctx.username)) {
                currentType = rxtManager.getRxtTypeDetails(type);
                currentType.selected = false;
                currentType.listingUrl = utils.buildAssetPageUrl(currentType.shortName, '/list');
                if (currentType.shortName == ctx.assetType) {
                    currentType.selected = true;
                }
                types.push(currentType);
            }
        }
        page.navigationBar.types = types;
        return page;
    };
    /**
     * The function populates any text field as a search field
     * @param  {[type]} ctx  [description]
     * @param  {[type]} page [description]
     * @return {[type]}      [description]
     */
    pageDecorators.searchBar = function(ctx, page) {
        page.searchBar = {};
        page.searchBar.searchFields = [];
        var searchFields = page.assetMeta.searchFields;
        for (var index in searchFields) {
            if ((searchFields[index].type == 'text') || (searchFields[index].type == 'options')) {
                page.searchBar.searchFields.push(searchFields[index]);
            }
        }
        return page;
    };
    /**
     * The function populates the categories for the category box
     * @param  {[type]} ctx  [description]
     * @param  {[type]} page [description]
     * @return {[type]}      [description]
     */
    pageDecorators.categoryBox = function(ctx, page) {
        page.categoryBox = {};
        page.categoryBox.categories = page.assetMeta.categories;
        page.categoryBox.searchEndpoint = '/apis/assets?type=' + ctx.assetType;
        return page;
    };
    pageDecorators.authenticationDetails = function(ctx, page) {
        var authenticationMethods = ctx.tenantConfigs.authentication ? ctx.tenantConfigs.authentication : {};
        var activeMethod = authenticationMethods.activeMethod ? authenticationMethods.activeMethod : '';
        //Obtain the details for this method of authentication
        var authDetails = fetchActiveAuthDetails(activeMethod, authenticationMethods.methods || []);
        page.security.method = activeMethod;
        page.security.details = authDetails;
        return page;
    };
    pageDecorators.recentAssets = function(ctx, page) {
        var am = getAssetManager(ctx);
        var ratingApi = require('/modules/rating-api.js').api;
        var assets = am.recentAssets();
        ratingApi.addRatings(assets, am, ctx.tenantId, ctx.username);
        page.recentAssets = assets;
        return page;
    };
    pageDecorators.recentAssetsOfActivatedTypes = function(ctx, page) {
        var app = require('rxt').app;
        var asset = require('rxt').asset;
        var assets = {};
        var items = [];
        var assetsByType = [];
        var am;
        var type;
        var rxtDetails;
        var tenantAppResources = tenantApi.createTenantAwareAppResources(ctx.session);
        var tenantAssetResources;
        // Supporting cross tenant views
        ctx = tenantAppResources.context;
        types = app.getActivatedAssets(ctx.tenantId);
        var typeDetails;
        var ratingApi = require('/modules/rating-api.js').api;
        var q = page.assetMeta.q;
        var query = buildRecentAssetQuery(q);
        for (var index in types) {
            typeDetails = ctx.rxtManager.getRxtTypeDetails(types[index]);
            type = typeDetails.shortName;
            tenantAssetResources = tenantApi.createTenantAwareAssetResources(ctx.session, {
                type: type
            });
            am = tenantAssetResources.am;
            // if (ctx.isAnonContext) {
            //     am = asset.createAnonAssetManager(ctx.session, type, ctx.tenantId);
            // } else {
            //     am = asset.createUserAssetManager(ctx.session, type);
            // }
            if (permissionsAPI.hasAssetPermission(permissionsAPI.ASSET_LIST, type, ctx.tenantId, ctx.username)) {
                if (query) {
                    query = replaceNameQuery(query, ctx.rxtManager, type);
                    query = replaceCategoryQuery(query, ctx.rxtManager, type);
                    assets = am.recentAssets({
                        q: query
                    });
                } else {
                    assets = am.recentAssets();
                }
                if (assets.length > 0) {
                    //Add subscription details if this is not an anon context
                    if (!ctx.isAnonContext) {
                        addSubscriptionDetails(assets, am, ctx.session);
                    }
                    ratingApi.addRatings(assets, am, ctx.tenantId, ctx.username);
                    items = items.concat(assets);
                    assetsByType.push({
                        assets: assets,
                        rxt: typeDetails
                    });
                }
            }
        }
        page.recentAssets = items;
        page.recentAssetsByType = assetsByType;
    };
    var replaceCategoryQuery = function(q, rxtManager, type) {
        //Determine if a category was provided
        if (!q.hasOwnProperty('category')) {
            return q;
        }
        var categoryField = rxtManager.getCategoryField(type);
        var categoryValue;
        if (!categoryField) {
            return q;
        }
        categoryValue = q.category;
        delete q.category;
        q[categoryField] = categoryValue;
        return q;
    };
    var replaceNameQuery = function(q, rxtManager, type) {
        //Determine if a name was provided
        if (!q.hasOwnProperty('name')) {
            return q;
        }
        var nameField = rxtManager.getNameAttribute(type);
        var nameValue;
        if (!nameField) {
            return q;
        }
        nameValue = q.name;
        delete q.name;
        q[nameField] = nameValue;
        return q;
    };
    var addSubscriptionDetails = function(assets, am, session) {
        for (var index = 0; index < assets.length; index++) {
            assets[index].isSubscribed = am.isSubscribed(assets[index].id, session);
        }
    };
    var buildRecentAssetQuery = function(q) {
        if (!q) {
            return null;
        }
        if (q === '') {
            return null;
        }
        var query = "{" + q + "}";
        var queryObj;
        try {
            queryObj = parse(query);
        } catch (e) {
            log.error('Unable to parse query string: ' + query + ' to an object.Exception: ' + e);
        }
        return queryObj;
    };
    pageDecorators.popularAssets = function(ctx, page) {
        var app = require('rxt').app;
        var asset = require('rxt').asset;
        var ratingApi = require('/modules/rating-api.js').api;
        var assets = {};
        var items = [];
        var assetsOfType;
        var am;
        var type;
        var tenantAppResources = tenantApi.createTenantAwareAppResources(ctx.session);
        var tenantAssetResources;
        //Support for cross tenant views
        ctx = tenantAppResources.context;
        var types = app.getActivatedAssets(ctx.tenantId);
        for (var index in types) {
            type = types[index];
            tenantAssetResources = tenantApi.createTenantAwareAssetResources(ctx.session, {
                type: type
            });
            am = tenantAssetResources.am;
            // if (ctx.isAnonContext) {
            //     am = asset.createAnonAssetManager(ctx.session, type, ctx.tenantId);
            // } else {
            //     am = asset.createUserAssetManager(ctx.session, type);
            // }
            assetsOfType = am.popularAssets();
            ratingApi.addRatings(assetsOfType, am, ctx.tenantId, ctx.username);
            items = items.concat(assetsOfType);
        }
        page.popularAssets = items;
    };
    pageDecorators.tags = function(ctx, page) {
        var am = getAssetManager(ctx);
        page.tags = am.tags();
        return page;
    };
    pageDecorators.myAssets = function(ctx, page) {
        var resources = tenantApi.createTenantAwareAssetResources(ctx.session, {
            type: ctx.assetType
        });
        //Supprt for cross tenant views
        ctx = resources.context;
        if ((!ctx.assetType) || (ctx.isAnonContext)) {
            log.debug('Ignoring my assets decorator as the asset type was not present');
            return page;
        }
        var am = resources.am;
        page.myAssets = am.subscriptions(ctx.session) || [];
        return page;
    };
    pageDecorators.socialFeature = function(ctx, page) {
        var app = require('rxt').app;
        var constants = require('rxt').constants;
        if (!app.isFeatureEnabled(ctx.tenantId, constants.SOCIAL_FEATURE)) {
            log.debug('social feature has been disabled.');
            return page;
        }
        var tenantAppResources = tenantApi.createTenantAwareAppResources(ctx.session);
        //Support for cross tenant views
        ctx = tenantAppResources.context;
        var socialFeatureDetails = app.getSocialFeatureDetails(ctx.tenantId);
        var domain = carbon.server.tenantDomain({
            tenantId: ctx.tenantId
        });
        socialFeatureDetails.keys.urlDomain = domain; //getDomainFromURL(request);
        page.features[constants.SOCIAL_FEATURE] = socialFeatureDetails;
        return page;
    };
    // var getDomainFromURL = function(request) {
    //     var uriMatcher = new URIMatcher(request.getRequestURI());
    //     var tenantedAssetPageUrl = constants.TENANT_URL_PATTERN; // '/{context}/t/{domain}/{+any}';
    //     var superTenantUrl = constants.DEFAULT_SUPER_TENANT_URL_PATTERN; //  = '/{context}/{+any}';
    //     var opts = uriMatcher.match(tenantedAssetPageUrl) || uriMatcher.match(superTenantUrl);
    //     var carbon = require('carbon');
    //     var urlTenantDomain = opts.domain ? opts.domain : constants.MultitenantConstants.SUPER_TENANT_DOMAIN_NAME;
    //     return urlTenantDomain;
    // };
    var buildTenantQualifiedUrlSuffix = function(session) {
        var tenant = tenantApi.activeTenant();
        return '/t/' + tenant.domain;
    };
    pageDecorators.socialSites = function(ctx, page, meta, util) {
        var utils = require('utils');
        if (!utils.reflection.isArray(page.assets || [])) {
            var asset = page.assets;
            var assetUrl = util.buildAssetPageUrl(asset.type, '/details/' + asset.id);
            var process = require('process');
            var host = process.getProperty('server.host');
            var port = process.getProperty('http.port');
            var app = require('rxt').app;
            var context = app.getContext();
            var tenantSuffix = buildTenantQualifiedUrlSuffix(ctx.session);
            var completeAssetUrl = ('http://' + host + ':' + port + context + tenantSuffix + assetUrl);
            page.socialSites = {};
            var facebook = page.socialSites.facebook = {};
            var gplus = page.socialSites.gplus = {};
            var twitter = page.socialSites.twitter = {};
            var diggit = page.socialSites.diggit = {};
            facebook.href = facebookLink(completeAssetUrl, asset);
            gplus.href = gplusLink(completeAssetUrl, asset);
            twitter.href = twitterLink(completeAssetUrl, asset);
            diggit.href = diggitLink(completeAssetUrl, asset);
        }
        return page;
    };
    pageDecorators.embedLinks = function(ctx, page, meta) {
        var utils = require('utils');
        if (!utils.reflection.isArray(page.assets || [])) {
            var asset = page.assets;
            var attributes = asset.attributes || {};
            var widgetLink = '/' + asset.type + 's/widget';
            var assetUrl = widgetLink + '?name=' + asset.name + '&version=' + attributes.overview_version + '&provider=' + attributes.overview_provider;
            page.embedLinks = '<iframe width="450" height="120" src="' + assetUrl + '" frameborder="0" allowfullscreen></iframe>';
        }
        return page;
    };
    pageDecorators.populateGroupingFeatureDetails = function(ctx, page) {
        page.groupingFeature = {};
        page.groupingFeature.isEnabled = ctx.rxtManager.isGroupingEnabled(ctx.assetType);
    };
    pageDecorators.populateAssetVersionDetails = function(ctx, page, utils) {
        if ((page.assets) && (page.assets.id)) {
            var am = getAssetManager(ctx);
            var info = page.assets;
            info.versions = [];
            var versions;
            var asset;
            var entry;
            versions = am.getAssetGroup(page.assets || {});
            versions.sort(function(a1, a2) {
                return am.compareVersions(a1, a2);
            });
            for (var index = 0; index < versions.length; index++) {
                asset = versions[index];
                if (asset.id !== page.assets.id) {
                    entry = {};
                    entry.id = asset.id;
                    entry.name = asset.name;
                    entry.version = asset.version;
                    entry.assetURL = utils.buildAssetPageUrl(ctx.assetType, '/details/' + entry.id);
                    info.versions.push(entry);
                }
            }
            info.isDefault = am.isDefaultAsset(page.assets);
            info.hasMultipleVersions = (info.versions.length > 0) ? true : false;
        }
    };
    var getAssetManager = function(ctx) {
        //       var asset = require('rxt').asset;
        var am;
        var resources = tenantApi.createTenantAwareAssetResources(ctx.session, {
            type: ctx.assetType
        });
        am = resources.am;
        //        var uriMatcher = new URIMatcher(request.getRequestURI());
        //        var tenantedAssetPageUrl = constants.TENANT_URL_PATTERN;// '/{context}/t/{domain}/{+any}';
        //        var superTenantUrl = constants.DEFAULT_SUPER_TENANT_URL_PATTERN;//  = '/{context}/{+any}';
        //        var opts = uriMatcher.match(tenantedAssetPageUrl) || uriMatcher.match(superTenantUrl);
        //        var carbon = require('carbon');
        //        var URLTenantId = carbon.server.tenantId({domain: getDomainFromURL(request)});
        //        if (ctx.isAnonContext || ctx.tenantId != URLTenantId) {
        //            am = asset.createAnonAssetManager(ctx.session, ctx.assetType, URLTenantId);
        //        }else {
        //            am = asset.createUserAssetManager(ctx.session, ctx.assetType);
        //        }
        //        if (ctx.isAnonContext) {
        //            am = asset.createAnonAssetManager(ctx.session, ctx.assetType, ctx.tenantId);
        //        } else {
        //            am = asset.createUserAssetManager(ctx.session, ctx.assetType);
        //        }
        return am;
    };
    var fetchActiveAuthDetails = function(method, methods) {
        for (var key in methods) {
            if (key == method) {
                return methods[key];
            }
        }
        return null;
    };
    var twitterLink = function(assetUrl, asset) {
        var attr = asset.attributes || {};
        var description = attr.overview_description ? attr.overview_description : 'No description';
        return storeConstants.TWITTER_SHARE_LINK + description + '&url=' + assetUrl;
    };
    var facebookLink = function(assetUrl, asset) {
        return storeConstants.FACEBOOK_SHARE_LINK + assetUrl;
    };
    var gplusLink = function(assetUrl, asset) {
        return storeConstants.GPLUS_SHARE_LINK + assetUrl;
    };
    var diggitLink = function(assetUrl, asset) {
        return storeConstants.DIGG_SHARE_LINK + assetUrl;
    };
}());