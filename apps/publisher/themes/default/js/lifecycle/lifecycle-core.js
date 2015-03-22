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
var LifecycleAPI = {};
(function() {
    var configMap = {};
    var pluginMap = [];
    var eventMap = {};
    var dataMap = {};
    LifecycleAPI.plugin = function() {
        var pluginImpl = arguments[0];
        if (!pluginImpl) {
            return;
        }
        if ((arguments.length === 1) && (typeof pluginImpl === 'object')) {
            pluginMap.push(arguments[0]);
        }
    };
    LifecycleAPI.configs = function() {
        //Set configurations
        if ((arguments.length == 1) && (typeof arguments[0] == 'object')) {
            configMap = arguments[0]
        }
        //Retrieve a single configuration value
        else if ((arguments.length = 1) && (typeof arguments[0] == 'string')) {
            return configMap[arguments[0]];
        }
        //Retrieve all configurations
        else {
            return configMap;
        }
    };
    LifecycleAPI.constants = {};
    LifecycleAPI.constants.API_ENDPOINT = 'lifecycle-api';
    LifecycleAPI.load = function() {
        var plugin;
        for (var index = 0; index < pluginMap.length; index++) {
            plugin = pluginMap[index];
            if (plugin.hasOwnProperty('load')) {
                plugin.load();
            }
        }
    };
    LifecycleAPI.event = function() {
        var eventName = arguments[0];
        var eventCb = arguments[1];
        var eventCallbacks;
        if ((eventCb) && (typeof eventCb === 'object')) {
            if (eventMap.hasOwnProperty(eventName)) {
                eventCallbacks = eventMap[eventName];
                for (var index = 0; index < eventCallbacks.length; index++) {
                    eventCallbacks[index](eventCb);
                }
            }
        } else if ((eventCb) && (typeof eventCb === 'function')) {
            if (!eventMap.hasOwnProperty(eventName)) {
                eventMap[eventName] = [];
            }
            eventMap[eventName].push(eventCb);
        }
    };
    LifecycleAPI.data = function() {
        var dataKey = arguments[0];
        var data = arguments[1];
        if (arguments.length == 1) {
            return dataMap[dataKey];
        } else if (arguments.length == 2) {
            dataMap[dataKey] = data;
        }
    };
    LifecycleAPI.utils = {};
    var recursiveDetectedCyclicPath = function(root, stateMap, traversedNodes) {
        if ($.inArray(root, traversedNodes)>-1) {
            return true;
        } else if (!stateMap[root]) {
            return false;
        } else {
            var state = stateMap[root];
            var transitions = state.transitions;
            var transition;
            traversedNodes.push(root);
            var isLoop;
            for (var index = 0; index < transitions.length; index++) {
                transition = transitions[index].target.toLowerCase();
                isLoop = recursiveDetectedCyclicPath(transition, stateMap, traversedNodes);
                if (isLoop) {
                    return true;
                }
            }
            return false;
        }
    };
    LifecycleAPI.utils.detectCyclicPath = function(root,stateMap) {
        var traversedNodes = [];
        return recursiveDetectedCyclicPath(root, stateMap.states, traversedNodes);
    };
}());