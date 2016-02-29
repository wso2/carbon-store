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
(function () {
	var log = new Log('persist-search-history');
	var server = require('store').server;
	var userObject = require('store').user;
	var app = require('rxt').app;
	var userApi = require('/modules/user-api.js').api;
	var user = server.current(session);
	var SEARCH_HISTORY_FEATURE = 'searchHistory';
	if (user) {
		var username = user.username;
		var tenantId = user.tenantId;

		if (!app.isFeatureEnabled(tenantId, SEARCH_HISTORY_FEATURE)) {
			if (log.isDebugEnabled()) {
				log.debug("search history feature is disabled, search history is not persisted in the registry");
			}
			return;
		}

		var searchHistory = userApi.userSearchHistoryData(session);
		if (searchHistory) {
			server.sandbox({tenantId: tenantId, username: username}, function () {
				var cleanUsername = userObject.cleanUsername(username);
				var systemRegistry = server.systemRegistry(tenantId);
				var resourcePath = userApi.searchHistoryResourcePath(cleanUsername);
				if (log.isDebugEnabled()) {
					log.debug("search history resource path: " + resourcePath);
				}
				var resource = systemRegistry.get(resourcePath);
				var resourceContent;
				if (resource) {
					resourceContent = JSON.parse(resource.content);
				}
				var sessionContent = searchHistory;
				if (log.isDebugEnabled()) {
					log.debug('session content ::: ' + stringify(sessionContent));
					log.debug('resource content ::: ' + stringify(resourceContent));
				}
				var writeContent = {};

				if (!resourceContent) {
					systemRegistry.put(resourcePath, {
						content: stringify(searchHistory)
					});
					return;
				}

				/*
				* Merging two sorted arrays to one sorted array
				* sorted arrays : session content and resource content
				* result array : write content.
				* */
				for (var key in sessionContent) {
					if (sessionContent.hasOwnProperty(key)) {
						var sessionContentByKey = sessionContent[key].reverse();
						if (resourceContent.hasOwnProperty(key)) {
							var resourceContentByKey = resourceContent[key].reverse();
							var writeContentByKey = [];
							var resourceIndex = 0, sessionIndex = 0, writeIndex = 0;
							while (writeIndex < sessionContent[key].length) {
								var sessionContentByIndex = sessionContentByKey[sessionIndex];
								var resourceContentByIndex = resourceContentByKey[resourceIndex];
								if (resourceContentByIndex &&
									sessionContentByIndex.timestamp < resourceContentByIndex.timestamp) {
									writeContentByKey.push(resourceContentByIndex);
									resourceIndex++;
								} else if (resourceContentByIndex &&
									sessionContentByIndex.timestamp == resourceContentByIndex.timestamp) {
									writeContentByKey.push(sessionContentByIndex);
									sessionIndex++;
									if (sessionContentByIndex.query == resourceContentByIndex.query) {
										resourceIndex++;
									}
								} else {
									writeContentByKey.push(sessionContentByIndex);
									sessionIndex++;
								}
								writeIndex++;
							}
							writeContent[key] = writeContentByKey.reverse();
						} else {
							writeContent[key] = sessionContentByKey.reverse();
						}
					}
				}
				if (log.isDebugEnabled()) {
					log.debug('write content ::: ' + stringify(writeContent));
				}
				systemRegistry.put(resourcePath, {
					content: stringify(writeContent)
				});

			});
		}
	}
}());
