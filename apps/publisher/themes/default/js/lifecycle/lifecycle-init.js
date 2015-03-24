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
$(function() {
    'use strict';
    var constants = LifecycleAPI.constants;
    var id = function(name) {
        return '#' + name;
    };
    var config = function(key) {
        return LifecycleAPI.configs(key);
    };
    var partial = function(name) {
        return '/themes/' + caramel.themer + '/partials/' + name + '.hbs';
    };
    var renderPartial = function(partialKey, containerKey, data, fn) {
        fn = fn || function() {};
        var partialName = config(partialKey);
        var containerName = config(containerKey);
        if (!partialName) {
            throw 'A template name has not been specified for template key ' + partialKey;
        }
        if (!containerName) {
            throw 'A container name has not been specified for container key ' + containerKey;
        }
        var obj = {};
        obj[partialName] = partial(partialName);
        caramel.partials(obj, function() {
            var template = Handlebars.partials[partialName](data);
            $(id(containerName)).html(template);
            fn();
        });
    };
    var renderLCActions = function() {
        var container = config(constants.CONTAINER_LC_ACTION_AREA);
        var impl = LifecycleAPI.lifecycle();
        var actions;
        var action;
        if (impl) {
            actions = impl.actions();
            var data = {};
            var map = data.actions = [];
            var mapping;
            for (var index = 0; index < actions.length; index++) {
                action = actions[index];
                mapping = {};
                mapping.label = action;
                mapping.style = 'btn-default';
                map.push(mapping);
            }
            renderPartial(constants.CONTAINER_LC_ACTION_AREA, constants.CONTAINER_LC_ACTION_AREA, data);
        }
    };
    var renderChecklistItems = function(){
        var container = config(constants.CONTAINER_CHECKLIST_AREA);
        var impl = LifecycleAPI.lifecycle();
        if(impl){
            checklist = impl.checkItems();
        }
    };
    LifecycleAPI.event(constants.EVENT_LC_LOAD, function(options) {
        options = options || {};
        var lifecycleName = options.lifecycle;
        var impl = LifecycleAPI.lifecycle(lifecycleName);
        if (impl) {
            impl.render();
        }
    });
    LifecycleAPI.event(constants.EVENT_LC_LOAD, function(options) {
        renderLCActions();
    });
    LifecycleAPI.event(constants.EVENT_STATE_CHANGE, function() {
        renderLCActions();
    });
    LifecycleAPI.event(constants.EVENT_LC_UNLOAD, function(options) {
        var container = config(constants.CONTAINER_LC_ACTION_AREA);
        $(id(container)).html('');
    });
    /**
     * The event callback is used to listen to selection changes to
     * the lifecycle select box
     */
    $(constants.UI_LIFECYCLE_SELECT_ID).change(function() {
        var selectedLC = $(this).val();
        //Call unload to make sure that the UI elements can de render
        LifecycleAPI.unloadActiveLifecycle();
        //Load the new lifecycle
        LifecycleAPI.lifecycle(selectedLC).load();
    });
    var init = function() {
        var activeLC = LifecycleUtils.currentAsset().activeLifecycle;
        LifecycleAPI.lifecycle(activeLC).load();
    };
    init();
});