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

var categorizationArray = [];
var categorization = function () {

    /**
     * This method returns the query parameter by name
     * @param name          name of the query parameter
     * @param url           url
     * @returns {string}    query parameter string
     */
    var getParameterByName = function (name, url) {
        if (!url) {
            url = window.location.href;
        }
        url = decodeURIComponent(url);
        var queryParam = URL.buildURL(url).queryParam(name);
        if (!queryParam) {
            return '';
        }
        var queryParamValue = queryParam.value ? queryParam.value : '';
        return queryParamValue ? decodeURIComponent(queryParamValue.toString()) : '';
    };

    /**
     * This method updates the categorization option state on query change
     * @param url   window url
     */
    var updateFilters = function (url) {
        var queryParam = getParameterByName('q', url);
        var queryArray = [];
        if (queryParam) {
            queryArray = queryParam.split(",");
        }
        var queryObjArray = [];
        if (queryArray.length > 0) {
            for (var index in queryArray) {
                var obj = queryArray[index];
                var queryObj = {};
                var queryObjValue = [];
                queryObj.queryKey = obj.split(":")[0].split('\"').join('');
                if (obj.indexOf("(") > -1) {
                    var newObj = obj.split(":")[1].split('\"').join('').replace("(", "").replace(")", "");
                    queryObjValue = newObj.split(" OR ");
                } else {
                    if (obj.indexOf(":") > -1) {
                        queryObjValue.push(obj.split(":")[1].split('\"').join(''));
                    }
                }
                queryObj.queryValue = queryObjValue;
                queryObjArray.push(queryObj);
            }

            $('.refine > .panel > div').each(function () {
                var field = $(this).attr('id');
                var queryObject = queryObjArray.filter(function (queryObj) {
                    return queryObj.queryKey == field;
                });

                if (queryObject.length == 0) {
                    return;
                }

                var queryValues = (queryObject.length == 1) ? queryObject[0].queryValue : null;

                $(this).find('input:checkbox').each(function () {
                    var valueIndex = queryValues ? queryValues.indexOf($(this).attr('value').toLowerCase()) : -1;
                    if (valueIndex > -1) {
                        $(this).attr('checked', true);
                        queryValues.splice(valueIndex, 1);
                        $(this).closest('#' + field).collapse('show');
                    }
                });

                for (var value in queryValues) {
                    var data = {};
                    if (queryValues.hasOwnProperty(value)) {
                        data.parent = field;
                        data.text = queryValues[value];
                        url = removeURLParameter(decodeURIComponent(url), data, false);
                    }
                }
                url = URL.buildURL(url).compile();
                history.replaceState({categorization: true}, "", url);
            });
        }
    };

    var search = function (searchQuery, data, isRemove) {
        var url = decodeURIComponent(window.location.href);
        var expression = URL.buildURL(url);
        var query = searchQuery.split(':');
        currentPage = 1;
        if (store.asset) {
            if (expression.queryParam('q')) {
                if (!isRemove) {
                    expression.queryParam('q').remove('"' + data.parent + '"');
                    expression.compile();
                    expression.queryParam('q').set('"' + query[0] + '"', '"' + query[1] + '"');
                    url = expression.compile();
                } else {
                    url = removeURLParameter(url, data, false);
                }
            } else {
                url = caramel.tenantedUrl('/assets/' + store.asset.type + '/list?' +
                    buildParams(getEncodedQueryString(searchQuery)));
            }
            loadAssets(url);
        }

        $('.search-bar h2').find('.page').text(' / Search: "' + searchQuery + '"');
    };

    var buildParams = function (query) {
        var params = window.location.href.split('?')[1];
        params = params ? params + '&q=' + query : 'q=' + query;
        return params;
    };

    var getEncodedQueryString = function (searchQuery) {
        var q = {};
        var output = '';
        if (searchQuery !== '') {
            q = parseUsedDefinedQuery(searchQuery);
            q = JSON.stringify(q);
            q = q.replace('{', '').replace('}', '');
            q = encodeURIComponent(q);
            output = q;
        }
        return output;
    };

    var triggerEvent = function (data, isRemove) {
        var searchQueryString = data.parent + ":" + data.text;

        if ((window.location.href.indexOf(data.parent) > -1) && !isRemove) {
            searchQueryString = updateORQuery(window.location.href, data);
        }
        search(searchQueryString, data, isRemove);
    };

    var updateORQuery = function (url, data) {
        var value = getParamValue(url, data.parent).trim();
        var updatedQuery = "";
        if (value.indexOf("(") > -1) {
            updatedQuery = data.parent + ":(" + value.substring(value.indexOf("\"(") + 2, value.indexOf(")\"")) + " OR "
                + data.text + ")";
        } else {
            value = "\"" + value.split("\"").join("").trim() + "\"";
            updatedQuery = data.parent + ":(" + value.replace("\"", "").replace("\"", "") + " OR " + data.text + ")";
        }
        return updatedQuery;
    };

    var removeURLParameter = function (sourceURL, data, removeWhole) {
        var rtn = sourceURL.split("?")[0],
            param,
            params_arr = [],
            queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
        if (queryString !== "") {
            params_arr = queryString.split("&");
            for (var i = params_arr.length - 1; i >= 0; i -= 1) {
                param = params_arr[i].split("=")[1];
                var innerParams = param ? param.split(",") : [];
                for (var j = innerParams.length - 1; j >= 0; j -= 1) {
                    if (innerParams[j].indexOf(data.parent) > -1) {
                        if ((innerParams[j].indexOf("OR") > -1) && !removeWhole) {
                            var currValues = innerParams[j].substring(innerParams[j].indexOf("\"(") + 2,
                                innerParams[j].indexOf(")\"")).split("OR");
                            for (var n in currValues) {
                                if (data.text == currValues[n].trim()) {
                                    currValues.splice(n, 1);
                                }
                            }
                            if (currValues.length > 1) {
                                innerParams[j] = "\"" + data.parent + "\":\"(" +
                                    currValues.map(Function.prototype.call, String.prototype.trim).join(" OR ").trim()
                                    + ")\"";
                            } else {
                                innerParams[j] = "\"" + data.parent + "\":\"" + currValues.join("").trim() + "\"";
                            }

                        } else {
                            innerParams.splice(j, 1);
                        }
                    }
                }
                params_arr[i] = params_arr[i].split("=")[0] + "=" + encodeURIComponent(innerParams.join(","));
            }
            rtn = rtn + "?" + params_arr.join("&");
        }
        return rtn;
    };

    var getParamValue = function (sourceURL, key) {
        var param,
            params_arr = [],
            queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
        if (queryString !== "") {
            params_arr = queryString.split("&");
            for (var i = params_arr.length - 1; i >= 0; i -= 1) {
                param = params_arr[i].split("=")[1];

                var innerParams;
                if (param.indexOf(",") > -1) {
                    innerParams = param.split(",");
                } else {
                    innerParams = param.split("%2C");
                }
                for (var j = innerParams.length - 1; j >= 0; j -= 1) {
                    if (innerParams[j].indexOf(key) > -1) {
                        return decodeURIComponent(innerParams[j]).split(":")[1];
                    }
                }
            }
        }
    };

    var formatSearchQuery = function (query) {
        var searchQuery = "";
        var qjson = JSON.parse('{' + query + '}');
        var searchKeys = Object.keys(qjson);
        if ((searchKeys.length === 1) && (searchKeys.indexOf("name") >= 0)) {
            searchQuery += qjson[searchKeys.pop()];
        }
        else {
            for (var keyIndex in searchKeys) {
                var key = searchKeys[keyIndex];
                var value = qjson[key];
                searchQuery += key + ":" + value + " ";
            }
        }
        searchQuery = searchQuery.trim();
        return searchQuery;
    };

    var loadAssets = function (url) {
        $('.assets-container section .ctrl-wr-asset').remove();
        history.pushState({categorization: true}, "", url);
        resetPageAttributes();
        store.infiniteScroll.addItemsToPage();
        setCategorizationQuery(url);
    };

    var setCategorizationQuery = function (url) {
        var searchQuery = removeUnrelatedKeys(decodeURIComponent(url));
        $('#categorization-query').val(formatSearchQuery(searchQuery));
    };

    /**
     * This method removes the keys from the search query which are not related
     * to taxonomy for categorization in order to make generic search independent from taxonomy
     * @param url
     * @returns {string}
     */
    var removeUnrelatedKeys = function (url) {
        var searchQuery = getParameterByName('q', url);
        if (!searchQuery) {
            return '';
        }
        var keyValues = searchQuery.split(",");
        for (var i in keyValues) {
            var data = {};
            var isRemove = true;
            data.parent = keyValues[i].split(":")[0].split("\"").join('').trim();
            data.text = keyValues[i].split(":")[1].split("\"").join('').trim();

            for (var j in categorizationArray) {
                if (categorizationArray[j] == data.parent) {
                    isRemove = false;
                    break;
                }
            }

            if (isRemove) {
                url = removeURLParameter(decodeURIComponent(url), data, true);
            }
        }

        return decodeURIComponent(getParameterByName('q', url));
    };
    var resetPageAttributes = function () {
        store.rows_added = 0;
        store.last_to = 0;
        store.items_per_row = 0;
        store.doPagination = true;
        store.firstRun = false;
        store.infiniteScroll.recalculateRowsAdded();
    };

    $('.categorization-checkbox:checkbox').click(function () {
        var $this = $(this);
        var data = {};
        data.parent = $this.attr('name');
        data.text = $this.attr('value');
        // $this will contain a reference to the checkbox
        if ($this.is(':checked')) {
            // the checkbox was checked
            triggerEvent(data, false);
        } else {
            // the checkbox was unchecked
            triggerEvent(data, true);
        }
    });

    $('.categorization-checkbox:checkbox').each(function () {
        var $this = $(this);
        categorizationArray.push($this.attr('name'));
    });

    $.unique(categorizationArray);
    categorizationArray.push("taxonomy");

    var url = decodeURIComponent(window.location.href);
    if ((url.indexOf("q=") > -1) && (getParameterByName('q', url) !== "")) {
        setCategorizationQuery(url);
    }

    if ($('#search').val() !== '') {
        $('#search').val($.cookie("searchQuery"));
    }

    if (url.indexOf("=") > -1) {
        var query = url.split("=");
        if (query[1] !== "") {
            updateFilters(url);
        }
    }
};

$(function () {
    categorization();
});
