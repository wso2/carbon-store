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
    var ReqUtils = utilsModule.request;
    var constants = rxtModule.constants;
    var store = require('store');
    var log = new Log('reviews-api');
    var HTTP_GET_METHOD = 'GET';
    var HTTP_POST_METHOD = 'POST';
    var HTTP_DELETE_METHOD = 'DELETE';
    var resolveGET = function(req, res, session) {
        var opts = ReqUtils.getQueryOptions(req.getQueryString());
        var errors = [];
        var server = store.server;
        var user = server.current(session);
        if (!opts.target) {
            errors.push('traget of the reviews must be provided');
        }
        if (errors.length > 0) {
            print(errors);
            return;
        }
        var target = opts.target; //ReviewUtils.createTargetFromAssetId(opts.id, opts.type);
        var reviews = ReviewUtils.listReviews(target, user, opts);
        res.addHeader("Content-Type", "application/json");
        print(reviews);
    };
    var resolvePOST = function(req, res, session) {
        var review;
        var tenantApi = require('/modules/tenant-api.js').api;
        var tenantContext = tenantApi.tenantContext(session);
        var contentType = req.getHeader('Content-Type');
        if (ReqUtils.parseContentType(contentType) === 'application/json') {
            review = req.getContent();
        }
        if (!review) {
            //TODO: Send back correct error
            print('send a review object to create');
            return;
        }
        log.info('user in tenant context ' + tenantContext.user);
        var user = store.server.current(session);
        if (!user) {
            //TODO: Send back error for attempting to create a review without logging in
            print('log in before creating a review');
            return;
        }
        var actor = review.actor = {};
        actor.id = ReviewUtils.formatUsername(user);
        actor.objectType = 'person';
        var result = ReviewUtils.createUserReview(review);
        res.addHeader("Content-Type", "application/json");
        print(result);
    };
    var resolveDefaultCase = function(req, res, session) {
        req.sendError(405); //Method Not Allowed
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
                break;
        }
    };
}(api));