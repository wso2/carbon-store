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
var config = require('/test/conf.json');
var publisherAPIURL = config.baseAPIUrls.publisher;
var storeAPIURL = config.baseAPIUrls.store;
var TestUtils = require('/modules/test/test-utils.js').util;
var ASSET_TYPE = 'gadget';
var REVIEW_CONTENT = ['Review 1', 'Review 2', 'Review 3', 'Review 4', 'Review 5'];
describe('User Review - Store API', function() {
    it('Test adding a user review', function() {
        var context = createContext(config);
        var reviews;
        var createdReviews;
        var retrievedReviews;
        try {
            setup(context);
            reviews = generateReviews(context, [reviewContent(1)]);
            createdReviews = createReviews(context, reviews);
            //Validate if the review API call was successfull
            expect(createdReviews.length > 0).toBe(true);
            expect(createdReviews[0].success).toBe(true);
            //Retrieve the review and check if the review was created successfully
            retrievedReviews = retrieveReviews(context);
            //Validate the created review
            expect(retrievedReviews.length > 0).toBe(true);
            expect(retrievedReviews[0].object.content === reviewContent(1)).toBe(true);
            //TODO: Remove the check for a rating of 2
            expect(retrievedReviews[0].object.rating === 2).toBe(true);
        } catch (e) {
            log.error('Failed to test creation of a user review', e);
            failTest();
        } finally {
            tearDown(context);
        }
    });
    it('Test retrieving a list of user reviews', function() {
        var context = createContext(config);
        var reviews;
        var createdReviews;
        var retrievedReviews;
        try {
            setup(context);
            reviews = generateReviews(context, [reviewContent(1), reviewContent(2)]);
            createdReviews = createReviews(context, reviews);
            retrievedReviews = retrieveReviews(context);
            //Determine if the created count and retrieved count are equal
            expect(retrievedReviews.length === createdReviews.length).toBe(true);
            //Do a content comparison check
            sortReviewsById(createdReviews);
            sortReviewsById(retrievedReviews);
            expect(matchReviewsByContent(createdReviews, retrievedReviews)).toBe(true);
        } catch (e) {
            log.error('Failed to test retrieval of user reviews', e);
            failTest();
        } finally {
            tearDown(context);
        }
    });
    it('Test deleting a user review', function() {
        var context = createContext(config);
        var reviews;
        var createdReviews;
        var retrievedReviews;
        var retrievedReviewsAfterDelete;
        var deletedReviews;
        try {
            setup(context);
            reviews = generateReviews(context, [reviewContent(1), reviewContent(2)]);
            createdReviews = createReviews(context, reviews);
            retrievedReviews = retrieveReviews(context);
            sortReviewsById(createdReviews);
            sortReviewsById(retrievedReviews);
            //Delete the first review
            deletedReviews = deleteReviews(context, [retrievedReviews[0]]);
            retrievedReviewsAfterDelete = retrieveReviews(context);
            //Check if the review count  as been reduced
            var isReviewCountOneLess = (retrievedReviewsAfterDelete.length < retrievedReviews.length);
            expect(isReviewCountOneLess).toBe(true);
            //Check if the correct review has been deleted
            var isReviewDeleted = matchReviewsById(deletedReviews, retrievedReviewsAfterDelete);
            expect(isReviewDeleted).toBe(true);
        } catch (e) {
            log.error('Failed to test deleting a single user review', e);
            failTest();
        } finally {
            tearDown(context);
        }
    });
    it('Test liking a user review', function() {
        var context = createContext(config);
        var reviews;
        var createdReviews;
        var retrievedReviews;
        var retrievedReviewsAfterLiking;
        try {
            setup(context);
            reviews = generateReviews(context, [reviewContent(1)]);
            createdReviews = createReviews(context, reviews);
            retrievedReviews = retrieveReviews(context);
            likeReview(context, retrievedReviews[0]);
            retrievedReviewsAfterLiking = retrieveReviews(context);
            var hasReviewBeenLiked = isLiked(retrievedReviewsAfterLiking[0]);
            expect(hasReviewBeenLiked).toBe(true);
        } catch (e) {
            log.error(e);
            failTest();
        } finally {
            tearDown(context);
        }
    });
    it('Test disliking a user review', function() {
        var context = createContext(config);
        var reviews;
        var createdReviews;
        var retrievedReviews;
        var retrievedReviewsAfterDisliking;
        try {
            setup(context);
            reviews = generateReviews(context, [reviewContent(1)]);
            createdReviews = createReviews(context, reviews);
            retrievedReviews = retrieveReviews(context);
            dislikeReview(context, retrievedReviews[0]);
            retrievedReviewsAfterDisliking = retrieveReviews(context);
            var hasReviewBeenDisliked = isDisliked(retrievedReviewsAfterDisliking[0]);
            expect(hasReviewBeenDisliked).toBe(true);
        } catch (e) {
            log.error(e);
            failTest();
        } finally {
            tearDown(context);
        }
    });
    it('Test retrieving newest reviews', function() {
        var context = createContext(config);
        var reviews;
        var templates;
        var createdReviews;
        var retrievedReviews;
        try {
            setup(context);
            reviews = generateReviews(context, bulkReviews());
            createdReviews = createReviews(context, reviews);
            retrievedReviews = retrieveNewestReviews(context);
            expect(retrievedReviews.length === createdReviews.length).toBe(true);
            //The retrieved reviews need to be in the reverse order
            createdReviews.forEach(function(createdReview, index) {
                index++;
                var adjacent = retrievedReviews.length - index;
                expect(retrievedReviews[adjacent].object.content).toBe(createdReview.object.content);
            })
        } catch (e) {
            log.error(e);
            failTest();
        } finally {
            tearDown(context);
        }
    });
    it('Test retrieving oldest reviews', function() {
        var context = createContext(config);
        var reviews;
        var templates;
        var createdReviews;
        var retrievedReviews;
        try {
            setup(context);
            reviews = generateReviews(context, bulkReviews());
            createdReviews = createReviews(context, reviews);
            retrievedReviews = retrieveOldestReviews(context);
            expect(retrievedReviews.length === createdReviews.length).toBe(true);
            //The retrieved reviews need to be in the same order as the review list
            createdReviews.forEach(function(createdReview, index) {
                expect(retrievedReviews[index].object.content).toBe(createdReview.object.content);
            })
        } catch (e) {
            log.error(e);
            failTest();
        } finally {
            tearDown(context);
        }
    });
    it('Test retrieving popular reviews', function() {
        var context = createContext(config);
        var reviews;
        var templates;
        var createdReviews;
        var retrievedReviews;
        var retrievedPopularReviews;
        try {
            setup(context);
            reviews = generateReviews(context, bulkReviews());
            createdReviews = createReviews(context, reviews);
            retrievedReviews = retrieveOldestReviews(context);
            expect(retrievedReviews.length === createdReviews.length).toBe(true);
            likeReview(context,retrievedReviews[1]);
            retrievedPopularReviews = retrievePopularReviews(context);
            expect(retrievedPopularReviews[0].object.content).toBe(retrievedReviews[1].object.content);
            expect(retrievedPopularReviews[0].object.id).toBe(retrievedReviews[1].object.id);            
        } catch (e) {
            log.error(e);
            failTest();
        } finally {
            tearDown(context);
        }
    });
});
/**
 * Creates a context with configuration
 */
var createContext = function(conf) {
    var context = {};
    context.username = conf.authConfiguration.username;
    context.password = conf.authConfiguration.password;
    context.storeAPIURL = conf.baseAPIUrls.store;
    context.publisherAPIURL = conf.baseAPIUrls.publisher;
    context.type = ASSET_TYPE;
    return context;
};
/**
 * Creates an asset and establishes the sessions
 * to the Store and Publisher
 */
var setup = function(context) {
    var username = context.username;
    var password = context.password;
    var publisherAPIURL = context.publisherAPIURL;
    var storeAPIURL = context.storeAPIURL;
    context.publisherHeader = TestUtils.obtainAuthorizedHeaderForAPICall(publisherAPIURL, username, password);
    context.storeHeader = TestUtils.obtainAuthorizedHeaderForAPICall(storeAPIURL, username, password);
    context.assetId = TestUtils.getAssetID('review-gadget', context.publisherHeader, publisherAPIURL);
    expect(assetId).toBeDefined();
    return context;
};
/**
 * Deletes the created asset and destroys 
 * active sessions
 */
var tearDown = function(context) {
    var storeHeader = context.storeHeader;
    var publisherHeader = context.publisherHeader;
    var publisherAPIURL = context.publisherAPIURL;
    var storeAPIURL = context.storeAPIURL;
    var assetId = context.assetId;
    if (context.assetId) {
        TestUtils.deleteAssetWithID(context.assetId, publisherHeader, publisherAPIURL);
    }
    if (publisherHeader) {
        TestUtils.logoutAuthorizedUser(publisherHeader, publisherAPIURL);
    }
    if (storeHeader) {
        TestUtils.logoutAuthorizedUser(storeHeader, storeAPIURL);
    }
};
var createReviews = function(context, reviews) {
    var review;
    var results = [];
    var result;
    var isNumber;
    for (var index = 0; index < reviews.length; index++) {
        review = reviews[index];
        result = TestUtils.createReview(review, context.storeHeader, context.storeAPIURL);
        expect(result).toBeDefined();
        result = parse(result);
        expect(result.success).toBe(true);
        isNumber = (typeof result.id === 'number') ? true : false;
        expect(isNumber).toBe(true);
        review.object.id = result.id;
        review.success = result.success;
        results.push(review);
    }
    return results;
};
var deleteReviews = function(context, reviews) {
    var results = [];
    var result;
    var id;
    reviews.forEach(function(review) {
        id = review.object.id;
        if (!id) {
            throw 'Unable to locate review to delete review';
        }
        result = TestUtils.deleteReview(id, context.storeHeader, context.storeAPIURL);
        if (result.success) {
            results.push(review.id);
        }
    });
    return results;
};
var generateReviews = function(context, templates) {
    var reviews = [];
    var review;
    var template;
    var assetId = context.assetId;
    for (var index = 0; index < templates.length; index++) {
        template = templates[index];
        review = TestUtils.generateReview({
            id: assetId,
            type: ASSET_TYPE,
            content: template
        });
        reviews.push(review);
    }
    return reviews;
};
var retrieveReviews = function(context, paging) {
    var storeAPIURL = context.storeAPIURL;
    var storeHeader = context.storeHeader;
    var target = context.type + ':' + context.assetId;
    paging = paging || {};
    var reviews = TestUtils.listReviews(target, storeHeader, storeAPIURL, paging);
    expect(reviews).toBeDefined();
    return parse(reviews);
};
var retrieveNewestReviews = function(context) {
    return retrieveReviews(context, {
        sortBy: 'newest'
    });
};
var retrieveOldestReviews = function(context) {
    return retrieveReviews(context, {
        sortBy: 'oldest'
    });
};
var retrievePopularReviews = function(context) {
    return retrieveReviews(context, {
        sortBy: 'popular'
    });
};
var sortReviewsById = function(reviews) {
    reviews.sort(function(a, b) {
        //log.info('sorting '+a.object.id+' < '+b.id);
        return (a.object.id < b.object.id);
    });
};
var matchReviewsByContent = function(setA, setB) {
    var match = true;
    setA.forEach(function(a, index) {
        match = (a.content === setB[index].content);
    });
    return match;
};
var matchReviewsById = function(setA, setB) {
    var match = true;
    setA.forEach(function(a, index) {
        match = (a.id === b.id);
    });
    return match;
};
/**
 * Simulate a failure 
 */
var failTest = function() {
    expect(true).toBe(false);
};
var reviewContent = function(index) {
    index--;
    if ((index <= REVIEW_CONTENT.length) && (index >= 0)) {
        return REVIEW_CONTENT[index];
    }
    log.error('Failing test as test review content could not be found');
    failTest();
};
var likeReview = function(context, review) {
    var target = context.type + ':' + context.assetId;
    var response = TestUtils.likeReview(target, context.storeHeader, context.storeAPIURL, review);
};
var dislikeReview = function(context, review) {
    var target = context.type + ':' + context.assetId;
    var response = TestUtils.dislikeReview(target, context.storeHeader, context.storeAPIURL, review);
};
var isLiked = function(review, count) {
    count = count || 1;
    return review.object.likes.totalItems === count;
};
var isDisliked = function(review, count) {
    count = count || 1;
    return review.object.dislikes.totalItems === count;
};
var bulkReviews = function() {
    var list = [];
    list.push(reviewContent(1));
    list.push(reviewContent(2));
    list.push(reviewContent(3));
    list.push(reviewContent(4));
    list.push(reviewContent(5));
    return list;
};