/*
 * Copyright (c) 2015, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var popoverFunction = (function(){
    var returnObj = {};
    returnObj.init = function(){

        var btn = '[data-click-event=popover]';

        /**
         * button click function
         */
        $(btn).click(function(e){
            e.preventDefault();
            $(this).next('.popover').toggle(0).toggleClass('in');
        });
        
        /*
         * Bind popover hide function to the document.
         */
        $(document).bind('click', function(e) {
            if(($(e.target).closest(btn).length !== 1) && ($(e.target).closest('.popover').length === 0)){
                $(btn).next('.popover').removeClass('in').hide();
            }
        });

    };
    return returnObj;
})();

var currentPageFunction = (function () {
    var returnObj = {};
    returnObj.init = function () {
        switch (store.publisher.currentPage) {
            case "details":
                $(".btn-overview").addClass("tab-selected");
                break;
            case "copy":
                $(".btn-copy").addClass("tab-selected");
                break;
            case "update":
                $(".btn-edit").addClass("tab-selected");
                break;
            case "delete":
                $(".btn-delete").addClass("tab-selected");
                break;
            case "lifecycle":
                $(".btn-lifecycle").addClass("tab-selected");
                break;
            case "associations":
                $(".btn-association").addClass("tab-selected");
                break;
            case "permissions":
                $(".btn-permission").addClass("tab-selected");
                break;
        }
    };
    return returnObj;
})();

$(function(){
    popoverFunction.init();
    currentPageFunction.init();
    $('[data-toggle="tooltip"]').tooltip();
});