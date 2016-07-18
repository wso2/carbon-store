/*
 *  Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
var asset = {};
var AssetEvents = {};
(function(asset) {
    var PROCESSING_TEXT = "processing";
    var SUCCESS_TEXT = "success";
    var ERROR_TEXT = "error";
    var getText = function(key) {
        var bookmarkData = $('.main-bookmark');
        var text = "A message was not defined for " + key + " please check process-asset templates";
        if (bookmarkData.length) {
            text = bookmarkData.first().data(key);
        }
        return text;
    };
    asset.process = function(type, path, destination, elem) {
        if (!store.user) {
            $('#modal-login').modal('show');
            return;
        }
        $(elem).find("i").removeClass().addClass('fa fa-spinner fa-spin');
        $(elem).find('.main-bookmark').html(getText(PROCESSING_TEXT));
        $(elem).unbind('click');
        $.ajax({
            url: caramel.url('/apis/subscriptions'),
            data: {
                type: type,
                asset: path,
                destination: encodeURIComponent(location.href)
            },
            method: 'POST',
            success: function(data) {
                messages.alertSuccess(getText(SUCCESS_TEXT));
                window.location.href = destination;
            },
            error: function() {
                messages.alertError(getText(ERROR_TEXT));
                $('i', elem).removeClass().addClass('fw fw-bookmark store-bookmark');
            }
        });
    };
    asset.unsubscribeBookmark = function(type, path, destination, elem) {
        if (!store.user) {
            $('#modal-login').modal('show');
            return;
        }
        $(elem).find("i").removeClass().addClass('fa fa-spinner fa-spin');
        $(elem).find('.main-bookmark').html(getText(PROCESSING_TEXT));
        $.ajax({
            url: caramel.url('/apis/subscriptions') + '?type=' + type + '&asset=' + path,
            method: 'DELETE',
            dataType: 'text json',
            success: function(data) {
                messages.alertSuccess(getText(SUCCESS_TEXT));
                $('i', elem).removeClass().addClass('fw fw-bookmark store-bookmark');
                $(elem).parents('[class^="ctrl-wr-asset"]').fadeOut();
                if ($(elem).find('.main-bookmark').length > 0) {
                    $(elem).find("i").removeClass().addClass('fw fw-bookmark');
                    $(elem).attr('id', 'btn-add-gadget');
                }
                window.location.href = destination;
            },
            error: function(data) {
                var parent = $(elem).parents('[class^="ctrl-wr-asset"]');
                messages.alertError(getText(ERROR_TEXT));
                $(parent.find(".confirmation-popup-container")).fadeOut();
                parent.find('.btn-group').show();
                parent.find('#bookmark-animation').hide();
                $('i', elem).removeClass().addClass('fw fw-bookmark store-bookmarked');
            }
        });
    };
    AssetEvents.registerTagHandlers = function() {
        $('.es-remove-tag').on('click', function(e) {
            e.preventDefault();
            var url = window.location.href;
            url = removeTagFromURL(url);
            window.location = url;
        });
        $('.es-add-tag').on('click', function(e) {
            e.preventDefault();
            var url = window.location.href;
            url = addTagToURL(url, this);
            window.location = url;
        });
    };
    /*
    We rewrite the url with sorting meta data.This is needed to support
    the way we filter taxonomy without a page reload
     */
    $('.sorting-option').on('click', function(e) {
        e.preventDefault();
        var sortOptions = {};
        sortOptions.sortBy = $(this).data('sortByQuery');
        sortOptions.sort = $(this).data('sortQuery');
        window.location = enrichUrlWithSortParams(window.location.href, sortOptions)
    });
    $('.assets-show-more').click(function() {
        $(this).toggle();
        $('.assets-show-less').toggle();
        $('.navigation .all-item').show();
    });
    $('.assets-show-less').click(function() {
        $(this).toggle();
        $('.assets-show-more').toggle();
        $('.navigation .all-item').each(function() {
            if (!$(this).attr('data-selected')) {
                $(this).hide();
            }
        });
    });
    AssetEvents.registerTagHandlers();
    /*
    The function adds the sorting properties provided in the sorting options into
    the provided URL
     */
    function enrichUrlWithSortParams(url, sortOptions) {
        var sortByPattern = /sortBy=([^&;]+)/;
        var sortPattern = /sort=([^&;]+)/;
        var matchedSortByPattern = url.match(sortByPattern);
        var matchedSortPattern = url.match(sortPattern);
        var hasSortBy = !!matchedSortByPattern;
        var hasSort = !!matchedSortPattern;
        //Do not alter the query if there are no sort options
        if (Object.keys(sortOptions).length < 1) {
            return url;
        }
        //Encode any provided sort option values
        Object.keys(sortOptions).forEach(function(key) {
            sortOptions[key] = encodeURIComponent(sortOptions[key]);
        });
        //Handle replacing any existing sort and sortBy values
        if ((hasSort) && (sortOptions.sort)) {
            url = url.replace(sortPattern, 'sort=' + sortOptions.sort);
        }
        if ((hasSortBy) && (sortOptions.sortBy)) {
            url = url.replace(sortByPattern, 'sortBy=' + sortOptions.sortBy);
        }
        //Check if there is atleast one query parameter
        var hasExistingQueryParams = url.indexOf('?') > -1;
        var newQueryParams = [];
        if (!hasExistingQueryParams) {
            url += '?';
        }
        //Handle adding sort when it does not exist in the url
        if (!hasSort) {
            newQueryParams.push('sort=' + sortOptions.sort);
        }
        if (!hasSortBy) {
            newQueryParams.push('sortBy=' + sortOptions.sortBy);
        }
        //We did not add any new query paramters
        if (newQueryParams.length < 1) {
            return url;
        }
        //Integrate any newly added sort parameters to the URL
        var urlComponents = url.split('?');
        var urlWithoutQueryParams = urlComponents.slice(0, 1);
        var urlWithQueryParams = urlComponents.slice(1);
        //Check if there are no query params and create an empty array
        if ((urlWithQueryParams.length === 1) && (urlWithQueryParams[0] === '')) {
            urlWithQueryParams = [];
        }
        return urlWithoutQueryParams.concat(newQueryParams.concat(urlWithQueryParams).join('&')).join('?');
    }

    function addTagToURL(url, element) {
        var decodedURI = decodeURIComponent(url);
        var exp = URL.buildURL(decodedURI);
        var q = exp.queryParam('q')
        var selectedTag = $(element).data('selectedTag');
        if ((!selectedTag) || (selectedTag === '')) {
            throw 'Unable to locate tag details to add to the URL';
        }
        if (!q) {
            exp.queryParam('q', '"tags":""');
            q = exp.queryParam('q');
        }
        q.set('"tags"', '"' + selectedTag + '"');
        return exp.compile();
    }

    function removeTagFromURL(url) {
        var decodedURI = decodeURIComponent(url);
        var exp = URL.buildURL(decodedURI);
        var q = exp.queryParam('q')
        if (q) {
            q.remove('"tags"');
        }
        return exp.compile();
    }
}(asset));