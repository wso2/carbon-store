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
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
        var results = regex.exec(url);
        if (results && results[2]) {
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        }

        return '';
    };

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
                    queryObjValue = newObj.split("OR");
                } else {
                    if (obj.indexOf(":") > -1) {
                        queryObjValue.push(obj.split(":")[1].split('\"').join(''));
                    }
                }
                queryObj.queryValue = queryObjValue;
                queryObjArray.push(queryObj);
            }

            for (var i in queryObjArray) {
                $('.categorization-checkbox:checkbox').each(function () {
                    var $this = $(this);
                    if ($this.attr('name') == queryObjArray[i].queryKey) {
                        for (var k in queryObjArray[i].queryValue) {
                            if ($this.attr('value').toLowerCase()
                                == queryObjArray[i].queryValue[k].trim().toLowerCase()) {
                                $this.attr('checked', true);
                                $("#" + $this.attr('name')).collapse('show');
                                var icon = $("#" + $this.attr('name')).prev().find('.status').children();
                            }
                        }
                    }
                });
            }
        }
    };

    var search = function (searchQuery, data, isRemove) {
        var url;

        var encodedQueryString = getEncodedQueryString(searchQuery);
        currentPage = 1;
        if (store.asset) {
            if (window.location.href.indexOf("q=") > -1) {
                if (!isRemove) {
                    if (getParameterByName('q') !== "") {
                        if (window.location.href.indexOf(searchQuery.split(":")[0]) > -1) {
                            url = removeURLParameter(decodeURIComponent(window.location.href),
                                data, true);
                            if (getParameterByName('q', url) !== "") {
                                url = url + "%2C" + encodedQueryString;
                            } else {
                                url = url + encodedQueryString;
                            }
                        } else {
                            url = window.location.href + "%2C" + encodedQueryString;
                        }
                    } else {
                        url = window.location.href + encodedQueryString;
                    }
                } else {
                    url = removeURLParameter(decodeURIComponent(window.location.href), data, false);
                }

            } else {
                url = caramel.tenantedUrl('/assets/' + store.asset.type + '/list?' + buildParams(encodedQueryString));
            }
            loadAssets(url);
        }

        $('.search-bar h2').find('.page').text(' / Search: "' + searchQuery + '"');
    };

    var buildParams = function (query) {
        return 'q=' + query;
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
                var innerParams = param.split(",");
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
        history.pushState("", "", url);
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
