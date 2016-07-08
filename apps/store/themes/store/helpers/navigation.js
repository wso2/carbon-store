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
var format = function(context, data, page, area, meta) {
	context = context();
	context.user = data.user;
	return context;
};

var resources = function(page, meta) {
	return {
		js: ['asset-helpers.js', 'navigation.js', 'popover.js', 'jquery.validate.js', 'jquery.cookie.js', 'search.js',
			'list_assets.js', 'categorization.js', 'categorization-data.js', 'taxonomy_view.js',
			'wso2-visual-elements.js', 'select2.full.min.js'],
		css: ['navigation.css', 'categorization.css', 'theme-categorization.min.css']
	};
};

var currentPage = function(navigation, type, search) {
	var asset;

	for (asset in navigation.assets) {
		if (asset == type) {
			navigation.assets[asset].selected = true;
			break;
		}
	}
	navigation.search = search;
	return navigation;
};