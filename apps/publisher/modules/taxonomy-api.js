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
(function (api) {

    var CONTENT_TYPE_JSON = 'application/json';

    var utils = require('utils');
    var rxtModule = require('rxt');
    var utility = require('/modules/utility.js').rxt_utility();
    var exceptionModule = utils.exception;
    var constants = rxtModule.constants;
    var contentTypeheader, jsonHeader, acceptHeader, jsonHeaderAccept;
    var taxa = require('taxonomy');

    var assetManager = function (req, session, options) {
        var rxtAPI = require('rxt');
        return rxtAPI.asset.createUserAssetManager(session, options.type);
    };

    var processContentType = function (contentType) {
        var comps = contentType.split(';');
        return comps[0];
    };

    var processRequestBody = function (req, options) {
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

    var msg = function (code, message, data) {
        var obj = {};
        obj.code = code;
        obj.message = message;
        obj.data = data;
        return obj;
    };
    var successMsg = function (obj) {
        obj.success = true;
        return obj;
    };
    var errorMsg = function (obj) {
        obj.success = false;
        return obj;
    };
    /***
     * Check for JSON header and return boolean
     * @param content
     * @returns {boolean}
     */
    var isJsonHeader = function (content) {
        if (content) {
            return (content.indexOf('application/json') < 0);
        }

    };
    /***
     * This method checks the user input taxa, inside given list taxa
     * @param input taxa  text
     * @param taxa Json Object text
     * @returns {boolean}
     */
    var checkInTaxa = function (taxa, input) {
        var isContained = false;
        if (taxa[input]) {
            isContained = true;
        }
        return isContained;
    };
    /***
     * Check for assert type and id inside the request
     * @param options
     */
    var validateRequestOptions = function (options) {
        if (!options.type) {
            log.error("Unable to use the tagging API without an asset type : " + options);
            throw exceptionModule.buildExceptionObject('Unable to use the tagging API without an asset type',
                constants.STATUS_CODES.BAD_REQUEST);
        }
        if (!options.id) {
            log.error("Unable to use the tagging API without providing an asset id : " + options);
            throw exceptionModule.buildExceptionObject('Unable to use the tagging API without providing an asset id',
                constants.STATUS_CODES.BAD_REQUEST);
        }
    };

    /**
     * To add a new taxa to an asset
     * @param  options Object containing asset id, type, new version
     * @param  req     jaggery request
     * @param  res     jaggery response
     * @param  session  sessionId
     */
    api.addTaxa = function (req, res, session, options) {

        try {
            contentTypeheader = req.getHeader('Content-Type') || '';
            jsonHeader = contentTypeheader.indexOf('application/json');

            if (isJsonHeader(acceptHeader)) {
                return errorMsg(msg(constants.STATUS_CODES.UNSUPPORTED_MEDIATYPE,
                    "error while adding a taxa, unsupported Media Type "));
            } else {
                validateRequestOptions(options);
                options = processRequestBody(req, options);
                if (!options.taxa) {
                    return errorMsg(msg(constants.STATUS_CODES.BAD_REQUEST,
                        'Please provide taxa in the body of the request'));
                } else {
                    var am = assetManager(req, session, options);
                    if (options.taxa) {
                        if (log.isDebugEnabled()) {
                            log.debug('taxa to add: ' + stringify(options.taxa));
                        }

                        if (am.addTaxa(options.id, options.taxa)) {
                            return successMsg(msg(constants.STATUS_CODES.CREATED, 'taxa added successfully'));
                        } else {
                            return errorMsg(msg(constants.STATUS_CODES.INTERNAL_SERVER_ERROR,
                                'taxa is not added'));
                        }
                    } else {
                        return errorMsg(msg(constants.STATUS_CODES.BAD_REQUEST, 'Input taxa is not valid'));
                    }
                }
            }

        } catch (e) {
            log.error("Error while adding taxa due to ", e);
            if (e.hasOwnProperty('message') && e.hasOwnProperty('code')) {
                return errorMsg(msg(e.code, e.message));
            } else {
                return errorMsg(msg(constants.STATUS_CODES.INTERNAL_SERVER_ERROR,
                    'error on adding taxa '));
            }
        }
    };
    /**
     * To get categories from an asset
     * @param  options Object containing asset id, type, new version
     * @param  req     jaggery request
     * @param  res     jaggery response
     * @param  session  sessionId
     */
    api.getTaxa = function (req, res, session, options) {
        var taxa;
        acceptHeader = req.getHeader('Accept') || constants.ACCEPT_ALL;
        try {
            if (!isJsonHeader(acceptHeader) || acceptHeader === constants.ACCEPT_ALL) {
                validateRequestOptions(options);
                var am = assetManager(req, session, options);
                taxa = am.getTaxa(options.id);
                if (taxa) {
                    return successMsg(msg(constants.STATUS_CODES.OK, 'taxa retrieved successfully',
                        taxa));
                } else {
                    return errorMsg(msg(constants.STATUS_CODES.INTERNAL_SERVER_ERROR,
                        'taxa not retrieved'));
                }
            } else {
                return errorMsg(msg(constants.STATUS_CODES.UNSUPPORTED_MEDIATYPE,
                    "error while retrieving the taxa, unsupported Media Type"));
            }

        } catch (e) {
            log.error("Error while retrieving taxa due to ", e);
            if (e.hasOwnProperty('message') && e.hasOwnProperty('code')) {
                return errorMsg(msg(e.code, e.message));
            } else {
                return errorMsg(msg(constants.STATUS_CODES.INTERNAL_SERVER_ERROR,
                    'error on retrieving taxa '));
            }
        }
    };
    /**
     * To remove a given taxa from an asset
     * @param  options Object containing asset id, type, new version
     * @param  req     jaggery request
     * @param  res     jaggery response
     * @param  session  sessionId
     */
    api.removeTaxa = function (req, res, session, options) {
        try {
            contentTypeheader = req.getHeader('Content-Type') || '';

            if (isJsonHeader(contentTypeheader)) {
                return errorMsg(msg(constants.STATUS_CODES.UNSUPPORTED_MEDIATYPE,
                    "error while removing a taxa, unsupported Media Type or headers"));
            } else {
                validateRequestOptions(options);
                options = processRequestBody(req, options);
                if (!options.taxa) {
                    return errorMsg(msg(constants.STATUS_CODES.BAD_REQUEST,
                        'Please provide taxa in the body of the request'));
                } else {
                    var am = assetManager(req, session, options);
                    // To increase performance validate only with forward slash
                    if (options.taxa.indexOf(constants.FILTER_CHAR) >= 0) {
                        if (log.isDebugEnabled()) {
                            log.debug('taxa to add: ' + stringify(options.taxa));
                        }

                        if (am.removeTaxa(options.id, options.taxa)) {
                            return successMsg(msg(constants.STATUS_CODES.OK, 'taxa removed successfully'));
                        } else {
                            return errorMsg(msg(constants.STATUS_CODES.INTERNAL_SERVER_ERROR,
                                'taxa is not removed'));
                        }
                    } else {
                        return errorMsg(msg(constants.STATUS_CODES.BAD_REQUEST, 'Input taxa is not valid'));
                    }
                }
            }
        } catch (e) {
            log.error("Error while removing taxa due to ", e);
            if (e.hasOwnProperty('message') && e.hasOwnProperty('code')) {
                return errorMsg(msg(e.code, e.message));
            } else {
                return errorMsg(msg(constants.STATUS_CODES.INTERNAL_SERVER_ERROR,
                    'error on removing taxa '));
            }
        }

    };
}(api));
