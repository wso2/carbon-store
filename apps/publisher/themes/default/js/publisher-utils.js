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
	var SUCCESS_ICON ='glyphicon glyphicon-ok';
	var FAILURE_ICON ='glyphicon glyphicon-remove';

    var spinnerURL = function() {
        return caramel.url('/themes/default/img/preloader-40x40.gif');
    };
    var createLoadingIcon = function() {
        return '<img src="' + spinnerURL() + '" />';
    };
    var blockUI = function(overlayContainer, msg) {
        var container = $('.' + overlayContainer);
        container.html('<img src="' + spinnerURL() + '" />' + msg);
        container.css('position', 'absolute');
        container.css('z-index', 2);
        container.css('display', 'block');
        container.css('background-color', 'white');
        container.css('top', 0);
        container.css('bottom', 0);
        container.css('left', 0);
        container.css('right', 0);
    };
    var unblockUI = function(overlayContainer, msg) {
        var container = $('.' + overlayContainer);
        container.html('');
        container.attr('style', '');
        //container.html(msg);
    };
    PublisherUtils.blockButton = function(options) {
        options = options || {};
        var id = '#' + options.id || '';
        var overlayContainer = options.overlayContainer || null;
        var existingText;
        var msg = options.msg || 'Performing requested action';
        if (!id) {
            return;
        }
        //existingText = $(id).val();
        //$(id).data('originalText', existingText);
        //$(id).val(msg);
        $(id).attr('disabled', true);
        if (overlayContainer) {
            blockUI(overlayContainer, msg);
        }
    };
    PublisherUtils.successUnblockButton = function(options) {
        options = options || {};
        var id = '#' + options.id;
        var overlayContainer = options.overlayContainer || null;
        var msg = options.msg || 'Action successfully performed';
        if (!id) {
            return;
        }
        $(id).attr('disabled', false);
        if (overlayContainer) {
            unblockUI(overlayContainer);
        }
    };
    PublisherUtils.failureUnblockButton = function(options) {
    	options = options || {};
    	var id = '#'+options.id;
    	var overlayContainer = options.overlayContainer || null;
    	//var msg = options.msg || 'Failed to perform action';
    	//msg = '<span class="'+FAILURE_ICON+'"></span>Asset created!';
    	$(id).attr('disabled', false);
    	unblockUI(overlayContainer);
    };
}());