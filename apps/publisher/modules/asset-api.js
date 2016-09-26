/*
 * Copyright (c) WSO2 Inc. (http://wso2.com) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
 Description:The apis-asset-manager is used to retriew assets for api calls
 Filename: asset_api.js
 Created Date: 7/24/2014
 */
var api = {};
var result;
(function (api) {
    var utils = require('utils');
    var rxtModule = require('rxt');
    var metrics = require('carbon-metrics').metrics;
    var log = new Log('asset_api');
    var exceptionModule = utils.exception;
    var constants = rxtModule.constants;
    var CONTENT_TYPE_JSON = 'application/json';
    /**
     *
     * @param  fieldParam   The raw string comes as field parameter of the request
     * @return Array of fields which are required to be filtered out from assets
     */
    var getExpansionFileds = function (fieldParam) {
        var rawFields = fieldParam.split(','); //set fields
        for (var fieldIndex = 0; fieldIndex < rawFields.length; fieldIndex++) {
            rawFields[fieldIndex] = rawFields[fieldIndex].trim();
        }
        return rawFields;
    };
    var getRxtManager = function (session, type) {
        var context = rxtModule.core.createUserAssetContext(session, type);
        return context.rxtManager;
    };
    /**
     * The function filter the requested fields from assets objects and build new asset object with requested fields
     * @param  options   The object contains array of required fields and array of assets for filtering fields
     */
    var fieldExpansion = function (options) {
        var fields = options.fields;
        var artifacts = options.assets;
        var artifact;
        var asset;
        var field;
        var modifiedAssets = [];
        for (var artifactIndex = 0; artifactIndex < artifacts.length; artifactIndex++) {
            artifact = artifacts[artifactIndex];
            asset = {};
            for (var feildIndex = 0; feildIndex < fields.length; feildIndex++) {
                field = fields[feildIndex];
                //First check if the field is top level in the artifact
                if (artifact.hasOwnProperty(field)) {
                    asset[field] = artifact[field];
                } else {
                    //Check if the appears in the attributes property
                    if (artifact.attributes && artifact.attributes.hasOwnProperty(field)) {
                        //if asset.attribute key is available copy it to attributes variable, if not initialize asset.attributes
                        var attributes = asset.attributes ? asset.attributes : (asset.attributes = {});
                        attributes[field] = artifact.attributes[field];
                    }
                }
            }
            modifiedAssets.push(asset); // add asset to the list
        }
        return modifiedAssets; // return the asset list
    };
    /**
     * This function put asset to the storage
     * @param am The asset manager instance
     * @param asset The asset to be saved
     */
    var putInStorage = function (asset, am, tenantId) {
        var resourceFields = am.getAssetResources();
        var ref = utils.file;
        var storageModule = require('/modules/data/storage.js').storageModule();
        //var storageConfig = require('/config/storage.json');
        var storageManager = new storageModule.StorageManager({
//            context: 'storage',
//            isCached: false,
//            connectionInfo: {
//                dataSource: storageConfig.dataSource
//            }
        });
        var resource = {};
        var extension = '';
        var resourceName;
        var key;
        //Get all of the files that have been sent in the request
        var files = request.getAllFiles();
        if (!files) {
            if (log.isDebugEnabled()) {
                log.debug('User has not provided any resources such any new images or files when updating the asset with id ' + asset.id);
            }
            return false;
        }
        for (var index in resourceFields) {
            key = resourceFields[index];
            if (files[key]) {
                resource = {};
                resource.file = files[key];
                resource.tenantId = tenantId;
                resource.assetId = asset.id;
                resource.fieldName = key;
                resource.type = am.type;
                extension = ref.getExtension(files[key]);
                resource.contentType = ref.getMimeType(extension);
                resourceName = storageManager.put(resource);
                asset.attributes[key] = resourceName;
            }
        }
        return true;
    };
    /**
     * The function get current asset in the storage
     * @param original  The current asset resources available in the store
     * @param asset     The new asset resources to continue with updating
     */
    var putInOldResources = function (original, asset, am) {
        var resourceFields = am.getAssetResources();
        var resourceField;
        for (var index in resourceFields) {
            resourceField = resourceFields[index];
            //If the asset attribute value is null then use the old resource
            //            if ((!asset.attributes[resourceField]) || (asset.attributes[resourceField] == '')) {
            if (!asset.attributes[resourceField] && original.attributes[resourceField]) {
                if (log.isDebugEnabled()) {
                    log.debug('Copying old resource attribute value for ' + resourceField);
                }
                asset.attributes[resourceField] = original.attributes[resourceField];
            }
        }
    };
    /**
     *Check whether key:value available in data
     */
    var isPresent = function (key, data) {
        return (data[key]) || (data[key] == '');
    };
    /**
     * Alters the user provided resource to keep unchangable values as they are.
     * Performs the following alterations
     * 1. Required values are populated with original values if the user has not provided a value
     * 2. Replaces any user provided values with original valus for readonly and auto fields
     * (This prevents users from changing non updateable fields)
     * @param  original old asset
     * @param  asset    asset
     * @param  sentData to change
     * @return The updated-asset
     */
    var putInUnchangedValues = function (original, asset, sentData,rxtManager,type) {
        var definition;
        for (var key in original.attributes) {
            definition =  rxtManager.getRxtField(type,key);
            if(definition){
                
                if(definition.required){
                    //Check if the user has provided a value for the required value if
                    //not use the original value
                    asset.attributes[key] = (asset.attributes.hasOwnProperty(key))? asset.attributes[key] : original.attributes[key];
                }

                //Determine if the field is readonly or auto.if yes then ignore
                //the user provided value and use the original value
                if((definition.readonly)||(definition.auto)||(definition.hidden)){
                    asset.attributes[key] = original.attributes[key];
                }

            }
        }
    };
    var extractMetaProps = function (asset) {
        var meta = {};
        for (var key in asset) {
            if (key.charAt(0) === '_') {
                meta[key] = asset[key];
            }
        }
        if (meta.hasOwnProperty(constants.Q_PROP_DEFAULT)) {
            meta[constants.Q_PROP_DEFAULT] = true;
        }
        return meta;
    };
    var setMetaProps = function (asset, meta) {
        for (var key in meta) {
            asset[key] = meta[key];
        }
    };
    var processContentType = function (contentType) {
        var comps = contentType.split(';');
        return comps[0];
    };
    var processRequestBody = function (req, assetReq) {
        var contentType = processContentType(req.getContentType());
        if (contentType !== CONTENT_TYPE_JSON) {
            return assetReq;
        }
        var params = req.getContent();
        for (var key in params) {
            assetReq[key] = params[key];
        }
        return assetReq;
    };
    var processTags = function (assetReq) {
        if (assetReq._tags) {
            return assetReq._tags;
        } else {
            return [];
        }
    };
    var processTaxa = function (assetReq) {
        if (assetReq._taxa) {
            return assetReq._taxa.split(',');
        } else {
            return [];
        }
    };
    var validateEditableFeilds = function (type, assetReq) {
        //Obtain the field definitions for each of the fields
        var rxtManager = rxtModule.core.rxtManager(user.tenantId);
        for (var key in assetReq) {
            var fieldName = key;
            var field = rxtManager.getRxtField(type, fieldName);
            if (field && (field.readonly || field.auto)) {
                var errMsg = fieldName + ' is not an editable field. Hence, ' + fieldName + ' cannot be updated with the provided value : ' + assetReq[fieldName];
                if(log.isDebugEnabled()){
                    log.debug(errMsg);
                }

                throw exceptionModule.buildExceptionObject(errMsg, constants.STATUS_CODES.BAD_REQUEST);
                //delete assetReq[fieldName];
            }
        }
        return assetReq;
    };

    var validateProvider = function (type, assetReq,user) {
        var rxtManager = rxtModule.core.rxtManager(user.tenantId);
        var provider = rxtManager.getProviderAttribute(type);
        var storeModule = require('store');
        if(provider && provider.length >1 && assetReq.hasOwnProperty('attributes')){
            assetReq.attributes[provider] = storeModule.user.cleanUsername(user.username);
        }
    };

    //moved this logic to rxt.asset module
    var validateRequiredFeilds = function (type, assetReq) {
        var rxtManager = rxtModule.core.rxtManager(user.tenantId);
        /*var name = rxtManager.getNameAttribute(type);
         if(name && name.length >1){
         validateRequiredFeild(name, assetReq);
         }
         var version = rxtManager.getVersionAttribute(type);
         if(version && version.length >1){
         validateRequiredFeild(version, assetReq);
         }*/
        var provider = rxtManager.getProviderAttribute(type);
        if(provider && provider.length >1 && assetReq.hasOwnProperty('attributes')){
            assetReq.attributes[provider] = user.username;
        }
        var fields = rxtManager.listRxtFields(type);
        for (var key in fields) {
            if (fields.hasOwnProperty(key)) {
                var field =  fields[key];
                log.info(field);
                if (field && field.name && field.required == "true" && field.name.fullName) {
                    validateRequiredFeild(field.name.fullName, assetReq);
                }
                if (field && field.name && field.validate && field.name.fullName) {
                    validateRegExField(field.name.fullName,assetReq, field.validate);
                }
            }
        }
    };

    var validateRegExField = function (fieldName, assetReq, regex) {
        var resources = request.getAllFiles();
        var value;
        if (assetReq.hasOwnProperty(fieldName)){
            value = assetReq[fieldName];
        }
        if (!value && assetReq.attributes.hasOwnProperty(fieldName)){
            value = assetReq.attributes[fieldName];
        }
        if (!value && resources && resources.hasOwnProperty(fieldName)){
            value = resources[fieldName];
        }
        var reg = new RegExp(regex);
        if (value != null && !reg.test(value)){
            var msg = fieldName + ' value is invalid. Please provide correct value for ' + fieldName ;
            throw exceptionModule.buildExceptionObject(msg, constants.STATUS_CODES.BAD_REQUEST);
        }
    };

    var validateRequiredFeild = function (feildName, assetReq) {
        var resources = request.getAllFiles();
        if ((!assetReq.hasOwnProperty(feildName)) && (!assetReq.attributes.hasOwnProperty(feildName)) && !(resources && resources.hasOwnProperty(feildName))){
            var msg = feildName + ' is not provided. Please provide a value for ' + feildName + ' since it is a required field';
            throw exceptionModule.buildExceptionObject(msg, constants.STATUS_CODES.BAD_REQUEST);
        }
    };

    /**
     * Adds a temporary value to mandatory file fields.The file field
     * is a synthetic field present only in the ES level.The Governance API
     * has no knowledge of this field type and it considers these fields merely as 
     * text fields.If any of these file fields are marked as required the Governance API will throw an error
     * if they do not contain a value.Since the file fields are put in storage after the asset is created this
     * leads to a situation where a mandatory file fields will cause an error during asset creation if they
     * do not contain a value.
     * @param {[type]} asset        [description]
     * @param {[type]} assetManager [description]
     * @param {[type]} rxtManager   [description]
     * @param {[type]} request      [description]
     */
    var addTempFileFieldValues = function(asset,assetManager,rxtManager,request){
        var fileFields = assetManager.getAssetResources();
        var files = request.getAllFiles()||[];
        var fieldInfo;
        //Iterate through all fields marked as required file field types and
        //then check if a file has been provided for it
        fileFields.forEach(function(fieldName){

            fieldInfo = rxtManager.getRxtField(assetManager.type,fieldName);
            //Check if the file with the same field name exists and it is required
            if((!files[fieldName])&&(fieldInfo&&fieldInfo.required)){
                throw 'Required field not provided';
            } else {
                //Populate a dummy value for the purpose of creating the asset
                asset.attributes[fieldName] = assetManager.getFileFieldPlaceholder();
            }
        });
    };

    /**
     * api to create a new asset
     * @param  options incoming values
     * @param  req     jaggery request
     * @param  res     jaggery response
     * @param  session  sessionId
     * @return The created asset or null if failed to create the asset
     */
    api.create = function (options, req, res, session) {
        metrics.start("asset-api","create");
        var assetModule = rxtModule.asset;
        var am = assetModule.createUserAssetManager(session, options.type);
        var assetReq = req.getAllParameters('UTF-8'); //get asset attributes from the request
        var server = require('store').server;
        var user = server.current(session);
        var asset = null;
        var meta;
        var tags;
        var rxtManager = getRxtManager(session, options.type);
        var isLCEnabled = false;
        var isDefaultLCEnabled = false;
        var ctx = rxtModule.core.createUserAssetContext(session, options.type);
        var createdAsset;
        assetReq = processRequestBody(req, assetReq);
        var taxa = processTaxa(assetReq);
        tags = processTags(assetReq);
        if (request.getParameter("asset")) {
            asset = parse(request.getParameter("asset"));
        } else {
            meta = extractMetaProps(assetReq);
            asset = am.importAssetFromHttpRequest(assetReq);
            setMetaProps(asset, meta);
        } //generate asset object
        try {
            //throw 'This is to stop asset creation!';
            if (log.isDebugEnabled()) {
                log.debug('Creating Asset : ' + stringify(asset));
            }
            validateProvider(options.type, asset,user);
            //validateRequiredFeilds(options.type, asset)
            addTempFileFieldValues(asset,am,rxtManager,req);
            am.create(asset);
            createdAsset = am.get(asset.id);
            am.postCreate(createdAsset, ctx);
            if (putInStorage(createdAsset, am, user.tenantId)) { //save to the storage
                am.update(createdAsset);
            }
        } catch (e) {
            if (e.hasOwnProperty('message') && e.hasOwnProperty('code')) {
                throw e;
            }
            log.error('Asset '+ stringify(asset) + 'of type: ' + options.type + ' was not created due to ', e);
            return null;
        } finally {
            metrics.stop();
        }
        //Attempt to apply tags
        if (tags.length > 0) {
            am.addTags(asset.id, tags);
        }

        if (taxa.length > 0) {
            for (var i = 0; i < taxa.length; i++) {
                am.addTaxa(asset.id, taxa[i]);
            }
        }

        //Check if lifecycles are enabled
        isLCEnabled = rxtManager.isLifecycleEnabled(options.type);
        if (!isLCEnabled) {
            return asset;
        }
//        isDefaultLCEnabled = rxtManager.isDefaultLifecycleEnabled(options.type);
//        if (!isDefaultLCEnabled) {
//            return asset;
//        }
        //Continue attaching the lifecycle
        var isLcAttached = am.attachLifecycle(asset);
        //Check if the lifecycle was attached
        if (isLcAttached) {
            var synched = am.synchAsset(asset);
            if (synched) {
                am.invokeDefaultLcAction(asset);
            } else {
                log.warn('Failed to invoke default action as the asset could not be synched.')
            }
        }
        metrics.stop();
        return asset;
    };
    /**
     * The function to update an existing asset via api
     * @param  options  incoming
     * @param  req      jaggery-request
     * @param  res      jaggery-response
     * @param  session  sessionID
     * @return updated-asset
     */
    api.update = function (options, req, res, session) {
        metrics.start("asset-api","update");
        var assetModule = rxtModule.asset;
        var am = assetModule.createUserAssetManager(session, options.type);
        var rxtManager = getRxtManager(session,options.type);
        var server = require('store').server;
        var user = server.current(session);
        var result;
        var assetReq = req.getAllParameters('UTF-8');
        var taxa;

        //TODO this code should be improve for each and every content type
        if (req.getContentType() === "application/json") {
            assetReq = processRequestBody(req, assetReq);
            taxa = processTaxa(assetReq);
        }
        assetReq = processRequestBody(req, assetReq);
        taxa = processTaxa(assetReq);
        //assetReq = validateEditableFeilds(options.type, assetReq);

        var asset = null;
        var meta;
        if (request.getParameter("asset")) {
            asset = parse(request.getParameter("asset"));
            asset.attributes = validateEditableFeilds(options.type, asset.attributes);
        } else {
            meta = extractMetaProps(assetReq);
            asset = am.importAssetFromHttpRequest(assetReq);
        }
        var original = null;
        asset.id = options.id;
        try {
            original = am.get(options.id);
        } catch (e) {
            asset = null;
            var msg = 'Unable to locate the asset with id: ' + options.id;
            log.error(msg);
            if (log.isDebugEnabled()) {
                log.debug(e);
            }
            throw exceptionModule.buildExceptionObject(msg, constants.STATUS_CODES.NOT_FOUND);
        } finally {
            metrics.stop();
        }
        if (original) {
            putInStorage(asset, am, user.tenantId);
            putInOldResources(original, asset, am); //load current asset values
            putInUnchangedValues(original, asset, assetReq,rxtManager,options.type);
            //If the user has not uploaded any new resources then use the old resources
            if (!asset.name) {
                asset.name = am.getName(asset);
            }
            try {
                //Set any meta properties provided by the API call (e.g. _default)
                setMetaProps(asset, meta);
                result = am.update(asset);
                //asset.result=result;
            } catch (e) {
                asset = null;
                var errMassage = 'Failed to update the asset of id:' + options.id;
                log.error(e);
                if (log.isDebugEnabled()) {
                    log.debug('Failed to update the asset ' + stringify(asset));
                }
                throw exceptionModule.buildExceptionObject(errMassage, constants.STATUS_CODES.INTERNAL_SERVER_ERROR);
            } finally {
                metrics.stop();
            }
            // This will get current taxa for an asset. It will remove all current taxa list and re apply new list.
            //TODO:Try to improve here performance
            var currentTaxa = am.getTaxa(asset.id);
            for (var i = 0; i < currentTaxa.length; i++) {
                am.removeTaxa(asset.id, currentTaxa[i]);
            }

            if (taxa.length > 0) {
                for (var j = 0; j < taxa.length; j++) {
                    am.addTaxa(asset.id, taxa[j]);
                }
            }

        }
        metrics.stop();
        return result || asset;
    };
    /**
     *
     * @param sortParam The sort query parameter comes with request
     * @param paging    Paging object populated with default paging values
     */
    var populateSortingValues = function (sortParam, paging) {
        var constants = rxtModule.constants;
        var sortBy;
        if (sortParam) {
            var order = sortParam.charAt(0);
            if (order == '+' || order == ' ') { // ascending
                paging.sortOrder = constants.Q_SORT_ORDER_ASCENDING; //TODO get as constants
                sortBy = sortParam.slice(1);
            } else if (order == '-') { //descending
                paging.sortOrder = constants.Q_SORT_ORDER_DESCENDING;
                sortBy = sortParam.slice(1);
            }
            paging.sortBy = (sortBy || paging.sortBy);
        }
    };

    /**
     * This function id to validate and build the query object from the string
     * @param query This is the query string to be parsed
     * @return Returns the parsed Json object containing query
     */
    function validateQuery(query) {
        var q = {};
        try {
            q = parse(query);
        } catch (e) {
            log.error("Invalid Query \'" + query + "\'");
            if (log.isDebugEnabled()) {
                log.debug(e);
            }
        }
        return q;
    }

    /**
     * Checks if the user has provided a grouping query parameter and then
     * changes the query to do a group search
     * @param {[type]} q          [description]
     * @param {[type]} type       [description]
     * @param {[type]} req        [description]
     * @param {[type]} rxtManager [description]
     */
    var addGroupingStateToQuery = function (q, type, req, rxtManager) {
        if (!rxtManager.isGroupingEnabled(type)) {
            return q;
        }
        //Check if grouping is enabled for the asset type
        var groupQuery = req.getParameter('group');
        if (groupQuery) {
            q[constants.Q_PROP_GROUP] = groupQuery;
        }
        return q;
    };
    /**
     * The function search for assets
     * @param req      The request
     * @param res      The response
     * @param options  Object containing parameters
     * @param session sessionID
     */
    api.search = function (options, req, res, session) {
        var asset = rxtModule.asset;
        var assetManager = asset.createUserAssetManager(session, options.type);
        var sort = (request.getParameter("sort") || '');
        var paging = rxtModule.constants.DEFAULT_ASSET_PAGIN;
        var server = require('store').server;
        var user = server.current(session);
        var rxtManager = rxtModule.core.rxtManager(user.tenantId);
        populateSortingValues(sort, paging); // populate sortOrder and sortBy
        paging.count = (request.getParameter("count") || paging.count);
        paging.start = (request.getParameter("start") || paging.start);
        paging.paginationLimit = (request.getParameter("paginationLimit") || paging.paginationLimit);
        var q = (request.getParameter("q") || '');
        try {
            metrics.start("asset-api","search");
            var assets;
            if (q) { //if search-query parameters are provided
                var qString = '{' + q + '}';
                var query = validateQuery(qString);
                query = replaceCategoryQuery(query, rxtManager, options.type);
                query = replaceNameQuery(query, rxtManager, options.type);
                if (log.isDebugEnabled) {
                    //Need to log this as we perform some processing on the name and
                    //category values
                    log.debug('processed query used for searching: ' + stringify(query));
                }
                assets = assetManager.search(query, paging); // asset manager back-end call with search-query
            } else {
                //If grouping is enabled then do a group search
                if (rxtManager.isGroupingEnabled(options.type)) {
                    assets = assetManager.searchByGroup();
                } else {
                    assets = assetManager.list(paging); // asset manager back-end call for asset listing
                }
            }
            var expansionFieldsParam = (request.getParameter('fields') || '');
            if (expansionFieldsParam) { //if field expansion is requested
                options.fields = getExpansionFileds(expansionFieldsParam); //set fields
                options.assets = assets; //set assets
                result = fieldExpansion(options); //call field expansion methods to filter fields
            } else {
                result = assets;
            }
        } catch (e) {
            result = null;
            log.error(e);
            if (log.isDebugEnabled()) {
                log.debug("Error while searching assets as for the request : " + req.getQueryString());
            }
        } finally {
            metrics.stop();
        }
        return result;
    };
    /**
     * Performs an advance search on assets
     * @param req      The request
     * @param res      The response
     * @param options  Object containing parameters
     * @param session sessionID
     */
    api.advanceSearch = function (options, req, res, session) {
        metrics.start("asset-api","advanceSearch");
        var asset = rxtModule.asset;
        var assetManager = asset.createUserAssetManager(session, options.type);
        var sort = (request.getParameter("sort") || '');
        var paging = rxtModule.constants.DEFAULT_ASSET_PAGIN;
        var server = require('store').server;
        var user = server.current(session);
        var rxtManager = rxtModule.core.rxtManager(user.tenantId);
        populateSortingValues(sort, paging); // populate sortOrder and sortBy
        paging.count = (request.getParameter("count") || paging.count);
        paging.start = (request.getParameter("start") || paging.start);
        paging.paginationLimit = (request.getParameter("paginationLimit") || paging.paginationLimit);
        var q = (request.getParameter("q") || '');
        var isGroupingEnabled = false;//Grouping is disabled by default
        try {
            var assets;
            if (q) { //if search-query parameters are provided
                var qString = '{' + q + '}';
                var query = validateQuery(qString);
                query = replaceCategoryQuery(query, rxtManager, options.type);
                isGroupingEnabled = rxtManager.isGroupingEnabled(options.type);
                if (isGroupingEnabled) {
                    query._group = true; //Signal grouping is enabled
                    query.default = true; //Required for grouping query
                }
                //query = replaceNameQuery(query, rxtManager, options.type);
                if (log.isDebugEnabled) {
                    //Need to log this as we perform some processing on the name and
                    //category values
                    log.debug('processed query used for searching: ' + stringify(query));
                    log.debug('grouping enabled: ' + isGroupingEnabled);
                }
                assets = assetManager.advanceSearch(query, paging); // asset manager back-end call with search-query
            } else {
                //If grouping is enabled then do a group search
                if (rxtManager.isGroupingEnabled(options.type)) {
                    assets = assetManager.searchByGroup();
                } else {
                    assets = assetManager.list(paging); // asset manager back-end call for asset listing
                }
            }
            var expansionFieldsParam = (request.getParameter('fields') || '');
            if (expansionFieldsParam) { //if field expansion is requested
                options.fields = getExpansionFileds(expansionFieldsParam); //set fields
                options.assets = assets; //set assets
                result = fieldExpansion(options); //call field expansion methods to filter fields
            } else {
                result = assets;
            }
        } catch (e) {
            result = null;
            log.error(e);
            if (log.isDebugEnabled()) {
                log.debug("Error while searching assets as for the request : " + req.getQueryString());
            }
        } finally {
            metrics.stop();
        }
        return result;
    };
    /**
     * Performs an asset independent advance search
     * @param  {[type]} options [description]
     * @param  {[type]} req     [description]
     * @param  {[type]} res     [description]
     * @param  {[type]} session [description]
     * @return {[type]}         [description]
     */
    api.genericAdvanceSearch = function (options, req, res, session) {
        var assetAPI = rxtModule.asset;
        var sort = (request.getParameter("sort") || '');
        var paging = rxtModule.constants.DEFAULT_ASSET_PAGIN;
        var server = require('store').server;
        var user = server.current(session);
        var rxtManager = rxtModule.core.rxtManager(user.tenantId);
        populateSortingValues(sort, paging); // populate sortOrder and sortBy
        paging.count = (request.getParameter("count") || paging.count);
        paging.start = (request.getParameter("start") || paging.start);
        paging.paginationLimit = (request.getParameter("paginationLimit") || paging.paginationLimit);
        var q = (request.getParameter("q") || '');
        var result = [];
        try {
            metrics.start("asset-api","genericAdvanceSearch");
            var assets;
            if (!q) { //if search-query parameters are not provided
                q = '"name":""';
            }
                var qString = '{' + q + '}';
                var query = validateQuery(qString);
                if (log.isDebugEnabled) {
                    //Need to log this as we perform some processing on the name and
                    //category values
                    log.debug('processed query used for searching: ' + stringify(query));
                }
                //TODO: The generic advance search does not honour grouping
                //as grouping can be enabled/disabled per asset type
                assets = assetAPI.advanceSearch(query, paging, session); // asset manager back-end call with search-query

            var expansionFieldsParam = (request.getParameter('fields') || '');
            if (expansionFieldsParam) { //if field expansion is requested
                options.fields = getExpansionFileds(expansionFieldsParam); //set fields
                options.assets = assets; //set assets
                result = fieldExpansion(options); //call field expansion methods to filter fields
            } else {
                result = assets;
            }
        } catch (e) {
            result = null;
            log.error(e);
            if (log.isDebugEnabled()) {
                log.debug("Error while searching assets as for the request : " + req.getQueryString());
            }
        } finally {
            metrics.stop();
        }
        return result;
    };
    var replaceCategoryQuery = function (q, rxtManager, type) {
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
    var replaceNameQuery = function (q, rxtManager, type) {
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
    /**
     * The function get an asset by id
     * @param options  Object containing parameters id, type
     * @param req      Jaggery request
     * @param res      Jaggery response
     * @param session  A string containing sessionID
     * @return The retrieved asset or null if an asset not found
     */
    api.get = function (options, req, res, session) {
        metrics.start("asset-api","get");
        var asset = rxtModule.asset;
        var assetManager = asset.createUserAssetManager(session, options.type);
        try {
            var retrievedAsset = assetManager.get(options.id); //backend call to get asset by id
            if (!retrievedAsset) {
                return null;
            } else {
                var expansionFieldsParam = (request.getParameter('fields') || '');
                if (expansionFieldsParam) { //if field expansion requested
                    options.fields = getExpansionFileds(expansionFieldsParam); //set fields
                    var assets = [];
                    assets.push(retrievedAsset);
                    options.assets = assets;
                    result = fieldExpansion(options)[0]; //call field-expansion to filter-out fields
                } else {
                    result = retrievedAsset;
                }
            }
        } catch (e) {
            result = null;
            log.error(e);
            if (log.isDebugEnabled()) {
                log.debug("Error while retrieving asset as for the request : " + req.getQueryString());
            }
        } finally {
            metrics.stop();
        }
        return result;
    };
    api.setDefaultAsset = function (options, req, res, session) {
        var asset = rxtModule.asset;
        //var assetManager = asset.creat
    };
    api.getGroup = function (options, req, res, session) {
    };
    /**
     * The function deletes an asset by id
     * @param options  Object containing parameters id, type
     * @param req      Jaggery request
     * @param res      Jaggery response
     * @param session  A string containing sessionID
     * @return Boolean value whether deleted or not
     */
    api.remove = function (options, req, res, session) {
        var asset = rxtModule.asset;
        var am = asset.createUserAssetManager(session, options.type);
        var retrievedAsset = api.get(options, req, res, session);
        if (!retrievedAsset) {
            log.error('Id not valid');
            return false;
        }
        try {
            am.remove(options.id); //call asset manager to remove asset
            return true;
        } catch (e) {
            log.error('Asset with id: ' + asset.id + ' was not deleted due to ', e);
            return false;
        }
    };
}(api));
