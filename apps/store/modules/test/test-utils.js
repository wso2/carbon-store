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
    util.getAssetID = function(asset_name) {
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
        var header = obtainAuthorizedHeaderForAPICall();
        var response;
        try {
            response = post(url, asset, header, 'json');
        } catch (e) {
            log.error(e);
        } finally {
            assetId = response.data.id;
            logoutAuthorizedUser(header);
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
    util.logoutAuthorizedUser = function(header) {
        post(server_url + '/logout', {}, header, 'json');
    };
    /**
     * This function will send delete request for given asset id
     * @param id The uuid of asset to be deleted
     */
    util.deleteAssetWithID = function(id) {
        var url = server_url + '/assets/' + id + '?type=gadget';
        var header = obtainAuthorizedHeaderForAPICall();
        var response;
        try {
            response = del(url, {}, header);
        } catch (e) {
            log.error(e);
        } finally {
            logoutAuthorizedUser(header);
            expect(response.xhr.status).toEqual(200);
        }
    };
    util.createReview = function() {};
    util.deleteReview = function(reviewId) {};
    util.listReviews = function() {};
    util.likeReview = function() {};
    util.unlikeReview = function() {};
}(util));