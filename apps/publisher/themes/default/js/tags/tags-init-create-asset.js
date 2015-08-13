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
$(function () {
    var TAG_SELECTBOX = tagsAPI.TAG_SELECTBOX;
    $(TAG_SELECTBOX).select2({
        tags: true,
        ajax: {
            url: tagsAPI.tagSearchAPI,
            dataType: "json",
            delay: 250,
            data: function (params) {
                var query = '"name":"' + params.term + '"';
                return {
                    q: query
                };
            },
            processResults: function (data, page) {
                var i;
                var o;
                var length = data.length;
                var results = [];
                for (i = 0; i < length; i++) {
                    o = data[i];
                    results.push({ id: o.name, text: o.name});
                }
                return {
                    results: results
                };
            },
            cache: true
        },
        minimumInputLength: 2,
        templateSelection: function (data) {
            return data.text;
        }

    })
});