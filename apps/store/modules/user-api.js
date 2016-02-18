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
(function(api) {
    var log = new Log('user-api');
    var server = require('store').server;
    api.getSearchHistory = function(session, type) {
    	var history = [];
        var historyObject = [];
    	var sessionHistory = {};
    	var user = server.current(session);
        if((!user)) {
            return history;
        }
        if(session.get('USER_SEARCH_HISTORY')) {
		sessionHistory = session.get('USER_SEARCH_HISTORY');
    	} else {
                var tenantId = server.current(session).tenantId;
                var cleanUsername = require('store').user.cleanUsername(user.username);
                var system = server.systemRegistry(tenantId);
                var resourcePath = "/_system/config/users/searchhistory/user-" + cleanUsername;
                log.debug('search history from registry resource::: '+resourcePath);
                resource = system.get(resourcePath);
    	    if (resource) {
                sessionHistory = JSON.parse(resource.content);
    	    	log.debug("search history object: "+stringify(sessionHistory));
    	    	session.put('USER_SEARCH_HISTORY', sessionHistory);
    	    }
        }
        if (type) {
            historyObject = sessionHistory[type];
        } else {
            historyObject = sessionHistory['top-assets'];
        }
        if (historyObject) {
            for (index = 0; index < historyObject.length; index++) {
                history.push(historyObject[index].query);
            };
        }

        log.info(history);
    	return history;
    };

    api.updateSearchHistory = function(ctx, searchQuery, type) {
        log.debug('page type:: ' +type+ ' search query:: '+searchQuery);
        var assetType;
        if (type) {
            assetType = type;
        } else {
            assetType = 'top-assets';
        }

        var searchHistory = ctx.session.get('USER_SEARCH_HISTORY');
        if (!searchHistory) {
            searchHistory = {}
        } 

        if (!searchHistory[assetType]) {
            searchHistory[assetType] = [];
        }

        var exists = false;
        for (index = 0; index < searchHistory[assetType].length; index++) {
            if (searchHistory[assetType][index].query === searchQuery) {
                exists = true;
                break;
            }
        };

        if (exists === false) {
            var d = new Date();
            var n = d.getTime();
            var queryObject = {
                "timeStamp" : n,
                "query" : searchQuery
            };
            searchHistory[assetType].push(queryObject);
        };

        if (searchHistory[assetType].length > 5) {
            searchHistory[assetType].shift();
        }
        log.debug('search history: '+stringify(searchHistory));
        ctx.session.put('USER_SEARCH_HISTORY', searchHistory);
    };

}(api));
