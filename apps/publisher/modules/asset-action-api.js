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
var api = {};
(function(api) {
    var log = new Log();
    var ACTION_STATE = 'state';
    var ACTION_CHANGE_STATE = 'change-state';
    var ACTION_CHECKLIST = 'checklist';
    var ACTION_UPDATE_CHECKLIST = 'update-checklist';
    var ACTION_LC_HISTORY = 'lifecycle-history';
    var ACTION_ADD_TAGS = 'add-tags';
    var ACTION_REMOVE_TAGS = 'remove-tags';
    var ACTION_RETRIEVE_TAGS = 'tags';
    var ACTION_CREATE_VERSION = 'create-version';
    var HTTP_ERROR_NOT_IMPLEMENTED = 501;
    var CONTENT_TYPE_JSON = 'application/json';
    var MSG_ERROR_NOT_IMPLEMENTED = 'The provided action is not supported by this endpoint';
    var lifecycleAPI = require('/modules/lifecycle/lifecycle-api.js').api;
    var utils = require('utils');
    var rxtModule = require('rxt');
    var es = require("store").server;
    var tagsAPI = require('/modules/tags-api.js').api;
    var assetAPI = require('/modules/asset-api.js').api;        
    var utility = require('/modules/utility.js').rxt_utility();
    var exceptionModule = utils.exception;
    var constants = rxtModule.constants;
    var msg = function(code, message, data) {
        var obj = {};
        obj.code = code;
        obj.message = message;
        obj.data = data;
        return obj;
    };
    var successMsg = function(obj) {
        obj.success = true;
        return obj;
    };
    var errorMsg = function(obj) {
        obj.success = false;
        return obj;
    };
    var validateOptions = function(options) {
        if (!options.type) {
            var error = 'Unable to obtain state information without knowing the type of asset of id: ' + options.id;
            log.error(error);
            throw exceptionModule.buildExceptionObject(error, constants.STATUS_CODES.BAD_REQUEST);
        }
    };
    var parseContentType = function(contentTypString) {
        var comps = contentTypString.split(';');
        return comps[0];
    };
    /**
     * Allows request data to be sent in either the request body or
     * as url encoded query parameters
     * @param  {Object} req  Request object
     * @return {Object}      An object which contains data from request body and url encoded parameters
     */
    var obtainData = function(req) {
        var data = {};
        var contentType = parseContentType(req.getContentType());
        if (contentType === CONTENT_TYPE_JSON) {
            try {
                data = req.getContent();
            } catch (e) {
                log.error('Unable to obtain content from request', e);
            }
        }
        var params = req.getAllParameters('UTF-8');
        //Mix the content with request parameters
        for (var key in params) {
            data[key] = params[key];
        }
        return data;
    };
    api.state = function(req, res, session, options) {
        if (req.getMethod() !== 'GET') {
            return error(msg(405, 'State must be retrieved using a GET'));
        }
        validateOptions(options);
        var result = lifecycleAPI.getState(options, req, res, session);
        return successMsg(msg(200, 'Asset state information returned', result));
    };
    api.changeState = function(req, res, session, options) {
        var newState = null;
        var result = {};
        var data;
        var succcess;
        if (req.getMethod() !== 'POST') {
            return errorMsg(msg(405, 'State must be changed by a POST'));
        }
        data = obtainData(req);
        if (!data.nextState) {
            log.error('State change requires a nextState to be provided either as a query string or in the body of the request');
            return errorMsg(msg(400, 'State change requires a nextState to be provided either as a query string or in the body of the request'));
        }
        options.nextState = data.nextState;
        options.comment = data.comment;
        //Call the state change api
        success = lifecycleAPI.changeState(options, req, res, session);
        if (success) {
            //Obtain the next states
            result.newState = data.nextState;
            result.traversableStates = lifecycleAPI.traversableStates(options, req, res, session);
        }
        if (success) {
            return successMsg(msg(200, 'The assets state was changed', result));
        } else {
            return errorMsg(msg(500, 'The asset state was not changed'));
        }
    };
    api.updateCheckList = function(req, res, session, options) {
        var success;
        var body;
        if (!req.getContentType() === 'application/json') {
            throw 'Checklist items must be sent in the body of the request and content type should be set to application/json';
        }
        body = req.getContent();
        options.checkItems = body.checklist || [];
        success = lifecycleAPI.checkItems(options, req, res, session);
        if (success) {
            return successMsg(msg(200, 'The checklist was updated successfully'));
        }
        return errorMsg(msg(500, 'The checklist was not updated'));
    };
    api.lifecycleHistory = function(req, res, session, options) {
        var history = lifecycleAPI.getHistory(options, req, res, session);
        //var xmlHistoryContent = new XML(history.content);
        //var historyContent = utils.xml.convertE4XtoJSON(xmlHistoryContent)||{};
        return successMsg(msg(200, 'Lifecycle history retrieved successfully', history.item || []));
    };
    api.addTags = function(req, res, session, options) {
        var success;
        if(req.getMethod() !== 'POST'){
            return errorMsg(msg(405, 'Tags must be added by a POST'));
        }
        try {
            success = tagsAPI.addTags(req, res, session, options);
        } catch (e) {
            log.error(e);
        }
        if (success) {
            return successMsg(msg(200, 'Tags added successfully'));
        }
        return errorMsg(msg(500, 'Tags were not added'));
    };
    api.removeTags = function(req, res, session, options) {
        var success;
        if(req.getMethod() !== 'DELETE'){
            return errorMsg(msg(405, 'Tags must be removed using a DELETE'));
        }
        try {
            success = tagsAPI.removeTags(req, res, session, options);
        } catch (e) {
            log.error(e);
        }
        if (success) {
            return successMsg(msg(200, 'Tags removed successfully'));
        }
        return errorMsg(msg(500, 'Tags were not removed'));
    };
    api.tags = function(req, res, session, options) {
        var tags = [];
        var success;
        if(req.getMethod() !== 'GET'){
            return errorMsg(msg(405, 'Tags must be retrieved using a GET'));
        }
        try {
            tags = tagsAPI.tags(req,res,session,options);
            success = true;
        } catch(e){
            log.error(e);
        }
        if (success) {
            return successMsg(msg(200, 'Tags of the asset retrieved successfully', tags));
        }
        return errorMsg(msg(500, 'Tags were not retrieved'));
    };
    /**
     * api to create  a new version of the given asset
     * @param  options Object containing asset id, type, new version
     * @param  req     jaggery request
     * @param  res     jaggery response
     * @param  session  sessionId
     * @return The created asset or null if failed to create the asset
     */
    api.createVersion = function(req, res, session, options) {
        var asset;
        var createdAsset;
        var attributes;
        var assetModule = rxtModule.asset;
        var am = assetModule.createUserAssetManager(session, options.type);
        if(req.getMethod() !== 'POST'){
            return errorMsg(msg(405, 'Create version should be done using a POST'));
        }
        try {
            data = parse(req.getContent());
            asset = am.createVersion(options, data.attributes);
            if(asset){
                 tenantId = es.current(session).tenantId;
                var registry = es.systemRegistry(tenantId);

                if(registry.registry.resourceExists('/_system/governance/store/asset_resources/'+ options.type + '/' + options.id)){
                    registry.registry.copy('/_system/governance/store/asset_resources/'+ options.type + '/' + options.id,'/_system/governance/store/asset_resources/'+ options.type + '/' + asset);
                }
            }
            return successMsg(msg(200, 'New version created successfully.', asset));
        } catch (e) {
            log.error('Asset of type: ' + options.type + ' was not created due to ' ,e);
            return null;
        }
    };
    api.resolve = function(req, res, session, options) {
        var action = options.action;
        var result = errorMsg(msg(HTTP_ERROR_NOT_IMPLEMENTED, MSG_ERROR_NOT_IMPLEMENTED));
        switch (action) {
            case ACTION_STATE:
                result = api.state(req, res, session, options);
                break;
            case ACTION_CHANGE_STATE:
                result = api.changeState(req, res, session, options);
                break;
            case ACTION_UPDATE_CHECKLIST:
                result = api.updateCheckList(req, res, session, options);
                break;
            case ACTION_LC_HISTORY:
                result = api.lifecycleHistory(req, res, session, options);
                break;
            case ACTION_ADD_TAGS:
                result = api.addTags(req, res, session, options);
                break;
            case ACTION_REMOVE_TAGS:
                result = api.removeTags(req, res, session, options);
                break;
            case ACTION_RETRIEVE_TAGS:
                result = api.tags(req, res, session, options);
                break;
            case ACTION_CREATE_VERSION:
                result = api.createVersion(req, res, session, options);
                break;
            default:
                break;
        }
        return result;
    };
}(api));