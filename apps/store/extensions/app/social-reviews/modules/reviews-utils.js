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
var ReviewUtils = {};
(function(ReviewUtils) {
    var SOCIAL_OSGI_SERVICE = 'org.wso2.carbon.social.core.service.SocialActivityService';
    var REVIEW_PAGE_LIMIT = 10;
    var REVIEW_PAGE_OFFSET = 0;
    var log = new Log('reviews-api');
    var carbon = require('carbon');
    var getSocialSvc = function() {
        var carbon = require('carbon');
        return carbon.server.osgiService(SOCIAL_OSGI_SERVICE);
    };
    var cleanUsername = function(username) {
        return username.replace("@carbon.super", "");
    };
    var formatUsername = function(user) {
        var domain = user ? carbon.server.tenantDomain({
            tenantId: user.tenantId
        }) : null;
        return (user && domain) ? (String(user.username) + '@' + domain) : 'anonymous';
    };
    var buildPagination = function(paging) {
        paging = paging || {};
        paging.sortBy = paging.sortBy ? paging.sortBy.toUpperCase() : 'NEWEST';
        paging.offset = paging.offset ? paging.offset : REVIEW_PAGE_OFFSET;
        paging.limit = paging.limit ? paging.limit : REVIEW_PAGE_LIMIT;
        return paging;
    };
    var processUserReviews = function (socialSvc, user, reviews) {
        var review;
        var myReview = false;
        var formattedUsername = formatUsername(user);
        var usernameOnReview;
        for (var index = 0; index < reviews.length; index++) {
            review = reviews[index];
            usernameOnReview = review.actor.id;
            review.actor.id = cleanUsername(review.actor.id);
            //Only populate review details if there is a logged in
            //user
            if (user) {
                review.iLike = socialSvc.isUserliked(formattedUsername, review.object.id, 1);
                review.iDislike = socialSvc.isUserliked(formattedUsername, review.object.id, 0);
                review.isMyComment = (usernameOnReview === formatUsername(user));
                if (review.isMyComment) {
                    myReview = review;
                }
            }
        }
        return {'allReviews': reviews, 'myReview': myReview};
    };
    ReviewUtils.listReviews = function(target, user, userPagination) {
        var socialSvc = getSocialSvc();
        var paging = buildPagination(userPagination || {});
        var obj = JSON.parse(String(socialSvc.getSocialObjectJson(target, paging.sortBy, paging.offset, paging.limit)));
        return processUserReviews(socialSvc, user, obj.attachments || []);
    };
    ReviewUtils.createUserReview = function (review) {
        var socialSvc = getSocialSvc();
        var reviewJSON = JSON.stringify(review);
        var username = review.actor.id;
        var target = review.target.id;
        var reviewed = socialSvc.isReviewed(target, username);
        var result = {};
        var id = -1;
        if (!reviewed) {
            id = socialSvc.publish(reviewJSON);
        }
        result.id = id;
        result.success = (id > -1);
        return result;
    };
    ReviewUtils.removeUserReview = function(reviewId, username) {
        var socialSvc = getSocialSvc();
        var removed = socialSvc.removeActivity(reviewId, username);
        var result = {};
        result.success = removed;
        return result;
    };
    /**
     * Creates the target string which is used to retrieve social resources
     */
    ReviewUtils.createTargetFromAssetId = function(id, type) {
        return type + ':' + id;
    };
    ReviewUtils.hasMoreReviews = function(reviews) {
        reviews = reviews || [];
        return (reviews.length === REVIEW_PAGE_LIMIT);
    };
    ReviewUtils.formatUsername = function(user) {
        return formatUsername(user);
    };
}(ReviewUtils));