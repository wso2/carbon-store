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
    LifecycleAPI.event(constants.EVENT_LC_LOAD, function(options) {
        options = options || {};
        var lifecycleName = options.lifecycle;
        var impl = LifecycleAPI.lifecycle(lifecycleName);
        if (impl) {
            impl.render();
        }
    });
    LifecycleAPI.event(constants.EVENT_LC_LOAD, function(options) {
        
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