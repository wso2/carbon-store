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
    pageDecorators.assetCategoryDetails = function(ctx, page, utils) {
        page.assetCategoryDetails = {};
        page.assetCategoryDetails.hasCategories = false;
        page.assetCategoryDetails.values = [];
        var categoryField = ctx.rxtManager.getCategoryField(ctx.assetType);
        var categoryValues = [];
        var field = ctx.rxtManager.getRxtField(ctx.assetType, categoryField);
        var q = request.getParameter("q");
        if(q) {
            var options = parse("{"+q+"}");
            if(options.category){
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
            for (var index = 0; index < lifecycles.length; index++) {
                lifecycle = lifecycles[index];
                entry = {};
                entry.active = false;
                entry.name = lifecycle;
                if (page.assets.lifecycle === lifecycle) {
                    entry.active = true;
                }
                modifiedLifecycles.push(entry);
            }
            page.assets.availableLifecycles = modifiedLifecycles;
            page.assets.hasMultipleLifecycles = (lifecycles.length > 1) ? true : false;
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
                }else{
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
        log.info('Fetching tags!');
        page.assetTags = am.getTags(page.assets.id);
        log.info(page.assetTags);
    };
    var assetManager = function(ctx) {
        var rxt = require('rxt');
        var type = ctx.assetType;
        var am = rxt.asset.createUserAssetManager(ctx.session, type);
        return am;
    };
}(pageDecorators));