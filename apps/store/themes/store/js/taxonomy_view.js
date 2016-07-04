/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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


var glbTaxoInstance = null;
var BTN_REMOVE_PREFIX = "btnremove";
var DIV_HIDDEN_PREFIX = "hiddendiv";
var SEARCH_AND_QUERY = " AND ";
var assetAvailability = false;


var otherTypeQueryArray = [];
/**
 * this method will check for current url and it will return list of queries by spliting the query ","
 * @returns {Array}
 */
var getSeparatedQueries = function () {

    var decodedURL = decodeURIComponent(window.location.href);
    var queryList = [];
    if (decodedURL.indexOf("q=") > 0) {
        var combinedQueryList = otherTypeQueryArray = decodedURL.split('q=');
        if (combinedQueryList[1].indexOf(",") > 0) {
            var separateQueryList = combinedQueryList[1].split(",");
            for (var count = 0; count < separateQueryList.length; count++) {
                queryList.push(separateQueryList[count]);
            }
        } else {
            queryList.push(combinedQueryList[1]);
        }
    }
    return queryList;
};

var taxonomyQueryPosition = -1;
var allQueries = [];

/**
 * This method will return only taxonomy query from list of queries
 * @returns {String}
 */
var getTaxonomyQuery = function () {

    var queries = allQueries = getSeparatedQueries();

    if (queries.length > 0) {
        for (var i = 0; i < queries.length; i++) {
            if (queries[i].indexOf("taxonomy") > 0) {
                // there can be only one taxonomy: content inside one query
                taxonomyQueryPosition = i;
                return queries[i];
            }
        }
    }
    return null;
};

/**
 * This method will remove double quotations and taxonomy prefix of the taxonomy query, then return the rest .
 * @returns {Array}
 */
var resolveTaxonomyURL = function () {
    var taxonomyQuery = getTaxonomyQuery();
    var taxonomyQueries = [];

    if (taxonomyQuery) {
        var multipleQueries = taxonomyQuery.split(":");
        multipleQueries[1] = multipleQueries[1].replace(/^\"/, '').replace(/\"/, '').replace(/^\(/, '').replace(/\)/, '');
        if (multipleQueries[1].indexOf(SEARCH_AND_QUERY) > 0) {
            var multipleTaxonomyQueries = multipleQueries[1].split(SEARCH_AND_QUERY);
            for (var i = 0; i < multipleTaxonomyQueries.length; i++) {
                taxonomyQueries.push(multipleTaxonomyQueries[i]);
            }
        } else {
            taxonomyQueries.push(multipleQueries[1]);
        }
    }

    return taxonomyQueries;

};

/**
 * This method will modify the url related to
 * @param taxonomyId to search through solr
 * @param operation crud operation name
 * @returns {String} updated query URL
 */
var resolveTaxonomyCRUDOperations = function (taxonomyId, operation) {

    var taxonomyQueryResult = resolveTaxonomyURL();
    var returnUrl = "";
    if (taxonomyId) {
        switch (operation) {
            case 'add':
                returnUrl = addTaxonomyQuery(taxonomyId, taxonomyQueryResult);

                break;
            case 'remove':
                returnUrl = removeTaxonomyQuery(taxonomyId, taxonomyQueryResult);
                if (returnUrl) {
                    returnUrl = '"taxonomy":' + returnUrl;
                }
                allQueries[taxonomyQueryPosition] = returnUrl;
                var newArray = allQueries.filter(function (v) {
                    return v !== ''
                });
                allQueries = newArray;
                var retString = allQueries.join(",");
                taxonomyQueryPosition = -1;
                return encodeURIComponent(retString);
                break;
            case 'update':
                returnUrl = updateTaxonomyQuery(taxonomyId, taxonomyQueryResult);
                break;
            default:
                break;
        }

    } else {
        return "";
    }

    // used these global variable to avoid getTaxonomyQuery() method call twice
    if (returnUrl) {
        returnUrl = '"taxonomy":' + returnUrl;
        if (taxonomyQueryPosition >= 0) {
            allQueries[taxonomyQueryPosition] = returnUrl;
        } else {
            allQueries.push(returnUrl);
        }
        var originalString = allQueries.join(",");
        taxonomyQueryPosition = -1;
        return encodeURIComponent(originalString);
    } else {
        return returnUrl;
    }

};
/**
 * This method will add new query parameter to current url
 * @param taxonomyId
 * @param taxonomyQueryResult
 * @returns String updated query
 */
var addTaxonomyQuery = function (taxonomyId, taxonomyQueryResult) {

    var mainUrl = "";
    if (taxonomyQueryResult.length >= 1) {
        for (var i = 0; i < taxonomyQueryResult.length; i++) {
            if (i == 0) {
                mainUrl += "*" + taxonomyQueryResult[i] + "*" + SEARCH_AND_QUERY;
            } else {
                mainUrl += taxonomyQueryResult[i] + SEARCH_AND_QUERY;
            }
        }
        mainUrl += "*" + taxonomyId + "*";
        mainUrl = '"(' + mainUrl + ')"';
    } else {
        mainUrl = '"' + taxonomyId + '"';
    }

    return mainUrl;
};

/**
 * this method will remove taxonomy query parameter from current url
 * @param taxonomyId
 * @param taxonomyQueryResult
 * @returns String updated query
 */
var removeTaxonomyQuery = function (taxonomyId, taxonomyQueryResult) {

    var mainUrl = "";
    if (taxonomyQueryResult.length == 1) {
        if (taxonomyQueryResult[0] == (taxonomyId)) {
            mainUrl = "";
        }
    } else if (taxonomyQueryResult.length > 1) {
        for (var i = 0; i < taxonomyQueryResult.length; i++) {
            if (taxonomyQueryResult[i] != ("*" + taxonomyId + "*")) {
                mainUrl += taxonomyQueryResult[i] + SEARCH_AND_QUERY;
            }
        }

        if (mainUrl.substr(mainUrl.length - SEARCH_AND_QUERY.length, mainUrl.length).indexOf(SEARCH_AND_QUERY) == 0) {
            mainUrl = mainUrl.substr(0, mainUrl.length - SEARCH_AND_QUERY.length);
            // there may be multiple AND
            if (mainUrl.indexOf(SEARCH_AND_QUERY) < 0) {
                mainUrl = mainUrl.replace(/^\*/, '').replace(/\*/, '');
                mainUrl = '"' + mainUrl + '"';
            } else {
                mainUrl = '"(' + mainUrl + ')"';
            }
        } else {
            mainUrl = '"(' + mainUrl + ')"';
        }

    } else {
        mainUrl = "";
    }
    return mainUrl;
};

/**
 * This method will updated the current taxonomy query with new query
 * @param taxonomyId
 * @param taxonomyQueryResult
 * @returns String updated query
 */
var updateTaxonomyQuery = function (taxonomyId, taxonomyQueryResult) {

    var mainUrl = "";

    if (taxonomyQueryResult.length == 1) {
        if (taxonomyQueryResult[0] == taxonomyId.oldQuery) {
            mainUrl = '"' + taxonomyId.newQuery + '"';
        }
    } else if (taxonomyQueryResult.length > 1) {
        for (var i = 0; i < taxonomyQueryResult.length; i++) {

            if (taxonomyQueryResult[i] == "*" + taxonomyId.oldQuery + "*") {
                taxonomyQueryResult[i] = '*' + taxonomyId.newQuery + '*';
            }

            if (i == taxonomyQueryResult.length - 1) {
                mainUrl += taxonomyQueryResult[i];
            } else {
                mainUrl += taxonomyQueryResult[i] + SEARCH_AND_QUERY;
            }
        }
        mainUrl = '"(' + mainUrl + ')"';
    } else {
        mainUrl = '"' + taxonomyId + '"';
    }
    return mainUrl;
};

/**
 * This method will manage add,remove,update functionality for taxonomy
 * @param taxonomyId
 * @param action
 */
var resolveTaxonomyCRUDQueries = function (taxonomyId, action) {
    var url = decodeURIComponent(window.location.href);
    var query = '"taxonomy":' + '"' + taxonomyId + '"';
    var parameters = url.split('?q=');

    switch (action) {
        case "add":
            if (url.indexOf("q=") > 0) {
                selectURL(parameters[0] + "?q=" + resolveTaxonomyCRUDOperations(taxonomyId, "add"));
            } else {
                selectURL(url + "?q=" + encodeURIComponent(query));
            }
            break;
        case "remove":
            if (url.indexOf("q=") > 0) {
                var obj = resolveTaxonomyCRUDOperations(taxonomyId, "remove");
                selectURL(parameters[0] + (obj == "" ? "" : "?q=") + obj);
            } else {
                selectURL(url + "?q=" + resolveTaxonomyCRUDOperations(taxonomyId, "remove"));
            }
            break;
        case "update":
            if (url.indexOf("q=") > 0) {
                selectURL(parameters[0] + "?q=" + resolveTaxonomyCRUDOperations(taxonomyId, "update"));
            }
            break;
        default:
            break;
    }
};

/**
 * This method will choose , asset loading is for list assets or top assets.
 * @param url
 */
var selectURL = function (url) {

    if (window.location.href.toString().indexOf("top-assets") > 0) {
        caramel.serverRender({
            body : 'top_assets'
        }, {
            url: url,
            error : function (data) {
                console.log(data);
            },
            success : function (data) {
                $("#assets-container").html('').append(data);
                $('.loading-animation-big').remove();
                history.pushState("", "", url);
            }
        });
    } else {
        loadAssetsToPage(url);
        categorization();
    }
};

/**
 * Initiate infinite loading
 */
var resetPageAttributes = function () {
    store.rows_added = 0;
    store.last_to = 0;
    store.items_per_row = 0;
    store.doPagination = true;
    store.firstRun = false;
    store.infiniteScroll.recalculateRowsAdded();
};

/**
 * This method will load the assets into the current page for a given url
 * @param url
 */
var loadAssetsToPage = function (url) {
    $('.assets-container section .ctrl-wr-asset').remove();
    history.pushState("", "", url);
    resetPageAttributes();
    store.infiniteScroll.addItemsToPage(function (data, status, err) {
        if (err) {
            assetAvailability = false;
        } else {
            if (data.body.assets.context.assets.length == 0) {
                assetAvailability = false;
            } else {
                assetAvailability = true;

            }
        }
    });

};

/**
 * This method will replace given text in a given string
 * @param find
 * @param replace
 * @returns {string}
 */
String.prototype.replaceAll = function (find, replace) {
    var str = this;
    return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
};

/**
 * This method will get the tenant domain
 * @returns string tenant domain
 */
function resolveDomain() {
    var tenantDomain;
    var domain = '';
    if ((store) && (store.store)) {
        tenantDomain = store.store.tenantDomain;
    }
    if (tenantDomain) {
        domain = 'tenant=' + tenantDomain;
    }

    return domain;
}

/**
 * This method will format the first ajax success's data, and  generate html. then append into the page
 * @param child
 */
var formatTaxonomyToList = function (child) {
    var liTag = $('<li/>').attr({children: true, class: 'has-sub'});

    var anchorT = $('<a/>').attr({
        onclick: 'onClickMenuGenerate(this);return false;',
        id: 'taxo' + child, // (this id will change for next element dynamically when recursive calling)
        'data-taxonomyId': 'taxo' + child, //fixed for all. this is for different purpose (for hide specific taxonomy)
        children: true,
        elementName: child,
        taxonomy: child,
        firstLevel: true,
        href: '#' + child,
        elementText: child
    });

    anchorT.append(child);
    liTag.append(anchorT);
    $('.taxonomy #accordion1').append(liTag);

};

/**
 * this method will invoke the data formatting function for each separate json child element  in ajax success result
 * @param data
 */
var formatTaxonomyData = function (data) {
    for (var i = 0; i < data.length; i++) {
        formatTaxonomyToList(data[i].name);
    }
};

var globalClickedElement, breadcrumbTaxonomy = "", breadcrumbIdsTaxonomy = "";

/**
 * This method will invoke when press the taxonomy add button.
 * It will generate selected element path and required html format
 * @param element
 */
var displayPaths = function (element) {
    glbTaxoInstance = $(element).parents('.has-sub').last();
    var parentElements = $(globalClickedElement).parents();
    var pathArray = [];
    var pathIdArray = [];
    var taxonomyName = $('> a', glbTaxoInstance).attr('elementtext');
    resolveTaxonomyCRUDQueries($(globalClickedElement).attr('id').replaceAll('-', '/'), "add");

    for (var i = 0; i < parentElements.length; i++) {
        if (parentElements[i].nodeName == "LI") {
            pathArray.push($(parentElements[i]).find('a').attr('elementtext'));
            pathIdArray.push($(parentElements[i]).find('a').attr('id'));
        }
    }

    pathArray = pathArray.reverse();
    for (var j = 0; j < pathArray.length; j++) {
        (j == pathArray.length - 1) ? breadcrumbTaxonomy += pathArray[j] : breadcrumbTaxonomy += pathArray[j] + '-';
    }
    for (var k = 0; k < pathIdArray.length; k++) {
        (k == pathIdArray.length - 1) ? breadcrumbIdsTaxonomy += pathIdArray[k] : breadcrumbIdsTaxonomy +=
            pathIdArray[k] + '#';
    }

    setSelectedPath(pathArray[pathArray.length - 1], breadcrumbTaxonomy, breadcrumbIdsTaxonomy, DIV_HIDDEN_PREFIX +
        $(element).closest('a').attr('data-taxonomyId'), element,taxonomyName);

    breadcrumbTaxonomy = "";
    breadcrumbIdsTaxonomy = "";

    $(element).parents('.has-sub').last().find('li').each(function () {
        if ($(this).attr('aria-expanded') == "true") {
            $(this).attr('aria-expanded', 'false');
        }
        if ($(this).hasClass("active")) {
            $(this).removeClass("active");
        }
    });

    if ($(element).parents('.has-sub').last().attr('aria-expanded') == "true") {
        $(element).parents('.has-sub').last().attr('aria-expanded', 'false');
    }


    $(element).parents('.has-sub').last().addClass("disabled");
    $(element).parents('.has-sub').last().find('a').attr('onclick', 'onclickNothing();return false;');
    $(element).parents('.has-sub').last().removeClass("has-sub");
};

/**
 * This method will invoke when clicking the close button in edit menu
 * @param element
 */
var onClickHideBock = function (element) {
    $(element).closest('.filter-tag').find('.value-edit').remove();
    $(element).closest('.filter-tag').removeClass("edit");
};


/**
 * This method will remove selected element from the taxonomy view
 * and modify the search query
 * @param element
 */
var removeClickedElement = function (element) {
    resolveTaxonomyCRUDQueries($(element).closest('.filter-tag').attr('id').split("#")[0].replaceAll('-', '/'), "remove");

    $(element).closest('.filter-tag').parent().addClass("has-sub");
    $(element).closest('.filter-tag').parent().removeClass("disabled");
    $(element).closest('.filter-tag').parent().find('a').attr('onclick', 'onClickMenuGenerate(this);return false;');


    removeDeleteButtonsMainTaxonomy(element);
    $(element).closest('.filter-tag').remove();
};

/**
 * This method will remove top selected filter-tags bar when removing one element from current list
 * @param element
 */
//TODO: Remove this since its for old implementation
var removeDeleteButtonsMainTaxonomy = function (element) {
    //TODO : move selectors into one bracket
    $(".taxonomy").find(".nav-stacked").find('.btn-remove').each(function (index, instance) {
        if ($(instance).attr('id') == (BTN_REMOVE_PREFIX + $(element).closest('.filter-tag').attr('id'))) {
            //since element id contains # mark
            var object = $("[id*=" + BTN_REMOVE_PREFIX + $(element).closest('.filter-tag').attr('id') + "]");
            $(object).parent('a').attr('onclick', 'onClickMenuGenerate(this);return false;');
            $(object).remove();
        }
    });
};

/**
 * This method will display the edit view of current selected taxonomy
 * @param element
 */
var editClickedElement = function (element) {
    var spanValEdit = $('<span/>').attr({class: 'value value-edit'});
    $(element).closest('.filter-tag').append(spanValEdit);
    // var clonedTaxonomy = $(glbTaxoInstance).clone();
    var clonedTaxonomy = $($(element).closest('.disabled').find("#" + $(element).closest('.filter-tag').attr('idpath').split("-")[0])[0]).clone();


    $(clonedTaxonomy).attr('id', 'clonedTaxonomy' + $(element).closest('.filter-tag').attr('id'));

    $(clonedTaxonomy).find(".filter-tag").remove();
    $(clonedTaxonomy).find('li').each(function () {
        if ($(this).attr('aria-expanded') == "true") {
            $(this).attr('aria-expanded', 'false');
        }
        if ($(this).hasClass("active")) {
            $(this).removeClass("active");
        }
    });
    //TODO : after removing element, why there is more operations on same element ??
    $(clonedTaxonomy).find('.hide-element').remove();
    $(clonedTaxonomy).find('.hide-element').parent().find('ul').first().attr('style', '');
    $(clonedTaxonomy).find('.btn-add').attr('title', 'Update Filter');
    $(clonedTaxonomy).find('.btn-add').attr('onclick', 'updateTaxonomy(this);return false;');
    $(clonedTaxonomy).find('.fw-add').removeClass('fw-add').addClass('fw-refresh');
    $(clonedTaxonomy).find('.btn-add').removeClass('btn-add').addClass('btn-update');
    $(clonedTaxonomy).find('.btn-add').removeClass('btn-add').addClass('btn-update');


    $(clonedTaxonomy).addClass("has-sub");
    $(clonedTaxonomy).removeClass("disabled");
    $(clonedTaxonomy).find('a').attr('onclick', 'onClickMenuGenerate(this);return false;');

    var idArray = $(element).closest('.filter-tag').attr('id').split('#');

    var pathElement;
    for (var i = idArray.length - 1; i >= 0; i--) {
        pathElement = $(clonedTaxonomy).find("#" + idArray[i]).parent();
        if (i == 0) {
            $(pathElement).addClass('active');
        } else {
            if ($(pathElement).attr('aria-expanded') == "false") {
                if ($(pathElement).hasClass("has-sub")) {
                    $(pathElement).attr('aria-expanded', 'true');
                }
            }
        }
    }

    $(spanValEdit).html(clonedTaxonomy);
    $(element).closest('.filter-tag').append(spanValEdit);
    $(element).closest('.filter-tag').addClass("edit");
    $(element).closest('.filter-tag').removeClass("expand");

    $('[data-toggle="tooltip"]').tooltip();
};

/**
 * This method will invoke when clicking on update button
 * This will invoke query update method
 * @param element
 */
var updateTaxonomy = function (element) {

    var updateData = {
        "oldQuery": $(element).closest('.filter-tag').attr('id').split("#")[0].replaceAll('-', '/'),
        "newQuery": $(element).closest('a').attr('id').replaceAll('-', '/')
    };
    resolveTaxonomyCRUDQueries(updateData, "update");

    var parentElements = $(globalClickedElement).parents();
    var pathArray = [];
    var pathIdArray = [];

    for (var i = 0; i < parentElements.length; i++) {
        if (parentElements[i].nodeName == "LI") {
            pathArray.push($(parentElements[i]).find('a').attr('elementtext'));
            pathIdArray.push($(parentElements[i]).find('a').attr('id'));
        }
    }

    pathArray = pathArray.reverse();
    for (var j = 0; j < pathArray.length; j++) {
        (j == pathArray.length - 1) ? breadcrumbTaxonomy += pathArray[j] : breadcrumbTaxonomy += pathArray[j] + '-';
    }
    for (var k = 0; k < pathIdArray.length; k++) {
        (k == pathIdArray.length - 1) ? breadcrumbIdsTaxonomy += pathIdArray[k] : breadcrumbIdsTaxonomy +=
            pathIdArray[k] + '#';
    }


    var tempEle = generateExpandedElements(breadcrumbTaxonomy);

    $(element).closest('.filter-tag').attr('id', breadcrumbIdsTaxonomy);
    $(element).closest('.filter-tag').attr('idpath', breadcrumbTaxonomy);
    $(element).closest('.filter-tag').find('.value-expand').html(tempEle);
    $(element).closest('.filter-tag').find('.value-full').html(breadcrumbTaxonomy.replaceAll('-', '/'));
    $(element).closest('.filter-tag').find('.value-truncate').html(pathArray[pathArray.length - 1]);

    breadcrumbIdsTaxonomy = "";
    breadcrumbTaxonomy = "";
    // $(element).closest('.filter-tag').removeClass("edit");
};

/**
 * This method will generate html element for selected path
 * @param breadcrumbTaxonomy
 * @returns html element
 */
var generateExpandedElements = function (breadcrumbTaxonomy) {
    var newUl, newLi, tempEle;
    var pathArray = breadcrumbTaxonomy.split('-');
    // creating ul,li markup - already selected
    for (var k = pathArray.length - 1; k >= 0; k--) {
        newLi = $('<li/>').append(pathArray[k]);
        tempEle = newLi.append(tempEle);
        newUl = $('<ul/>').append(tempEle);
        tempEle = newUl;
    }

    return tempEle;
};
/**
 * This method will generate selected html format
 * @param element
 * @param breadcrumbTaxonomy
 * @param breadcrumbIdsTaxonomy
 * @param taxonomyId
 * @param originalElement
 */
var setSelectedPath = function (element, breadcrumbTaxonomy, breadcrumbIdsTaxonomy, taxonomyId, originalElement,taxonomyName) {

    var divFilterTag = $('<div/>').attr({
        id: breadcrumbIdsTaxonomy,
        idPath: breadcrumbTaxonomy,
        'data-taxonomyId': taxonomyId,
        class: 'filter-tag'
    });

    var tempEle = generateExpandedElements(breadcrumbTaxonomy);

    divFilterTag.append('<span class="value value-name">' + taxonomyName + '</span><span class="actions">'
        + '<button type="button" class="btn btn-secondary btn-cancel" onclick="onClickHideBock(this);" data-placement="left" data-toggle="tooltip" title="" data-original-title="Cancel">'
        + '<span class="icon fw fw-stack">'
        + '<i class="fw fw-cancel fw-stack-1x"></i>'
        + '<i class="fw fw-circle-outline fw-stack-2x"></i>'
        + '</span>'
        + '</button><button type="button" class="btn btn-default btn-edit" onclick="editClickedElement(this);" data-placement="left" data-toggle="tooltip" title="" data-original-title="Edit">'
        + '<span class="icon fw fw-stack">'
        + '<i class="fw fw-edit fw-stack-1x"></i>'
        + '<i class="fw fw-circle-outline fw-stack-2x"></i>'
        + '</span>'
        + '</button><button type="button" class="btn btn-danger btn-remove" onclick="removeClickedElement(this);" data-placement="left" data-toggle="tooltip" title="" data-original-title="Remove">'
        + '<span class="icon fw fw-stack">'
        + '<i class="fw fw-minus fw-stack-1x"></i>'
        + '<i class="fw fw-circle-outline fw-stack-2x"></i>'
        + '</span>'
        + '</button>'
        + '</span>'
        + '<span class="value value-truncate" data-placement="top" data-toggle="tooltip" title=' + breadcrumbTaxonomy.replaceAll('-', '/') + ' data-original-title="">' + ".. /" + element + '</span>'
        + '<span class="value value-full">' + breadcrumbTaxonomy.replaceAll('-', '/') + '</span>'
        + '<span class="value value-expand"> <ul>' + $(tempEle).html() + "</ul>"
        + '</span>');

    var taxonomyItem = $(originalElement).parents('.has-sub').last();
    $(taxonomyItem).append(divFilterTag);

};

/**
 * This method will check for current clicked element is in first level of taxonomy hierarchy
 * @param element
 * @returns boolean
 */
var isFirstLevel = function (element) {
    return $(element).attr('firstLevel');
};

var onClickMenuGenerate = function (element) {
    globalClickedElement = element;

    if ($(element).next()[0]) {
        collapseAndExpandElements(element);
        return;
    }
    var that = $(element).parent();
    var url;
    if ($(element).attr('children') || isFirstLevel(element)) {
        if (isFirstLevel(element)) {
            /*url = caramel.context + '/apis/taxonomies?name=' + $(element).attr('taxonomy') +
             '&artifactType=' + assetType + resolveDomain();*/
            url = caramel.context + '/apis/taxonomies/' + $(element).attr('taxonomy') + '?' + resolveDomain();

        } else {
            /*  url = caramel.context + '/apis/taxonomies?name=' + $(element).attr('taxonomy') +
             '&artifactType=' + assetType + '&terms=' + $(element).attr('id').replaceAll('-', '/') + "/children" + resolveDomain();*/
            url = caramel.context + '/apis/taxonomies/' + $(element).attr('taxonomy') + '/' +
                $(element).attr('id').replaceAll('-', '/')  + '?children=true' + '&' +  resolveDomain();
        }

        $.ajax({
            url: url,
            type: 'GET',
            async: false,
            headers: {
                Accept: "application/json"
            },
            success: function (data) {
                if (isFirstLevel(element)) {
                    if (data[0].children) {
                        data = data[0].children;
                    }

                    recursiveTaxonomyLoad(element, data);
                } else {
                    recursiveTaxonomyLoad($(that).find('a'), data);
                }
            },
            error: function () {

            }
        });
    }
    collapseAndExpandElements(element);
};

/**
 * This method will toggle the area expand functionality
 * @param element
 */
var collapseAndExpandElements = function (element) {

    if ($($(element).closest('li').first()).hasClass("has-sub")) {
        if ($($(element).closest('li').first()).attr('aria-expanded') == "true") {
            $($(element).closest('li').first()).attr('aria-expanded', 'false');
        } else {
            $($(element).closest('li').first()).attr('aria-expanded', 'true');
        }
    }
};

/**
 * This method will recursively called for json result and generate element list
 * @param child
 * @param data
 */
var recursiveTaxonomyLoad = function (child, data) {
    var ulTag = $('<ul/>').attr({id: $(child).attr('elementName')});
    var liTag = $('<li/>');

    for (var i = 0; i < data.length; i++) {

        liTag = $('<li/>');
        var innerAnchorTag = $('<a/>');

        if (data[i].children) {
            innerAnchorTag.attr({
                children: true, taxonomy: $(child).attr('taxonomy'), elementName: data[i].id,
                elementText: data[i].label, onclick: 'onClickMenuGenerate(this);return false;',
                href: '#' + data[i].id,
                id: data[i].currentElement.replaceAll('/', '-').replaceAll(' ', ''),
                'data-taxonomyId': $(child).attr('data-taxonomyId')
            });


            liTag.addClass("has-sub");

        } else {
            innerAnchorTag.attr({
                elementName: data[i].id,
                taxonomy: $(child).attr('taxonomy'),
                elementText: data[i].label,
                id: data[i].currentElement.replaceAll('/', '-').replaceAll(' ', ''),
                'data-taxonomyId': $(child).attr('data-taxonomyId'),
                onclick: 'onClickMenuGenerate(this);return false;',
                href: '#'
            });
        }

        var addButton = $('<button/>').attr({
            type: 'button',
            class: 'btn btn-primary btn-add',
            'data-toggle': 'tooltip',
            title: 'Add Filter',
            onclick: 'displayPaths(this);return false;'
        });


        var buttonSpan = $('<span/>').attr({class: 'icon fw fw-stack'});
        var ispan1x = $('<i/>').attr({class: 'fw fw-add fw-stack-1x'});
        var ispan2x = $('<i/>').attr({class: 'fw fw-circle-outline fw-stack-2x'});
        buttonSpan.append(ispan1x);
        buttonSpan.append(ispan2x);

        addButton.append(buttonSpan);

        innerAnchorTag.append(addButton);
        innerAnchorTag.append(data[i].label);
        liTag.append(innerAnchorTag);


        ulTag.append(liTag);
        $(child).parent().append(ulTag);

    }

};

var assetType = 'all';
var affixOffset = 50,
    nanoScrollerSelector = $('.nano'),
    taxonomySection = $('#taxonomy-section'),
    taxonomyExpandView = $('#taxonomy-expand-view');

$(document).ready(function () {
    //TODO : remove this
    if (window.location.href.indexOf("list") < 0 && window.location.href.indexOf("top-assets") < 0) {
        $("#taxonomy-section").hide();
    }

    if (store.taxonomyAvailability) {
        {
            (store.asset) ? assetType = store.asset.type : assetType = 'all';
            // first load of basic taxonomies
            $.ajax({
                url: caramel.context + '/apis/taxonomies?assetType=' + assetType + '&' + resolveDomain(),
                type: 'GET',
                async: false,
                headers: {
                    Accept: "application/json"
                },
                success: function (data) {
                    if (!data[0].name) {
                        $("#taxonomy-section").hide();
                    }
                    formatTaxonomyData(data);
                },
                error: function () {

                }
            });

            $("[data-toggle=popover]").popover();
            if ($(document).height() - $(window).height() > affixOffset) {
                $(document).scroll(function () {
                    if ($(document).scrollTop() >= ( affixOffset + 20)) {
                        $('#navigation-container').addClass("affix");
                    } else {
                        $('#navigation-container').removeClass("affix");
                    }
                });
            }

            glbTaxoInstance = $(".taxonomy #accordion1").clone();
        }
    }

    if (store.assetCount > 0) {
        assetAvailability = true;
    } else {
        assetAvailability = false;
    }

});


$(window).load(function () {
    $('[data-toggle="tooltip"]').tooltip();
    nanoScrollerSelector.nanoScroller({alwaysVisible: true});
});
$('body').on('click', '#maximize-taxonomy', function () {
    var taxonomy = $('> .taxonomy', taxonomySection).contents();
    $('.taxonomy', taxonomyExpandView).html(taxonomy);
    taxonomySection.hide();
    taxonomyExpandView.show();
    nanoScrollerSelector.nanoScroller();
    $(window).resize();
});

$('body').on('click', '#contract-taxonomy', function () {
    var taxonomy = $('.taxonomy', taxonomyExpandView).contents();
    $('> .taxonomy', taxonomySection).html(taxonomy);
    taxonomyExpandView.hide();
    taxonomySection.show();
    nanoScrollerSelector.nanoScroller();
});


$('body').on('click', '.taxonomy ul.nav li a', function () {
    $(this).closest('.taxonomy').find('li.active').removeClass('active');
    $(this).closest('li').addClass('active');
});


$('body').on('click', '.taxonomy .filter-tag .value', function (e) {
    if (!$(this).closest('.filter-tag').hasClass('edit')) {
        $(this).closest('.filter-tag').toggleClass('expand');
    }
});

$('.taxonomy ul.nav li a').each(function () {
    if ($(this).closest('li').hasClass('active')) {
        $(this).append('<button type="button" class="btn btn-danger btn-remove" data-placement="top" data-toggle="tooltip" title="Remove Filter">' +
            '<span class="icon fw fw-stack">' +
            '<i class="fw fw-minus fw-stack-1x"></i>' +
            '<i class="fw fw-circle-outline fw-stack-2x"></i>' +
            '</span>' +
            '</button>');
    }
    else {
        $(this).append('<button type="button" class="btn btn-primary btn-add" data-placement="top" data-toggle="tooltip" title="Add Filter">' +
            '<span class="icon fw fw-stack">' +
            '<i class="fw fw-add fw-stack-1x"></i>' +
            '<i class="fw fw-circle-outline fw-stack-2x"></i>' +
            '</span>' +
            '</button>');
    }
});