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
$(document).ready(function () {
    if (store && store.publisher && store.publisher.lifecycle) {
        if ((!store.publisher.lifecycle.activeLifecycle) || (store.publisher.lifecycle.activeLifecycle.length == '')) {
            enableDelete();
            return;
        }
        else if (store.publisher.lifecycle.deletableStates) {

            var assetState = store.publisher.lifecycle.currentState;
            var deletableStates = store.publisher.lifecycle.deletableStates.split(',');
            var astState = assetState ? assetState.toLowerCase() : assetState;

            if (deletableStates[0].toLowerCase() == '*') {
                enableDelete();
                return;
            }

            for (var index in deletableStates) {
                if (deletableStates[index].toLowerCase() == astState) {
                    enableDelete();
                    continue;
                } else {
                    disableDelete("Asset is not in a delatable State");
                }
            }
        } else {
            disableDelete("Asset is not in a delatable State");
        }
    } else {
        disableDelete("Asset delete configurations are not provided");
    }
});

var enableDelete = function () {
    $('#Delete').removeClass('not-active').removeAttr("title").unbind('click');
};

var disableDelete = function (msg) {
    $('#Delete').addClass('not-active').attr("title", msg).click(function (e) {
        e.preventDefault()
    });

    $('#btn-delete-con').hide();
    $('#delete-msg').text('Asset is not in a deletable state');
};