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
	var CONTENT_TYPE_JSON = 'application/json';
    var buildQuery = function(jsonString) {
        jsonString = jsonString || '';
        jsonString = '{' + jsonString + '}';
        var jsonObj;
        try {
            jsonObj = parse(jsonString);
        } catch (e) {
            log.error(e);
        }
        return jsonObj;
    };
    var assetManager = function(req, session, options) {
        var rxtAPI = require('rxt');
        var am = rxtAPI.asset.createUserAssetManager(session, options.type);
        return am;
    };
    var validateOptions = function(options) {
        if (!options.type) {
            throw 'Unable to use the tagging API without an asset type';
        }
        if (!options.id) {
            throw 'Unable to use the tagging API without providing an asset id';
        }
    };
    var processContentType = function(contentType) {
        var comps = contentType.split(';');
        return comps[0];
    };
    var processRequestBody = function(req, options) {
        var contentType = processContentType(req.getContentType());
        if (contentType !== CONTENT_TYPE_JSON) {
            return options;
        }
        var params = req.getContent();
        for (var key in params) {
            options[key] = params[key];
        }
        return options;
    };
    /**
     * Returns the set of tags for a given asset identified by the Id
     * @param  {[type]} req     [description]
     * @param  {[type]} res     [description]
     * @param  {[type]} session [description]
     * @param  {[type]} options Must contain the type of the asset and asset id
     * @return {[type]}         An array of strings representing the tags applied
     *                          to the asset
     */
    api.tags = function(req, res, session, options) {
        var tags = [];
        var am = assetManager(req, session, options);
        validateOptions(options);
        tags = am.getTags(options.id);
        return tags;
    };
    /**
     * Adds the provided set of tags to a given asset.The tags
     * should be provided in the body of the request
     * @param {[type]} req     [description]
     * @param {[type]} res     [description]
     * @param {[type]} session [description]
     * @param {[type]} options Must contain the type of the asset and asset id
     */
    api.addTags = function(req, res, session, options) {
        var am = assetManager(req, session, options);
        validateOptions(options);
        options = processRequestBody(req,options);
        if (!options.tags) {
            throw 'Please provide tags in the body of the request';
        }
        if (log.isDebugEnabled()) {
            log.debug('tags to add: ' + stringify(options.tags));
        }
        return am.addTags(options.id, options.tags);
    };
    /**
     * Removes the set of tags from an asset given the asset id
     * and a set of tags.The tags should be provided in the body
     * of the request
     * @param  {[type]} req     [description]
     * @param  {[type]} res     [description]
     * @param  {[type]} session [description]
     * @param  {[type]} options Must contain the type of the asset and asset id
     * @return {[type]}         [description]
     */
    api.removeTags = function(req, res, session, options) {
        var am = assetManager(req, session, options);
        validateOptions(options);
        options = processRequestBody(req,options);
        if (!options.tags) {
            throw 'Please provide tags in the body of the request';
        }
        if (log.isDebugEnabled()) {
            log.debug('tags to remove: ' + stringify(options.tags));
        }
        return am.removeTags(options.id, options.tags);
    };
    api.search = function(am, options) {
        var q = options.q;
        var tags = [];
        if (!options.type) {
            throw 'Asset type not specified';
        }
        //Parse the q object
        q = buildQuery(q);
        if (q) {
            q.mediaType = am.rxtManager.getMediaType(options.type);
            tags = am.search(q);
        } else {}
        return tags;
    };
}(api));