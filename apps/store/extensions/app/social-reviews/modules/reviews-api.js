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
    var log = new Log('reviews-api');
    var HTTP_GET_METHOD = 'GET';
    var HTTP_POST_METHOD = 'POST';
    var HTTP_DELETE_METHOD = 'DELETE';

    var resolveGET = function(req, res, session) {
        var opts = ReqUtils.getQueryOptions(req.getQueryString());
        var server = store.server;
        var user = server.current(session);

        if (!opts.target) {
            log.error('[user-reviews-api] Attempt to create a user review without a target');
            res = ResponseProcessor.buildErrorResponse(res, 400, 'Please provide a target query parameter.The target is a type and id conactenated string (e.g. gadget:xxx-xxx-xxx) which is used ' + ' map reviews to a given asset instance.');
            return;
        }
        
        var target = opts.target; 
        var reviews = ReviewUtils.listReviews(target, user, opts);
        res.addHeader("Content-Type", "application/json");
        print(reviews.allReviews);
    };

    var resolvePOST = function (req, res, session) {
        var review;
        var tenantApi = require('/modules/tenant-api.js').api;
        var tenantContext = tenantApi.tenantContext(session);
        var contentType = req.getHeader('Content-Type');
        if (ReqUtils.parseContentType(contentType) === 'application/json') {
            review = req.getContent();
        }
        if (!review) {
            res = ResponseProcessor.buildErrorResponse(res, 400, 'A review object must be provided in the body of the request.');
            return;
        }
        //There can be only one logged in user at any given time
        //TODO: Consider anon tenant browsing 
        var user = store.server.current(session);
        if (!user) {
            log.error('[user-reviews-api] Attempt to create review without a logged in user');
            log.error(req.getRemoteAddr());
            res = ResponseProcessor.buildErrorResponse(res, 401, 'Must be logged into create reviews');
            return;
        }

        var actor = review.actor = {};
        actor.id = ReviewUtils.formatUsername(user);
        actor.objectType = 'person';
        res.addHeader("Content-Type", "application/json");

        try {
            var result = ReviewUtils.createUserReview(review);
            if (!result.success) {
                res = ResponseProcessor.buildErrorResponse(res, 400,
                    'User has already reviewed on the asset , Multiple reviews are not allowed.');
            } else {
                print(result);
            }
        } catch (e) {
            log.error('[user-reviews-api] Unable to create the review', e);
            res = ResponseProcessor.buildErrorResponse(res, 500, 'An error has occurred while creating the review,please check the server logs for more details');
        }
    };

    var resolveDefaultCase = function(req, res, session) {
        res = ResponseProcessor.buildErrorResponse(res, 501, 'Unable to locate endpoint.Supported verbs are GET and POST');
    };

    api.resolve = function(ctx) {
        var req = ctx.request;
        var res = ctx.response;
        var session = ctx.session;
        switch (request.getMethod()) {
            case HTTP_GET_METHOD:
                resolveGET(req, res, session);
                break;
            case HTTP_POST_METHOD:
                resolvePOST(req, res, session);
                break;
            default:
                resolveDefaultCase(req, res, session);
                break;
        }
    };
}(api));