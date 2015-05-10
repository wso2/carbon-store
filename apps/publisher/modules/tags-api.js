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
    var buildQuery = function(jsonString) {
        jsonString = jsonString || '';
        jsonString = '{' + jsonString + '}';
        var jsonObj;
        try {
            jsonObj = parse(jsonString);
        } catch (e) {
            log.error(e);
        }
        return jsonObj;
    };
    api.add = function(am, options) {};
    api.remove = function(am, options) {};
    api.search = function(am, options) {
        var q = options.q;
        var tags = [];
        if(!options.type){
        	throw 'Asset type not specified';
        }
        //Parse the q object
        q = buildQuery(q);
        if (q) {
        	q.mediaType = am.rxtManager.getMediaType(options.type);
        	tags = am.search(q);
        } else {

        }
        return tags;
    };
}(api));