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
var PublisherUtils = {};
(function() {
    var SUCCESS_ICON = 'glyphicon glyphicon-ok';
    var FAILURE_ICON = 'glyphicon glyphicon-remove';
    var OVERLAY_CONTAINER_ID = 'ui-asset-operations-overlay';
    var OVERLAY_CONTAINER_HTML = '<div id="' + OVERLAY_CONTAINER_ID + '"></div>';
    var getID;


    PublisherUtils.resolveCurrentPageAssetType = function(){
        if((!store)&&(!store.publisher)){
            return 'asset';
        }
        if(!store.publisher.type){
            return 'asset';
        }
        return store.publisher.type;
    };
    var spinnerURL = function() {
        return caramel.url('/themes/default/img/preloader-40x40.gif');
    };
}());