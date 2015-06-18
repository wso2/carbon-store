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
var tagsAPI = {};
$(function() {
    tagsAPI.TAG_SELECTBOX = '.tag-ui-selectbox';
    tagsAPI.EVENT_TAG_ADDED = 'select2:select';
    tagsAPI.EVENT_TAG_REMOVED = 'select2:unselect';
    var getAssetType = function() {
        return store.publisher.type;
    };
    tagsAPI.removeTagsAPI = function(assetId) {
        return caramel.url('/apis/asset/' + assetId + '/remove-tags?type=' + getAssetType());
    };
    tagsAPI.addTagsAPI = function(assetId) {
        return caramel.url('/apis/asset/' + assetId + '/add-tags?type=' + getAssetType());
    };
    tagsAPI.getTagsAPI = function(assetId) {
        return caramel.url('/apis/asset/' + assetId + '/tags?type=' + getAssetType());
    };
    tagsAPI.tagsAPI = function() {
        return caramel.url('/apis/tags');
    };
    tagsAPI.tagSearchAPI = function(){
        return caramel.url('/apis/tags?type=' + getAssetType())
    }
    tagsAPI.disableSelect2 = function() {
        $(this.TAG_SELECTBOX).prop('disabled', true);
    };
    tagsAPI.enableSelect2 = function() {
        $(this.TAG_SELECTBOX).prop('disabled', false);
    };
    tagsAPI.selectedTags = function(){
        return $(this.TAG_SELECTBOX).val()||[];
    };
    tagsAPI.createData = function(data) {
        var result = {
            tags: data
        };
        return JSON.stringify(result);
    };
});