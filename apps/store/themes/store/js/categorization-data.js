/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
 */

(function (history) {
    //This function detects history.pushState() event
    var pushState = history.pushState;
    history.pushState = function (state, title, url) {
        if (typeof history.onpushstate == "function") {
            history.onpushstate({state: state});
        }
        if (!state || state.categorization == false) {
            loadCategorizationEntries(url);
        }
        loadTagEntries(url);
        return pushState.apply(history, arguments);
    };
})(window.history);

/**
 * This method loads the categorization-entry partial data when selection query changes. *
 * @param url   url to load the data from
 */
function loadCategorizationEntries(url) {
    var exp = URL.buildURL(decodeURIComponent(url));
    if (exp.queryParam('q')) {
        $('.refine > .panel > div').each(function () {
            exp.queryParam('q').remove('"' + $(this).attr('id') + '"');
        });
        url = exp.compile();
    }

    caramel.data({
        title: null,
        body: ['assets']
    }, {
        url: url,
        success: function (data, status, xhr) {
            caramel.partials(data._.partials, function () {
                caramel.render('categorization-entry', data.body.assets.context, function (info, content) {
                    $('#categorization-div').html(content);
                    categorization();
                    $('.refine > .panel > div').first().collapse('show');
                });
            });
        }
    });
}

/**
 * This method loads the tag-cloud partial data when selection query changes. *
 * @param url   url to load the data from
 */
function loadTagEntries(url) {
    caramel.data({
        title: null,
        body: ['assets']
    }, {
        url: url,
        success: function (data, status, xhr) {
            caramel.partials(data._.partials, function () {
                caramel.render('tag-cloud', data.body.assets.context, function (info, content) {
                    $('#tags-wrapper').html(content);
                    AssetEvents.registerTagHandlers();
                });
            });
        }
    });
}

$(function () {
    //expand first categorization field
    $('.refine > .panel > div').first().collapse('show');
});

$(window).on('load', function () {
    loadCategorizationEntries(window.location.href);
});
