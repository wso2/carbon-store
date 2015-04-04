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
    pageDecorators.populateAttachedLifecycles = function(ctx, page, utils) {
        var am = assetManager(ctx);
        //Check if an asset exists
        if ((page.assets) && (page.assets.id)) {
            var lifecycles = am.listAllAttachedLifecycles(page.assets.id);
            var lifecycle;
            var modifiedLifecycles = [];
            var entry ;
            for (var index = 0; index < lifecycles.length; index++) {
                lifecycle = lifecycles[index];
                entry = {};
                entry.active = false;
                entry.name = lifecycle;
                if(page.assets.lifecycle ===  lifecycle){
                    entry.active = true;
                }
                modifiedLifecycles.push(entry);
            }
            modifiedLifecycles.push({"active":false,"name":"SampleLifeCycle2"});
            modifiedLifecycles.push({"active":false,"name":"MobileAppLifeCycle"});
            modifiedLifecycles.push({"active":false,"name":"MockLifecycle"});
            page.assets.availableLifecycles = modifiedLifecycles;
            page.assets.hasMultipleLifecycles = true;//(lifecycles.length > 1) ? true : false;
        }
    };
    var assetManager = function(ctx) {
        var rxt = require('rxt');
        var type = ctx.assetType;
        var am = rxt.asset.createUserAssetManager(ctx.session, type);
        return am;
    };
}(pageDecorators));