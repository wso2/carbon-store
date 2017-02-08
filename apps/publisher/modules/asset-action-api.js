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
    var ACTION_UPDATE_VOTE = 'update-vote';
    var ACTION_LC_HISTORY = 'lifecycle-history';
    var ACTION_LC_VIEW = 'lifecycles';
    var ACTION_LC_ADD =  'attach-lifecycles';
    var ACTION_LC_REMOVE = 'detach-lifecycles';
    var ACTION_ADD_TAGS = 'add-tags';
    var ACTION_REMOVE_TAGS = 'remove-tags';
    var ACTION_RETRIEVE_TAGS = 'tags';
    var ACTION_TAXA = 'taxonomies';
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
    var taxonomyAPI = require('/modules/taxonomy-api.js').api;
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

    function validatePayload(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            var message = 'Error while parsing the message payload, please send correct content';
            throw exceptionModule.buildExceptionObject(message, constants.STATUS_CODES.BAD_REQUEST);
        }
        return true;
    }

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
            return errorMsg(msg(405, 'State must be retrieved using a GET'));
        }
        validateOptions(options);
        var result;
        try {
            result = lifecycleAPI.getState(options, req, res, session);
        } catch (e) {
            if (e == "Unauthorized Action - does not have permissions to view lifecycle state") {
                var errorResponse = msg(401, 'User does not have permission to view lifecycle state', e);
                errorResponse.errorContent = {};

                errorResponse.errorContent.message = 'User does not have permission to view lifecycle state';
                errorResponse.errorContent.exception = e;

                return errorMsg(errorResponse);
            } else {
                throw e;
            }
        }
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

        try {
            success = lifecycleAPI.changeState(options, req, res, session);
        } catch (e) {
            throw e;
        }
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
        if (!req.getContent() || !req.getContentType() === 'application/json') {
            var message = 'Checklist items must be sent in the body of the request and content type should be set to application/json';
            throw exceptionModule.buildExceptionObject(message, constants.STATUS_CODES.BAD_REQUEST);
        }
        body = req.getContent();
        if((typeof body) == 'string'){
            try {
                body = parse(body);
            } catch (e) {
                var message = 'Error while parsing the message payload, please send correct content';
                throw exceptionModule.buildExceptionObject(message, constants.STATUS_CODES.BAD_REQUEST);
            }
        }
        options.checkItems = body.checklist || [];
        success = lifecycleAPI.checkItems(options, req, res, session);
        if (success) {
            return successMsg(msg(200, 'The checklist was updated successfully'));
        }
        return errorMsg(msg(500, 'The checklist was not updated'));
    };

    api.updateVote = function(req, res, session, options) {
        var success;
        var body;
        if (!req.getContent() || !req.getContentType() === 'application/json') {
            var message = 'Vote items must be sent in the body of the request and content type should be set to application/json';
            throw exceptionModule.buildExceptionObject(message, constants.STATUS_CODES.BAD_REQUEST);
        }
        body = req.getContent();
        if((typeof body) == 'string'){
            try {
                body = parse(body);
            } catch (e) {
                var message = 'Error while parsing the message payload, please send correct content';
                throw exceptionModule.buildExceptionObject(message, constants.STATUS_CODES.BAD_REQUEST);
            }
        }
        options.votes = body.votes || [];
        success = lifecycleAPI.vote(options, req, res, session);
        if (success) {
            return successMsg(msg(200, 'The vote was updated successfully'));
        }
        return errorMsg(msg(500, 'The vote was not updated'));
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
        var content = req.getContent();
        validatePayload(content);
        var data = parse(content);
        var existingAsset = assetAPI.get(options,req,res,session);
        var newVersion = data.attributes.overview_version;
        var resources = am.getAssetGroup(existingAsset);
        for (var index in resources) {
            if (resources.hasOwnProperty(index)) {
                var resource = resources[index];
                if (resource.version === newVersion) {
                    return errorMsg(msg(409, 'Conflict in versions: ' + newVersion + ' already exist!'));
                    /* REST POST request "409 Conflict" since the resource pointed exists.*/
                }
            }
        }
        try {
            asset = am.createVersion(options, data.attributes);
            if(asset){
                 tenantId = es.current(session).tenantId;
                var registry = es.systemRegistry(tenantId);

                if(registry.registry.resourceExists('/_system/governance/store/asset_resources/'+ options.type + '/' + options.id)){
                    registry.registry.copy('/_system/governance/store/asset_resources/'+ options.type + '/' + options.id,'/_system/governance/store/asset_resources/'+ options.type + '/' + asset);
                }
                return successMsg(msg(200, 'New version created successfully.', asset));
            }
            return errorMsg(msg(500, 'New version of asset of id:'+ options.id + ' could not be created.'));

        } catch (err) {
            if (String(err).indexOf('contains one or more illegal characters') > -1) {
                return errorMsg(msg(400, 'Contains one or more illegal characters (~!@#;%^*()+={}|\\<>"\',), Version could not be created.'));
            }
            else {
                return errorMsg(msg(500, 'New version of asset of id :' + options.id + ', Version could not be created.'));
            }
        }
    };
    api.attachLifecycles = function(req, res, session, options) {
        if (req.getMethod() !== 'POST') {
            return errorMsg(msg(405, 'Lifecycles should be attached with a POST'));
        }
        var result;
        try {
            result = lifecycleAPI.attachLifecycles(options, req, res, session);
        } catch (e) {
            log.error('Failure to attach lifecycles');
            log.error(e);
        }
        if (result) {
            return successMsg(msg(200, 'Lifecycles attached', result));
        }
        return errorMsg(msg(500, 'Lifecycles not attached'));
    };
    api.detachLifecycles = function(req, res, session, options) {
        if (req.getMethod() !== 'POST') {
            return errorMsg(msg(405, 'Lifecycles should be removed with a POST'));
        }
        var result;
        try {
            result = lifecycleAPI.detachLifecycles(options, req, res, session);
        } catch (e) {
            log.error('Failure to detach lifecycles ');
            log.error(e);
        }
        if (result) {
            return successMsg(msg(200, 'Lifecycles removed', result));
        }
        return errorMsg(msg(500, 'Lifecycles not removed'));
    };
    api.lifecycles = function(req, res, session, options) {
        if (req.getMethod() !== 'GET') {
            return errorMsg(msg(405, 'Attached lifecycles should be retrieved with a GET'));
        }
        var lifecycles;
        try {
            lifecycles = lifecycleAPI.listAllAttachedLifecycles(options, req, res, session);
        } catch (e) {
            log.error('Failure to retrieve attached lifecycles ');
            log.error(e);
        }
        if (lifecycles) {
            return successMsg(msg(200, lifecycles, lifecycles));
        }
        return errorMsg(msg(500, 'Could not retrieve lifecycles'));
    };
    /**
     * resolve the http methods and call related function for REST request
     * @param  options Object containing asset id, type, new version
     * @param  req     jaggery request
     * @param  res     jaggery response
     * @param  session  sessionId
     */
    api.taxaMethodsResolver = function (req, res, session, options) {
        var method = req.getMethod();
        var result;

        switch (method) {
            case 'POST':// POST endpoints
                result = taxonomyAPI.addTaxa(req, res, session, options);
                break;
            case 'GET':// GET endpoints
                result = taxonomyAPI.getTaxa(req, res, session, options);
                break;
            case 'DELETE': // DELETE endpoints
                result = taxonomyAPI.removeTaxa(req, res, session, options);
                break;
            default:
        }

        return result;
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
            case ACTION_UPDATE_VOTE:
                result = api.updateVote(req, res, session, options);
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
            case ACTION_TAXA:
                result = api.taxaMethodsResolver(req, res, session, options);
                break;
            case ACTION_LC_VIEW:
                result = api.lifecycles(req,res,session,options);
                break;
            case ACTION_LC_ADD:
                result = api.attachLifecycles(req,res,session,options);
                break;
            case ACTION_LC_REMOVE:
                result = api.detachLifecycles(req,res,session,options);
                break;
            default:
                break;
        }
        return result;
    };
}(api));
