/*
 * Copyright (c) WSO2 Inc. (http://wso2.com) All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */
asset.manager = function(ctx) {
    var notifier = require('store').notificationManager;
    var storeConstants = require('store').storeConstants;
    var COMMENT = 'User comment';
    var carbon = require('carbon');
    var social = carbon.server.osgiService('org.wso2.carbon.social.core.service.SocialActivityService');
    var log = new Log('default-asset');
    return {
        create: function(options) {
            var ref = require('utils').time;
            //Check if the options object has a createdtime attribute and populate it
            if ((options.attributes) && ctx.rxtManager.getRxtField(ctx.assetType, 'overview_createdtime')) {
                options.attributes.overview_createdtime = ref.getCurrentTime();
            }
            this._super.create.call(this, options);
            var asset = this.get(options.id); //TODO avoid get: expensive operation
            var assetPath = asset.path;
            var user = ctx.username;
            var userRoles = ctx.userManager.getRoleListOfUser(user);
            try {
                social.warmUpRatingCache(ctx.assetType + ':' + options.id);
            } catch (e) {
                log.warn("Unable to publish the asset: " + ctx.assetType + ":" + options.id + " to social cache. This may affect on sort by popularity function.");
            }
            //Check whether the user has admin role
            var endpoint = storeConstants.PRIVATE_ROLE_ENDPOINT + user;
            for (var role in userRoles) {
                if (userRoles.hasOwnProperty(role) && userRoles[role] == storeConstants.ADMIN_ROLE) {
                    endpoint = storeConstants.ADMIN_ROLE_ENDPOINT;
                }
            }
            //Subscribe the asset author for LC update event and asset update event
            notifier.subscribeToEvent(options.attributes.overview_provider, assetPath, endpoint, storeConstants.LC_STATE_CHANGE);
            notifier.subscribeToEvent(options.attributes.overview_provider, assetPath, endpoint, storeConstants.ASSET_UPDATE);
        },
        update: function(options) {
            this._super.update.call(this, options);
            var asset = this.get(options.id); //TODO avoid get: expensive operation
            //trigger notification on asset update
            notifier.notifyEvent(storeConstants.ASSET_UPDATE_EVENT, asset.type, asset.name, null, asset.path, ctx.tenantId);
        },
        search: function(query, paging) {
            return this._super.search.call(this, query, paging);
        },
        list: function(paging) {
            return this._super.list.call(this, paging);
        },
        get: function(id) {
            return this._super.get.call(this, id);
        },
        invokeLcAction: function(asset, action, lcName) {
            var success;
            if (lcName) {
                success = this._super.invokeLcAction.call(this, asset, action, lcName);
            } else {
                success = this._super.invokeLcAction.call(this, asset, action);
            }
            //trigger notification on LC state change
            notifier.notifyEvent(storeConstants.LC_STATE_CHANGE_EVENT, asset.type, asset.name, COMMENT, asset.path, ctx.tenantId);
            return success;
        }
    };
};
asset.server = function(ctx) {
    var type = ctx.type;
    return {
        onUserLoggedIn: function() {},
        endpoints: {
            apis: [{
                url: 'assets',
                path: 'assets.jag'
            }, {
                url: 'asset',
                path: 'asset.jag'
            }, {
                url: 'statistics',
                path: 'statistics.jag'
            }],
            pages: [{
                title: 'Asset: ' + type,
                url: 'asset',
                path: 'asset.jag'
            }, {
                title: 'Assets ' + type,
                url: 'assets',
                path: 'assets.jag'
            }, {
                title: 'Create ' + type,
                url: 'create',
                path: 'create.jag'
            }, {
                title: 'Update ' + type,
                url: 'update',
                path: 'update.jag'
            }, {
                title: 'Details ' + type,
                url: 'details',
                path: 'details.jag'
            }, {
                title: 'List ' + type,
                url: 'list',
                path: 'list.jag'
            }, {
                title: 'Lifecycle',
                url: 'lifecycle',
                path: 'lifecycle.jag'
            }, {
                title: 'Old lifecycle ',
                url: 'old-lifecycle',
                path: 'old-lifecycle.jag'
            }, {
                title: 'Statistics',
                url: 'statistics',
                path: 'statistics.jag'
            }]
        }
    };
};
asset.configure = function() {
    return {
        table: {
            overview: {
                fields: {
                    provider: {
                        readonly: true
                    },
                    name: {
                        name: {
                            name: 'name',
                            label: 'Name'
                        },
                        updatable: false,
                        validation: function() {}
                    },
                    version: {
                        name: {
                            label: 'Version'
                        }
                    },
                    createdtime: {
                        hidden: true
                    }
                }
            },
            images: {
                fields: {
                    thumbnail: {
                        type: 'file'
                    },
                    banner: {
                        type: 'file'
                    }
                }
            }
        },
        meta: {
            lifecycle: {
                name: 'SampleLifeCycle2',
                commentRequired: false,
                defaultLifecycleEnabled:true,
                defaultAction: 'Promote',
                deletableStates: [],
                publishedStates: ['Published'],
                lifecycleEnabled: true
            },
            ui: {
                icon: 'icon-cog'
            },
            categories: {
                categoryField: 'overview_category'
            },
            thumbnail: 'images_thumbnail',
            banner: 'images_banner',
            versionAttribute: 'overview_version',
            providerAttribute: 'overview_provider',
            timestamp: 'overview_createdtime',
            grouping: {
                groupingEnabled: false,
                groupingAttributes: ['overview_name']
            }
        }
    };
};
asset.renderer = function(ctx) {
    var type = ctx.assetType;
    var isAssetWithLifecycle = function(asset){
        if((asset.lifecycle)&&(asset.lifecycleState)){
            return true;
        }
        log.warn('asset: '+asset.name+' does not have a lifecycle or a state.The lifecycle view will not be rendered for this asset');
        return false;
    };
    var buildListLeftNav = function(page, util) {
        var navList = util.navList();
        navList.push('Add ' + type, 'btn-add-new', util.buildUrl('create'));
        navList.push('Statistics', 'btn-stats', '/asts/' + type + '/statistics');
        //navList.push('Configuration', 'icon-dashboard', util.buildUrl('configuration'));
        return navList.list();
    };
    var buildDefaultLeftNav = function(page, util) {
        var id = page.assets.id;
        var navList = util.navList();
        var isLCViewEnabled = ctx.rxtManager.isLifecycleViewEnabled(ctx.assetType);
        navList.push('Edit', 'btn-edit', util.buildUrl('update') + '/' + id);
        navList.push('Overview', 'btn-overview', util.buildUrl('details') + '/' + id);
        //Only render the view if the asset has a 
        if ((isLCViewEnabled) && (isAssetWithLifecycle(page.assets))) {
            navList.push('Life Cycle', 'btn-lifecycle', util.buildUrl('lifecycle') + '/' + id);
        }
        return navList.list();
    };
    var buildAddLeftNav = function(page, util) {
        return [];
    };
    var isActivatedAsset = function(assetType) {
        var app = require('rxt').app;
        var activatedAssets = app.getActivatedAssets(ctx.tenantId); //ctx.tenantConfigs.assets;
        //return true;
        if (!activatedAssets) {
            throw 'Unable to load all activated assets for current tenant: ' + ctx.tenatId + '.Make sure that the assets property is present in the tenant config';
        }
        for (var index in activatedAssets) {
            if (activatedAssets[index] == assetType) {
                return true;
            }
        }
        return false;
    };
    return {
        list: function(page) {
            var assets = page.assets;
            for (var index in assets) {
                var asset = assets[index];
                var timestampAttribute = ctx.rxtManager.getTimeStampAttribute(ctx.assetType);
                if (asset.attributes.hasOwnProperty(timestampAttribute)) {
                    var value = asset.attributes[timestampAttribute];
                    var date = new Date();
                    date.setTime(value);
                    asset.attributes[timestampAttribute] = date.toUTCString();
                }
            }
            require('/modules/page-decorators.js').pageDecorators.assetCategoryDetails(ctx, page, this);
        },
        details: function(page) {
            var tables = page.assets.tables;
            //TODO:This cannot be hardcoded
            var timestampAttribute = 'createdtime'; //ctx.rxtManager.getTimeStampAttribute(this.assetType);
            for (var index in tables) {
                var table = tables[index];
                if ((table.name == 'overview') && (table.fields.hasOwnProperty(timestampAttribute))) {
                    var value = table.fields[timestampAttribute].value || '';
                    var date = new Date();
                    date.setTime(value);
                    table.fields[timestampAttribute].value = date.toUTCString();
                }
            }
        },
        create: function(page) {
            var tables = page.assets.tables;
            var providerAttribute = 'provider';
            for (var index in tables) {
                var table = tables[index];
                if ((table.name == 'overview') && (table.fields.hasOwnProperty(providerAttribute))) {
                    table.fields[providerAttribute].value = page.cuser.username;
                }
            }
        },
        update: function(page) {
            var tables = page.assets.tables;
            var timestampAttribute = 'createdtime';
            for (var index in tables) {
                var table = tables[index];
                if ((table.name == 'overview') && (table.fields.hasOwnProperty(timestampAttribute))) {
                    var value = table.fields[timestampAttribute].value;
                    var date = new Date();
                    date.setTime(value);
                    table.fields[timestampAttribute].value = date.toUTCString();
                }
            }
        },
        pageDecorators: {
            leftNav: function(page) {
                if (log.isDebugEnabled()) {
                    log.debug('Using default leftNav');
                }
                switch (page.meta.pageName) {
                    case 'list':
                        page.leftNav = buildListLeftNav(page, this);
                        break;
                    case 'create':
                        page.leftNav = buildAddLeftNav(page, this);
                        break;
                    case 'statistics':
                        page.leftNav = buildListLeftNav(page, this);
                        break;
                    default:
                        page.leftNav = buildDefaultLeftNav(page, this);
                        break;
                }
                if(page.leftNav){
                    for(var navItem in page.leftNav){
                        if(page.leftNav[navItem].name){
                            page.leftNav[navItem].id = page.leftNav[navItem].name.replace(/\s/g,"");
                        }
                    }
                }
                return page;
            },
            ribbon: function(page) {
                var ribbon = page.ribbon = {};
                var DEFAULT_ICON = 'icon-cog';
                var assetTypes = [];
                var assetType;
                var assetList = ctx.rxtManager.listRxtTypeDetails();
                for (var index in assetList) {
                    assetType = assetList[index];
                    if (isActivatedAsset(assetType.shortName)) {
                        assetTypes.push({
                            url: this.buildBaseUrl(assetType.shortName) + '/list',
                            assetIcon: assetType.ui.icon || DEFAULT_ICON,
                            assetTitle: assetType.singularLabel
                        });
                    }
                }
                ribbon.currentType = page.rxt.singularLabel;
                ribbon.currentTitle = page.rxt.singularLabel;
                ribbon.currentUrl = this.buildBaseUrl(type) + '/list'; //page.meta.currentPage;
                ribbon.shortName = page.rxt.singularLabel;
                ribbon.query = 'Query';
                ribbon.breadcrumb = assetTypes;
                return page;
            },
            populateAttachedLifecycles: function(page) {
                if (page.assets.id) {
                    require('/modules/page-decorators.js').pageDecorators.populateAttachedLifecycles(ctx, page, this);
                }
            },
            populateAssetVersionDetails: function(page) {
                if (page.assets.id) {
                    require('/modules/page-decorators.js').pageDecorators.populateAssetVersionDetails(ctx, page, this);
                }
            },
            populateGroupingFeatureDetails: function(page) {
                require('/modules/page-decorators.js').pageDecorators.populateGroupingFeatureDetails(ctx, page);
            }
        }
    };
};