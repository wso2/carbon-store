/*
 *  Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
    var log = new Log('user-api');
    var server = require('store').server;
    var userObject = require('store').user;
    var app = require('rxt').app;
    var SEARCH_HISTORY_FEATURE = 'searchHistory';
    var USER_SEARCH_HISTORY_SESSION_KEY = 'USER_SEARCH_HISTORY';
    var TOP_ASSETS_KEY = 'top-assets';
    var DEFAULT_MAX_COUNT = 5;

    /**
     * Returns user specific search history per asset type. if asset type is not defined, returns the top-assets page history
     * @param session user session
     * @param type asset type
     * @returns {Array} search history results (default max 05)
     */
    api.getSearchHistory = function (session, type) {
        var history = [];
        var sessionHistory = {};
        var user = server.current(session);
        type = type || TOP_ASSETS_KEY;
        if ((!user)) {
            return history;
        }
        if (!app.isFeatureEnabled(user.tenantId, SEARCH_HISTORY_FEATURE)) {
            if (log.isDebugEnabled()) {
                log.debug("search history feature is disabled, search history will not shown in dropdown");
            }
            return history;
        }

        var userSearchHistoryData = api.userSearchHistoryData(session);
        if (userSearchHistoryData) {
            sessionHistory = userSearchHistoryData;
        } else {
            var tenantId = user.tenantId;
            var cleanUsername = userObject.cleanUsername(user.username);
            var systemRegistry = server.systemRegistry(tenantId);
            var resourcePath = api.searchHistoryResourcePath(cleanUsername);
            if (log.isDebugEnabled()) {
                log.debug('search history from registry resource::: ' + resourcePath);
            }
            var resource = systemRegistry.get(resourcePath);
            if (resource) {
                sessionHistory = JSON.parse(resource.content);
                if (log.isDebugEnabled()) {
                    log.debug("search history object: " + stringify(sessionHistory));
                }
                api.userSearchHistoryData(session, sessionHistory);
            }
        }
        var historyObject = sessionHistory[type];
        if (historyObject) {
            for (var index = 0; index < historyObject.length; index++) {
                history.push(historyObject[index].query);
            }
        }
        if (log.isDebugEnabled()) {
            log.debug("page search history content::: " + stringify(history));
        }
        return history;
    };

    /**
     * update user specific search results with the searchQuery against the asset type, if asset type not defined,
     * considered as top-asset page search query
     * @param session
     * @param searchQuery
     * @param type
     * @returns {boolean} ture, if updated successfully
     */
    api.updateSearchHistory = function (session, searchQuery, type) {
        if (log.isDebugEnabled()) {
            log.debug('page type:: ' + type + ' search query:: ' + searchQuery);
        }
        var user = server.current(session);
        type = type || TOP_ASSETS_KEY;

        if (!(user && app.isFeatureEnabled(user.tenantId, SEARCH_HISTORY_FEATURE))) {
            if (log.isDebugEnabled()) {
                log.debug("search history feature is disabled, search history will not shown in dropdown");
            }
            return false;
        }

        var searchHistory = api.userSearchHistoryData(session) || {};
        if (!searchHistory[type]) {
            searchHistory[type] = [];
        }

        var exists = false;
        for (var index = 0; index < searchHistory[type].length; index++) {
            if (searchHistory[type][index].query === searchQuery) {
                exists = true;
                break;
            }
        }
        if (exists === false) {
            var date = new Date();
            var currentTimestamp = date.getTime();
            var queryObject = {
                "timestamp": currentTimestamp,
                "query": searchQuery
            };
            searchHistory[type].push(queryObject);
        }
        var maxCount = api.getSearchHistoryMaxCount(user);

        if (searchHistory[type].length > maxCount) {
            searchHistory[type].shift();
        }
        if (log.isDebugEnabled()) {
            log.debug('user search history: ' + stringify(searchHistory));
        }
        api.userSearchHistoryData(session, searchHistory);
        return true;
    };

    /**
     * Returns search history from the user session.
     * @param session
     * @param sessionHistory
     * @returns {String}
     */
    api.userSearchHistoryData = function (session,sessionHistory) {
        if (sessionHistory) {
            session.put(USER_SEARCH_HISTORY_SESSION_KEY,sessionHistory);
            return;
        }
        return session.get(USER_SEARCH_HISTORY_SESSION_KEY);
    };

    /**
     * Returns search history registry resource path
     * @param username
     * @returns {string} registry resource path
     */
    api.searchHistoryResourcePath = function (username) {
        var REGISTRY_PATH_PREFIX = "/_system/config/users/searchhistory/user-";
        return REGISTRY_PATH_PREFIX + username;
    };

    /**
     * Returns max history count defined in configuration file. default is 05
     * @param user
     * @returns {number}
     */
    api.getSearchHistoryMaxCount = function (user) {
        var maxCount = DEFAULT_MAX_COUNT;
        var details = app.getFeatureDetails(user.tenantId, SEARCH_HISTORY_FEATURE) || {};
        var keys = details.keys ? details.keys : {};
        if (keys.maxCount) {
            maxCount = keys.maxCount;
        }
        return maxCount;
    };
}(api));
