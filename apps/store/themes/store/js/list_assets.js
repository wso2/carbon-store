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
        searchQueryString += JSON.stringify(q);
        searchQueryString = searchQueryString.replace('{', '').replace('}', '');
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
    //Use case #1 : The user has only entered a name
    if ((!isTokenizedTerm(input)) && (!isEmpty(input))) {
        q.name = encodeURIComponent(input);
        return q;
    }
    input = input.trim();
    input = replaceAll(input,"(\\s)*:(\\s)*", ":");
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

$(window).load(function () {
    initCategorySelection();
});
