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
var pageDecorators = {};
(function(pageDecorators) {
    var log = new Log();
    var isActivatedAsset = function(assetType, tenantId) {
        var app = require('rxt').app;
        var activatedAssets = app.getUIActivatedAssets(tenantId); //ctx.tenantConfigs.assets;
        //return true;
        if (!activatedAssets) {
            throw 'Unable to load all activated assets for current tenant: ' + tenatId + '.Make sure that the assets property is present in the tenant config';
        }
        for (var index in activatedAssets) {
            if (activatedAssets[index] == assetType) {
                return true;
            }
        }
        return false;
    };
    pageDecorators.navigationBar = function(ctx, page, utils) {
        var permissionAPI = require('rxt').permissions;
        var ribbon = page.ribbon = {};
        var DEFAULT_ICON = 'icon-cog';
        var assetTypes = [];
        var assetType;
        var assetList = ctx.rxtManager.listRxtTypeDetails();
        for (var index in assetList) {
            assetType = assetList[index];
            //Only populate the link if the asset type is activated and the logged in user has permission to that asset
            if ((isActivatedAsset(assetType.shortName, ctx.tenantId)) && (permissionAPI.hasAssetPermission(permissionAPI.ASSET_LIST, assetType.shortName, ctx.session))) {
                assetTypes.push({
                    url: utils.buildAssetPageUrl(assetType.shortName, '/list'),
                    assetIcon: assetType.ui.icon || DEFAULT_ICON,
                    assetTitle: assetType.pluralLabel
                });
            }
        }
        ribbon.currentType = page.rxt.singularLabel;
        ribbon.currentTitle = page.rxt.singularLabel;
        ribbon.currentUrl = utils.buildAssetPageUrl(assetType.shortName, '/list'); //page.meta.currentPage;
        ribbon.shortName = page.rxt.singularLabel;
        ribbon.query = 'Query';
        ribbon.breadcrumb = assetTypes;
        return page;
    };
    pageDecorators.assetCategoryDetails = function(ctx, page, utils) {
        if (page.meta.pageName != 'list') {
            return;
        }
        page.assetCategoryDetails = {};
        page.assetCategoryDetails.hasCategories = false;
        page.assetCategoryDetails.values = [];
        var categoryField = ctx.rxtManager.getCategoryField(ctx.assetType);
        var categoryValues = [];
        var field = ctx.rxtManager.getRxtField(ctx.assetType, categoryField);
        var q = request.getParameter("q");
        if (q) {
            var options = parse("{" + q + "}");
            if (options.category) {
                page.assetCategoryDetails.selectedCategory = options.category;
            }
        }
        if (!field) {
            return;
        }
        var values = field.values[0].value;
        if (!values) {
            return;
        }
        for (var index = 0; index < values.length; index++) {
            categoryValues.push(values[index].value);
        }
        page.assetCategoryDetails.hasCategories = true;
        page.assetCategoryDetails.values = categoryValues;
    };
    pageDecorators.populateGroupingFeatureDetails = function(ctx, page) {
        page.groupingFeature = {};
        page.groupingFeature.isEnabled = ctx.rxtManager.isGroupingEnabled(ctx.assetType);
    };
    pageDecorators.populateAttachedLifecycles = function(ctx, page, utils) {
        var am = assetManager(ctx);
        //Check if an asset exists
        if ((page.assets) && (page.assets.id)) {
            var lifecycles; // = am.listAllAttachedLifecycles(page.assets.id);
            //TODO:Temp fix since the listAllAttachedLifecycles method does not
            //return all attached lifecycles
            var resource = am.am.registry.get(page.assets.path);
            if (!resource) {
                log.error('Unable to retrieve the attached lifecycle details');
                return;
            }
            lifecycles = resource.aspects();
            var lifecycle;
            var modifiedLifecycles = [];
            var entry;
            var lifecycleAPI = require('lifecycle').api;
            var possibleLifecycles = lifecycleAPI.getLifecycleList(ctx.tenantId);
            for (var index = 0; index < lifecycles.length; index++) {
                lifecycle = lifecycles[index];
                entry = {};
                entry.active = false;
                entry.name = lifecycle;
                if (String(page.assets.lifecycle) === String(lifecycle)) {
                    entry.active = true;
                }
                modifiedLifecycles.push(entry);
            }
            var filtered = possibleLifecycles.filter(function(lifecycle) {
                for (var index = 0;index < modifiedLifecycles.length; index++) {
                    if (modifiedLifecycles[index].name == lifecycle) {
                        return false;
                    }
                }
                return true;
            });
            page.assets.possibleLifecycles = filtered;
            page.assets.availableLifecycles = modifiedLifecycles;
            page.assets.hasPossibleLifecycles = (filtered.length > 0) ? true : false;
            page.assets.hasMultipleLifecycles = (lifecycles.length > 1) ? true : false;
            page.meta.lifecycleMgtViewEnabled = ctx.rxtManager.isLifecycleMgtViewEnabled(ctx.assetType);
        }
    };
    pageDecorators.populateAssetVersionDetails = function(ctx, page, utils) {
        if ((page.assets) && (page.assets.id)) {
            var am = assetManager(ctx);
            var info = page.assets;
            info.versions = [];
            var versions;
            var asset;
            var assetInstance = am.get(page.assets.id);
            var entry;
            versions = am.getAssetGroup(assetInstance || {});
            versions.sort(function(a1, a2) {
                return am.compareVersions(a1, a2);
            });
            info.isDefault = am.isDefaultAsset(page.assets);
            info.version = assetInstance.version;
            for (var index = 0; index < versions.length; index++) {
                asset = versions[index];
                entry = {};
                entry.id = asset.id;
                entry.name = asset.name;
                entry.version = asset.version;
                entry.isDefault = am.isDefaultAsset(asset);
                if (asset.id == page.assets.id) {
                    entry.selected = true;
                    info.version = asset.version;
                } else {
                    entry.selected = false;
                }
                entry.assetURL = utils.buildAssetPageUrl(ctx.assetType, '/details/' + entry.id);
                info.versions.push(entry);
            }
            info.hasMultipleVersions = (info.versions.length > 0) ? true : false;
        }
    };
    pageDecorators.populateTagDetails = function(ctx,page,utils){
        var am = assetManager(ctx);
        if(log.isDebugEnabled()){
            log.debug('Fetching tags for asset : ' + page.assets.name);
        }
        page.assetTags = am.getTags(page.assets.id);
        if(log.isDebugEnabled()){
            log.debug(page.assetTags);
        }
    };
    pageDecorators.sorting = function (ctx, page, fields) {
        if(page.meta.pageName !== 'list'){
            return;
        }
        var attributes = ctx.rxtManager.getSortingAttributes(ctx.assetType);
        var queryString = request.getQueryString();
        var sortable = fields || attributes;
        var sortingList = [];
        var sortingListSelected = {};
        var sortBy = "createdDate";
        var sort = "-";
        if(queryString){
            var sortCombined = "";
            var parts = queryString.split('&');
            for(var i=0;i<parts.length;i++){
                if(parts[i].indexOf("=") != -1 ){
                    var params = parts[i].split("=");
                    if(params[0] == "sort"){
                        sortCombined = params[1];
                    }
                }
            }
            //sortCombined is a string in the format -overview_createdtime
            if(new RegExp("^[+]").test(sortCombined)){
                sort = "+";
                sortBy = sortCombined.substring(1);
            }else if(new RegExp("^[-]").test(sortCombined)){
                sort = "-";
                sortBy = sortCombined.substring(1);
            }
        }
        for(i=0;i<sortable.length;i++){
            var sortObj = {};
            sortObj.sortBy = sortable[i];
            sortObj.sort = "-";
            sortObj.active = false;
            sortObj.sortNext = "+";
            sortObj.sortIcon = "sorting_asc";
            if(sortable[i].name == sortBy) {
                if(sort == "+") {
                    sortingListSelected.helpIcon = "fw-sort-up margin-bottom-align";
                    sortObj.sortNext = "-";
                    sortObj.sortIcon = "sorting_asc";
                } else if(sort == "-") {
                    sortingListSelected.helpIcon = "fw-sort-down margin-top-align";
                    sortObj.sortNext = "+";
                    sortObj.sortIcon = "sorting_desc";
                }
                sortingListSelected.help = sortable[i].label;
                sortObj.active = true;
            }
            sortingList.push(sortObj);
        }
        page.sorting = {selected:sortingListSelected,list:sortingList};
        return page;
    };
    pageDecorators.hideEmptyTables = function(ctx,page,type){
        var table;
        var tables = page.assets.tables||[];
        for(var tableIndex=0; tableIndex < tables.length; tableIndex++){
            table = tables[tableIndex];
            table.renderingMetaData = {};
            if(isEmptyTable(table)){
                table.renderingMetaData.emptyTable = true;
            }
        }
    };
    pageDecorators.populateAssetPageBreadcrumb = function(ctx,page,utils){
        var Breadcrumb = require('rxt').app.Breadcrumb;
        var breadcrumb = new Breadcrumb(page.breadcrumb);

        if(!page.rxt) {
            return;
        }
        breadcrumb.crumb(page.rxt.pluralLabel.toUpperCase(),utils.buildUrl('list'));
        if(!page.assets.name) {
            page.breadcrumb  = breadcrumb.build();
            return;
        }
        breadcrumb.crumb(page.assets.name.toUpperCase(),utils.buildUrl('details')+'/'+page.assets.id);
        if (page.assets.version) {
            breadcrumb.crumb(page.assets.version, utils.buildUrl('details') + '/' + page.assets.id);
        }
        page.breadcrumb = breadcrumb.build();
    };
    /**
     * This method will check for taxonomies availability in rxt definition
     * @param ctx request meta data
     * @param page page data
     */
    pageDecorators.taxonomyAvailability = function (ctx, page) {
        var rxtModule = require('rxt');
        var coreApi = rxtModule.core;
        var rxtManager = coreApi.rxtManager(ctx.tenantId);
        page.taxonomyAvailability = (rxtManager.getTaxonomyAvailability(ctx.assetType).length > 0);
    };
    var isEmptyTable = function(table){
        var field;
        var fields = table.fields;
        for(var fieldKey in fields){
            field = fields[fieldKey];
            if(field.hasOwnProperty('value')){
                return false;
            }
        }
        return true;
    };
    var assetManager = function(ctx) {
        var rxt = require('rxt');
        var type = ctx.assetType;
        var am = rxt.asset.createUserAssetManager(ctx.session, type);
        return am;
    };
}(pageDecorators));
