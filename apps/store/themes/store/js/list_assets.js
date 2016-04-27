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
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var categorizationArray = [];
var initCategorySelection = function () {
    $('div.category ul.dropdown-menu li a').click(function (e) {
        e.preventDefault();
        var selectedCategory = $(this).text();
        window.location = createQuery({
            category: selectedCategory
        });
    });
};

var createQuery = function (options) {
    options = options || {};
    var searchUrl = caramel.url('/assets/' + store.asset.type + '/list');
    var q = {};
    var input = $('#search').val();
    var tag = $('#selectedTag').val();
    var category = options.category || undefined;
    var searchQueryString = '?';
    q = parseUsedDefinedQuery(input);
    if (category) {
        if (category == "All Categories") {
            category = "";
        }
        q.category = category;
    }
    if(tag){
        q.tags = tag;
    }
    if (propCount(q) >= 1) {
        searchQueryString += 'q=';
        searchQueryString += encodeURIComponent(JSON.stringify(q).replace('{', '').replace('}', ''));
    }
    return searchUrl + searchQueryString;
};

var propCount = function (obj) {
    var count = 0;
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            count++;
        }
    }
    return count;
};


var parseUsedDefinedQuery = function (input) {
    var terms;
    var q = {};
    var term;
    var arr = [];
    var previous;
    // clear prefix white spaces and tail white spaces
    input = input.trim();
    input = replaceAll(input,"(\\s)*:(\\s)*", ":");
    //Use case #1 : The user has only entered a name
    if ((!isTokenizedTerm(input)) && (!isEmpty(input))) {
        if(input.indexOf('"') > -1){
            q.name = JSON.stringify(JSON.parse(input));
        } else {
            q.name = encodeURIComponent(input);
        }
        return q;
    }

    //Use case #2: The user has entered a complex query
    //and one or more properties in the query could values
    //with spaces
    //E.g. name:This is a test tags:wso2
    terms = input.split(' ');

    for (var index = 0; index < terms.length; index++) {
        term = terms[index];
        term = term.trim(); //Remove any whitespaces
        //If this term is not empty and does not have a : then it should be appended to the
        //previous term
        if ((!isEmpty(term)) && (!isTokenizedTerm(term))) {
            previous = arr.length - 1;
            arr[previous] = arr[previous] + ' ' + term;
        } else {
            arr.push(term);
        }
    }
    return parseArrToJSON(arr);
};
/**
 * Replace all the occurrences of $regex by $replace in $originalString
 * @param  {originalString} input - Raw string.
 * @param  {regex} input - Target key word or regex that need to be replaced.
 * @param  {replace} input - Replacement key word
 * @return {String}       Output string
 */
var replaceAll = function(originalString, regex, replace) {
    return originalString.replace(new RegExp(regex, 'g'), replace);
};
var isTokenizedTerm = function (term) {
    return term.indexOf(':') > -1;
};
var isEmpty = function (input) {
    return (input.length === 0);
};

var parseArrToJSON = function (items) {
    var item;
    var components;
    var obj = {};
    var key;
    var value;
    for (var index = 0; index < items.length; index++) {
        item = items[index];
        components = item.split(':');
        if (components.length == 2) {
            key = components[0];
            value = components[1];
            obj[key] = value;
        }
    }
    return obj;
};

var assetAvailability = false;
var getURL = function (param) {
    var decodedURL = decodeURIComponent(window.location.href);
    var parameters = decodedURL.split('q=');
    var parameterArray = parameters[1].split(",");

    for (var i = 0; i < parameterArray.length; i++) {
        if (parameterArray[i].indexOf("taxonomy") > 0) {

            if (param) {
                parameterArray[i] = encodeURIComponent('"taxonomy":' + '"' + $(param).attr("id") + '"');
            } else {
                var strJsonTaxonomy = "{" + parameterArray[i] + "}";
                var taxonomyObject = JSON.parse(strJsonTaxonomy);
            }
        }
    }

    if (param) {
        var originalString = parameterArray.join(encodeURIComponent(","));
        var mainString = "q=" + originalString;
        return mainString;
    } else {
        return taxonomyObject.taxonomy;
    }


};

var checkAndSendQuery = function (param) {

    var query = '"taxonomy":' + '"' + $(param).attr('id') + '"';
    var url = decodeURIComponent(window.location.href);

    var parameters = url.split('q=');

    if (url.indexOf("q=") > 0) {
        if (url.indexOf("taxonomy") > 0) {
            topAssetRefresh(parameters[0] +  getURL(param), param);
        } else {
            topAssetRefresh(url + encodeURIComponent("," +  query), param);
        }

    } else {
        topAssetRefresh(url + "?q=" + encodeURIComponent(query), param);
    }

};


var topAssetRefresh = function (url, param) {

    if (window.location.href.toString().indexOf("top-assets") > 0) {
        window.location.href = url;
    } else {
        loadURL(url, param);
        setCategorizationQuery(url);
    }
};

var setCategorizationQuery = function (url) {
    var searchQuery = removeUnrelatedKeys(decodeURIComponent(url));
    $('#categorization-query').val(formatSearchQuery(searchQuery));
};


$('#categorization :checkbox').each(function () {
    var $this = $(this);
    categorizationArray.push($this.attr('name'));
});

$.unique(categorizationArray);
categorizationArray.push("taxonomy");

/**
 * This method removes the keys from the search query which are not related
 * to taxonomy for categorization in order to make generic search independent from taxonomy
 * @param url
 * @returns {string}
 */
var removeUnrelatedKeys = function (url) {
    var searchQuery = url.split("q=")[1];
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

    return decodeURIComponent(url.split("q=")[1]);
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

var resetPageAttributes = function () {
    store.rows_added = 0;
    store.last_to = 0;
    store.items_per_row = 0;
    store.doPagination = true;
    store.firstRun = false;
    store.infiniteScroll.recalculateRowsAdded();
};

var loadURL = function (url, param) {
    $('.assets-container section .ctrl-wr-asset').remove();
    history.pushState("", "", url);
    resetPageAttributes();
    store.infiniteScroll.addItemsToPage(function (data, status, err) {
        if (err) {
            assetAvailability = false;
        } else {
            if (data.body.assets.context.assets.length == 0) {
                assetAvailability = false;
                // if assets not available in page
                $(param).toggleClass("selected");

                for (var j = 0; j < globalCount; j++) {
                    if (parseInt($(param).attr('globalid')) - 1 < j) {
                        $("#" + j).remove();
                    }
                }

            } else {
                assetAvailability = true;

                $("#" + (globalCount - 1)).find('a').first().html($(param).html());
                if ($(param).attr('children') == "true") {
                    loadSubCategories();
                } else {
                    $(param).toggleClass("selected");
                }
            }
        }
    });

    $("#" + (parseInt($(param).attr("globalid")) - 1)).find('a').each(function () {

        if ($(this).hasClass("selected")) {
            $(this).removeClass("selected");
        }
    });

};

var loadSubCategories = function () {
    // bellow code block will generate sub categories for only
    if (assetAvailability) {
        var nodes = getURL().split("/");

        var path = nodes[0];

        for (var i = 1; i < nodes.length; i++) {
            path += "/" + nodes[i];
            var elementRef = document.getElementById(path);
            // check wheather its leafnode or not
            if ($(elementRef).attr("children") == "true") {
                var taxaSub = [];
                $.ajax({
                    url: caramel.context + '/apis/taxonomies?terms=' + path + "/children" + resolveDomain(),
                    type: 'GET',
                    async: false,
                    headers: {
                        Accept: "application/json"
                    },
                    success: function (data) {
                        var children;
                        try {
                            children = Array.isArray(data[0].children);
                        } catch (e) {

                        }

                        if (children) {
                            data[0].id = data[0].elementName;
                            for (var i = 0; i < data[0].children.length; i++) {
                                data[0].children[i].id = data[0].elementName + "/" + data[0].children[i].elementName;
                            }
                        } else {
                            for (var i = 0; i < (data.length); i++) {
                                data[i].id = $(elementRef).attr("id") + "/" + data[i].elementName;
                                if (data[i].text == "") {
                                    data[i].text = data[i].elementName;
                                }
                            }
                        }
                        taxaSub = data;

                        //since we have "/" in variable name, jquery selector cant select that element
                        var currentElement = document.getElementById(path);
                        createHTMLFromJsonSub(taxaSub, $(currentElement));

                    },
                    error: function () {

                    }
                });
            } else {
                var currentElement = document.getElementById(path);
                createHTMLFromJsonSub([], $(currentElement));
                var pp = document.getElementById(path);

                $("#" + $(pp).attr('globalId') + " a.dropdown").toggleClass('hide-after');

            }
        }

    }
};


var globalCount = 0;
var currentElement = 0;
var createHTMLFromJsonSub = function (jsonInput, atag) {

    $("#" + (globalCount - 1)).find('a').first().html(atag.html());

    for (var j=0;j<globalCount;j++) {
        if (parseInt($(atag).attr('globalid')) -1 < j) {
            $("#" + j).remove();
        }
    }

    atag.toggleClass("selected");

    if (jsonInput.length > 0) {

        var mainList = document.createElement('li');
        mainList.setAttribute('id', globalCount);
        mainList.setAttribute('class', 'taxa-menus');
        globalCount += 1;

        var mainTagA = document.createElement('a');
        var mainSubList = document.createElement('ul');
        mainTagA.innerHTML = "Select Sub Menu";
        //mainTagA.innerHTML = atag.html();

        // we are sending empty array with jsonInput parameter when leaf node occur

        mainTagA.setAttribute('class', "dropdown");
        //mainTagA.setAttribute('href', " ");

        for (var i = 0; i < jsonInput.length; i++) {
            var myinnerLI = document.createElement('li');
            var myInner = document.createElement('a');

            myInner.setAttribute('children', jsonInput[i].children);
            myInner.setAttribute('onclick', "checkAndSendQuery(this);");
            myInner.setAttribute('id', jsonInput[i].id);
            myInner.setAttribute('globalId', globalCount);
            myInner.setAttribute('title', jsonInput[i].id);
            myInner.innerHTML = (jsonInput[i].text == "" ? jsonInput[i].elementName : jsonInput[i].text);
            myinnerLI.appendChild(myInner);
            mainSubList.appendChild(myinnerLI);
        }


        mainList.appendChild(mainTagA);
        mainList.appendChild(mainSubList);

        $('#dropdown-taxonomy').append(mainList.outerHTML);

    } else {
        mainTagA.innerHTML = atag.html();

    }

};

//create first tree branches and call dynamically to checkAndSendQuery
var createHTMLFromJsonFirst = function (jsonInput) {

    var mainList = document.createElement('li');
    mainList.setAttribute('id', globalCount);
    mainList.setAttribute('class', 'taxa-menus');
    globalCount += 1;

    var mainTagA = document.createElement('a');
    var mainSubList = document.createElement('ul');
    mainTagA.innerHTML = "Select Taxonomy";
    mainTagA.setAttribute('class', "dropdown");
    // mainTagA.setAttribute('href', " ");

    for (var i = 0; i < jsonInput[0].children.length; i++) {
        var myinnerLI = document.createElement('li');
        var innerElement = document.createElement('a');

        innerElement.setAttribute('children', jsonInput[0].children[i].children);
        innerElement.setAttribute('onclick', "checkAndSendQuery(this);");
        innerElement.setAttribute('id', jsonInput[0].children[i].id);
        innerElement.setAttribute('globalId', globalCount);
        innerElement.setAttribute('title',  jsonInput[0].children[i].id);
        // myInner.innerHTML = jsonInput[0].children[i].text;
        innerElement.innerHTML = (jsonInput[0].children[i].text == "" ? jsonInput[0].children[i].
            elementName : jsonInput[0].children[i].text);
        myinnerLI.appendChild(innerElement);
        mainSubList.appendChild(myinnerLI);
    }


    mainList.appendChild(mainTagA);
    mainList.appendChild(mainSubList);
    $('#dropdown-taxonomy').append(mainList.outerHTML);
};


String.prototype.replaceAll = function (find, replace) {
    var str = this;
    return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};


function resolveDomain() {
    var tenantDomain;
    var domain = '';
    if ((store) && (store.store)) {
        tenantDomain = store.store.tenantDomain;
    }
    //Construct the tenant query parameter if a tenant domain was resolved
    if (tenantDomain) {
        domain = '&tenant=' + tenantDomain;
    }

    return domain;
}

$(window).load(function () {
    if (store.taxonomyAvailability) {
// this condition will check current page is asset list page or top asset page.
        if (window.location.href.toString().indexOf('list') > 0 || window.location.href.toString().
                indexOf('top-assets') > 0) {

            // first ajax call when page loads
            $.ajax({
                url: caramel.context + '/apis/taxonomies?' + resolveDomain(),
                type: 'GET',
                async: false,
                headers: {
                    Accept: "application/json"
                },
                success: function (data) {
                    // success function will modify the REST api return data into jstree format.
                    var children;
                    try {
                        children = Array.isArray(data[0].children);
                    } catch (e) {

                    }

                    if (children) {
                        data[0].id = data[0].elementName;
                        for (var i = 0; i < data[0].children.length; i++) {
                            data[0].children[i].id = data[0].elementName + "/" + data[0].children[i].elementName;
                        }
                    } else {

                        for (var i = 0; i < (data.length); i++) {
                            //not executng first run
                            data[i].id = data[0].elementName + "/" + data[i].elementName;
                        }
                    }
                    // call to the first tab creation in landing top asset page
                    createHTMLFromJsonFirst(data);


                },
                error: function () {
                }
            });

            // bellow code block will generate sub categories for only
            if (assetAvailability) {
                var nodes = getURL().split("/");

                var path = nodes[0];

                for (var i = 1; i < nodes.length; i++) {
                    path += "/" + nodes[i];
                    var elementRef = document.getElementById(path);
                    // check wheather its leafnode or not
                    if ($(elementRef).attr("children") == "true") {
                        var taxaSub = [];
                        $.ajax({
                            url: caramel.context + '/apis/taxonomies?terms=' + path + "/children" + resolveDomain(),
                            type: 'GET',
                            async: false,
                            headers: {
                                Accept: "application/json"
                            },
                            success: function (data) {
                                var children;
                                try {
                                    children = Array.isArray(data[0].children);
                                } catch (e) {

                                }

                                if (children) {
                                    data[0].id = data[0].elementName;
                                    for (var i = 0; i < data[0].children.length; i++) {
                                        data[0].children[i].id = data[0].elementName + "/" + data[0].children[i].elementName;
                                    }
                                } else {
                                    for (var i = 0; i < (data.length); i++) {
                                        data[i].id = $(elementRef).attr("id") + "/" + data[i].elementName;
                                        if (data[i].text == "") {
                                            data[i].text = data[i].elementName;
                                        }
                                    }
                                }
                                taxaSub = data;

                                //since we have "/" in variable name, jquery selector cant select that element
                                var currentElement = document.getElementById(path);
                                createHTMLFromJsonSub(taxaSub, $(currentElement));

                            },
                            error: function () {

                            }
                        });
                    } else {
                        var currentElement = document.getElementById(path);
                        createHTMLFromJsonSub([], $(currentElement));
                        var pp = document.getElementById(path);

                        $("#" + $(pp).attr('globalId') + " a.dropdown").toggleClass('hide-after');

                    }
                }
            }

        } else {
            // alywas 0 will be first element.
            // TODO generate unique ids from a suitable alogrithm
            $("#0").remove();
        }
    }

    initCategorySelection();
    if (document.getElementById("categoryDropDown") != null) {
        document.getElementById("categoryDropDown").title = document.getElementById("categoryDropDown").text.trim()
    }
});

$( document ).ready(function() {
    //This code was added to check weather the search query contains of the search query cookie and if it contains
    //set the search field to the value of cookie
    if($('#search').val() !== '' && $('#search').val().indexOf($.cookie("searchQuery")) > -1){
        $('#search').val($.cookie("searchQuery"));
    } else {
        $('#search').val('');
    }

    if (store.assetCount > 0) {
        assetAvailability = true;
    } else {
        assetAvailability = false;
    }

});
