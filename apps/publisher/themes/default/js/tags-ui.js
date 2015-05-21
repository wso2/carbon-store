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
    var TAG_SELECTBOX = '.tag-ui-selectbox';
    var EVENT_TAG_ADDED = 'select2:select';
    var EVENT_TAG_REMOVED = 'select2:unselect';
    var removeTagsAPI = function(assetId) {
        return caramel.url('/apis/asset/' + assetId + '/remove-tags?type=' + getAssetType());
    };
    var addTagsAPI = function(assetId) {
        return caramel.url('/apis/asset/' + assetId + '/add-tags?type=' + getAssetType());
    };
    var getTagsAPI = function(assetId) {
        return caramel.url('/apis/asset/' + assetId + '/tags?type=' + getAssetType());
    };
    var tagsAPI = function() {
        return caramel.url('/apis/tags');
    };
    var disableSelect2 = function() {
        $(TAG_SELECTBOX).prop('disabled', true);
    };
    var enableSelect2 = function() {
        $(TAG_SELECTBOX).prop('disabled', false);
    };
    var createData = function(data) {
        var result = {
            tags: data
        };
        return JSON.stringify(result);
    };
    var getAssetId = function() {
        return store.publisher.assetId;
    };
    var getAssetType = function() {
        return store.publisher.type;
    };
    var tagRemoved = function(e) {
        var tags = e.params.data.text;
        var assetId = getAssetId();
        disableSelect2();
        $.ajax({
            url: removeTagsAPI(assetId),
            type: 'DELETE',
            data: createData(tags),
            contentType: 'application/json',
            success: function() {
                enableSelect2();
            },
            error: function() {
                enableSelect2();
            }
        });
    };
    var tagAdded = function(e) {
        var tags = e.params.data.text;
        var assetId = getAssetId();
        disableSelect2();
        $.ajax({
            url: addTagsAPI(assetId),
            type: 'POST',
            data: createData(tags),
            contentType: 'application/json',
            success: function() {
                enableSelect2();
            },
            error: function() {
                enableSelect2();
            }
        });
    };
    $(TAG_SELECTBOX).select2({
        tags: true,
        placeholder: 'Please select a tag'
    });
    $(TAG_SELECTBOX).on(EVENT_TAG_ADDED, tagAdded);
    $(TAG_SELECTBOX).on(EVENT_TAG_REMOVED, tagRemoved);
});