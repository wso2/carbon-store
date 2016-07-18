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
    var isEmpty = function (object) {
        return Object.keys(object).length === 0;
    };
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
    var processUserReviews = function (socialSvc, user, reviews, target) {
        var review;
        var myReview;
        var socialSvc = getSocialSvc();
        var username = formatUsername(user);
        var isUserLoggedIn = false;
        myReview = JSON.parse(String(socialSvc.getUserComment(username, target)));
        if (!isEmpty(myReview)) {
            myReview.actor.id = cleanUsername(myReview.actor.id);
        } else {
            myReview = false;
        }
        if (user) {
            isUserLoggedIn = true;
        }
        var usernameOnReview;
        var myIndex;
        for (var index = 0; index < reviews.length; index++) {
            review = reviews[index];
            usernameOnReview = review.actor.id;
            var targetId = String(review.object.id);
            review.actor.id = cleanUsername(review.actor.id);
            review.isMyComment = (usernameOnReview === formatUsername(user));
            review.isUserLoggedIn = isUserLoggedIn;
            //Record the index of the review for deletion, if review is made by current user
            if (review.isMyComment) {
                myIndex = index;
            }
        }
        if (myIndex !== undefined) {
            reviews.splice(myIndex, 1);
        }
        return {'allReviews': reviews, 'myReview': myReview};
    };
    ReviewUtils.listReviews = function(target, user, userPagination) {
        var socialSvc = getSocialSvc();
        var paging = buildPagination(userPagination || {});
        var obj = JSON.parse(String(socialSvc.getSocialObjectJson(target, paging.sortBy, paging.offset, paging.limit)));
        return processUserReviews(socialSvc, user, obj.attachments || [], target);
    };
    ReviewUtils.updateUserReview = function (review) {
        var socialSvc = getSocialSvc();
        var reviewJSON = JSON.stringify(review);
        var updatedReview = JSON.parse(String(socialSvc.update(reviewJSON)));
        updatedReview = isEmpty(updatedReview) ? null : updatedReview;
        if (updatedReview) {
            updatedReview.actor.id = cleanUsername(updatedReview.actor.id);
        }
        return updatedReview;
    };
    ReviewUtils.createUserReview = function (review) {
        var socialSvc = getSocialSvc();
        var reviewJSON = JSON.stringify(review);
        var username = review.actor.id;
        var target = review.target.id;
        var alreadyPublished = socialSvc.isPublished(reviewJSON, target, username);
        var result = {};
        var id = -1;
        if (!alreadyPublished) {
            id = socialSvc.publish(reviewJSON);
        }
        result.id = id;
        result.success = (id > -1);
        var myReview = JSON.parse(String(socialSvc.getUserComment(username, target)));
        if (!isEmpty(myReview)) {
            myReview.actor.id = cleanUsername(myReview.actor.id);
        } else {
            myReview = false;
        }
        result.myReview = myReview;
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