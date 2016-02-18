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
var util = {};
(function(util) {
    /**
     * To add a asset and return the retrieved id of newly added asset
     * @return uuid
     */
    util.getAssetID = function(asset_name, header, server_url) {
        if (!asset_name) {
            var uuid = require('uuid');
            asset_name = uuid.generate();
        }
        var url = server_url + '/assets?type=gadget';
        var asset = {
            'overview_name': asset_name,
            'overview_version': '1.2.3',
            'overview_provider': 'admin',
            'overview_description': 'initial description',
            'overview_category': 'Google'
        };
        //var header = obtainAuthorizedHeaderForAPICall();
        var response;
        try {
            response = post(url, asset, header, 'json');
        } catch (e) {
            log.error(e);
        } finally {
            assetId = response.data.id;
            //this.logoutAuthorizedUser(header, server_url);
            expect(response.data).not.toBe(undefined);
            return response.data.id;
        }
    };
    /**
     *
     * @return {{Cookie: string}}
     */
    util.obtainAuthorizedHeaderForAPICall = function(server_url, username, password) {
        var authenticate = post(server_url + '/authenticate', {
            "password": password,
            "username": username
        }, {}, 'json');
        var header = {
            'Cookie': "JSESSIONID=" + authenticate.data.data.sessionId + ";",
            'Accept': 'application/json'
        };
        return header;
    };
    /**
     * The function to send logout request to publisher API
     * @param header
     */
    util.logoutAuthorizedUser = function(header, server_url) {
        post(server_url + '/logout', {}, header, 'json');
    };
    /**
     * This function will send delete request for given asset id
     * @param id The uuid of asset to be deleted
     */
    util.deleteAssetWithID = function(id, header, server_url) {
        var url = server_url + '/assets/' + id + '?type=gadget';
        var response;
        try {
            response = del(url, {}, header);
        } catch (e) {
            log.error(e);
        } finally {
            expect(response.xhr.status).toEqual(200);
        }
    };
    util.createReview = function(review, header, server_url) {
        var url = server_url + '/user-reviews';
        var response = {};
        header['Content-Type'] = 'application/json';
        try {
            response = post(url, JSON.stringify(review), header, 'application/json');
        } catch (e) {
            log.error(e);
        } finally {
            expect(response.xhr.status).toEqual(200);
        }
        return response.data;
    };
    util.deleteReview = function(reviewId, header, server_url) {
        var url = server_url + '/user-review/' + reviewId;
        var response = {};
        try {
            response = del(url, {}, header);
        } catch (e) {
            log.error(e);
        } finally {
            expect(response.xhr.status).toEqual(200);
        }
        return response.data;
    };
    util.listReviews = function(target, header, server_url, paging) {
        var url = server_url + '/user-reviews';
        var response = {};
        var queryParams = {};
        paging = paging || {};
        if (paging.sortBy) {
            queryParams.sortBy = paging.sortBy;
        }
        queryParams.target = target;
        try {
            response = get(url, queryParams, header);
        } catch (e) {
            log.error(e);
        }
        return response.data;
    };
    util.listPopularReviews = function(target, header, server_url) {
        return this.listReviews(target, header, server_url, {
            sortBy: 'POPULAR'
        });
    }
    util.listNewestReviews = function(target, header, server_url) {
        return this.listReviews(target, header, server_url, {
            sortBy: 'NEWEST'
        });
    }
    util.listOldestReviews = function(target, header, server_url) {
        return this.listReviews(target, header, server_url, {
            sortBy: 'OLDEST'
        });
    }
    util.likeReview = function(target,header,server_url,review) {
        action = this.generateActionMessage({
            id:review.object.id,
            target:target,
            verb:'like'
        });
        return this.createReview(action,header,server_url);
    };
    util.dislikeReview = function(target,header,server_url,review) {
        action = this.generateActionMessage({
            id:review.object.id,
            target:target,
            verb:'dislike'
        });
        return this.createReview(action,header,server_url); 
    };
    /**
     * Generates a template review object
     */
    util.generateReview = function(opts) {
        var content = opts.content || 'This an empty review';
        var rating = opts.rating || 2;
        var target = opts.type + ':' + opts.id;
        return {
            "verb": "post",
            "object": {
                "objectType": "review",
                "content": content,
                "rating": rating,
                "likes": {
                    "totalItems": 0
                },
                "dislikes": {
                    "totalItems": 0
                }
            },
            "target": {
                "id": target
            }
        };
    };
    util.generateActionMessage = function(opts) {
        return {
            "target": {
                "id": opts.id
            },
            "object": {},
            "verb": opts.verb,
            "context": {
                "id": opts.target
            }
        };
    };
}(util));