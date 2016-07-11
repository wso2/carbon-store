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
    var rxtModule = require('rxt');
    var utilsModule = require('utils');
    var ReviewUtils = require('/extensions/app/social-reviews/modules/reviews-utils.js').ReviewUtils;
    var ResponseProcessor = require('utils').response;
    var ReqUtils = utilsModule.request;
    var constants = rxtModule.constants;
    var store = require('store');
    var log = new Log('user-reviews-api');
    var HTTP_GET_METHOD = 'GET';
    var HTTP_POST_METHOD = 'POST';
    var HTTP_DELETE_METHOD = 'DELETE';
    var HTTP_PUT_METHOD = 'PUT';
    var REMOVE_URL_PATTERN = '/{context}/apis/user-review/{id}';

    var resolveDefaultCase = function(req, res, session) {
        res = ResponseProcessor.buildErrorResponse(res, 501, 'Unable to locate endpoint.Supported verbs are GET and POST');
    };

    var resolveDELETE = function(req, res, session) {
        var user = store.server.current(session);
        var uriMatcher = new URIMatcher(req.getRequestURI());
        var uriParams = uriMatcher.match(REMOVE_URL_PATTERN);
        //There can be only one logged in user at any given time
        //TODO: Consider anon tenant browsing
        if (!user) {
            log.error('[user-review-api] Attempt to delete without a logged in user');
            log.error('[user-review-api] Client IP');
            log.error(req.getRemoteAddr());
            log.error('[user-review-api] Review ID');
            log.error(uriParams.id);
            res = ResponseProcessor.buildErrorResponse(res, 401, 'Must be logged into create reviews');
            return;
        }

        if (!uriParams.id) {
            log.error('[user-review-api] Attempt to delete a review without providing review id');
            res = ResponseProcessor.buildErrorResponse(res, 501, 'Endpoint not implemented');
            return;
        }

        username = ReviewUtils.formatUsername(user);
        var result = ReviewUtils.removeUserReview(uriParams.id, username);
        res.addHeader("Content-Type", "application/json");
        print(result);
    };

    var resolvePUT = function (req, res, session) {
        var review;
        var contentType = req.getHeader('Content-Type');
        if (ReqUtils.parseContentType(contentType) === 'application/json') {
            review = req.getContent();
        }
        else {
            res = ResponseProcessor.buildErrorResponse(res, 400, 'Invalid data type or malformed syntax');
            return;
        }
        if (!review) {
            res = ResponseProcessor.buildErrorResponse(res, 400, 'A review object must be provided in the body of the request.');
            return;
        }

        var user = store.server.current(session);
        if (!user) {
            log.error(req.getRemoteAddr());
            res = ResponseProcessor.buildErrorResponse(res, 401, 'Must be logged into update reviews');
            return;
        }

        var actor = review.actor = {};
        actor.id = ReviewUtils.formatUsername(user);
        actor.objectType = 'person';
        try {
            var result = ReviewUtils.updateUserReview(review);
            res.addHeader("Content-Type", "application/json");
            print(result);
        } catch (e) {
            log.error('Unable to update the review', e);
            res = ResponseProcessor.buildErrorResponse(res, 500, 'An error has occurred while updating the review,' +
                'please check the server logs for more details');
        }
    };

    api.resolve = function(ctx) {
        var req = ctx.request;
        var res = ctx.response;
        var session = ctx.session;
        switch (request.getMethod()) {
            case HTTP_DELETE_METHOD:
                resolveDELETE(req, res, session);
                break;
            case HTTP_PUT_METHOD:
                resolvePUT(req, res, session);
                break;
            default:
                resolveDefaultCase(req, res, session);
                break;
        }
    };
}(api));