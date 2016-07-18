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
var assetAvailability = false;
var generateFromURL = false;

var otherTypeQueryArray = [];
/**
 * this method will check for current url and it will return list of queries by spliting the query ","
 * @returns {Array}
 */
var getSeparatedQueries = function () {
    var decodedURL = decodeURIComponent(window.location.href);
    var queryList = [];
    if (decodedURL.indexOf("?") > 0) {
        // this added because when categorization removed it remain ?q= in the search query
        if (decodedURL.split("?")[1]) {
            var combinedQueryList = otherTypeQueryArray = decodedURL.split('?');
            if (combinedQueryList[1].indexOf("q=") == 0) {
                combinedQueryList[1] = otherTypeQueryArray[1] = combinedQueryList[1].replaceAll("q=", "");
            }

            if (combinedQueryList[1].indexOf(",") > 0) {
                var separateQueryList = combinedQueryList[1].split(",");
                for (var count = 0; count < separateQueryList.length; count++) {
                    queryList.push(separateQueryList[count]);
                }
            } else {
                queryList.push(combinedQueryList[1]);
            }
        }
    }
    return queryList;
};


/**
 * This method will return only taxonomy query from list of queries
 * @returns {String}
 */
var taxonomyQueryPosition = -1;
var allQueries = [];
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
 * This method will manage add,remove,update functionality for taxonomy
 * @param taxonomyId
 * @param action
 */
var resolveTaxonomyCRUDQueries = function (taxonomyId, action) {
    var url = decodeURIComponent(window.location.href);
    var expression = new TaxonomySyntaxAPI.Expression();
    var mainUrl = URL.buildURL(url);
    var currentUrl;

    switch (action) {
        case "add":
            if (url.indexOf("taxonomy") > -1) {
                currentUrl = mainUrl.queryParam('q').get('"taxonomy"').replace(/^\"/, '').replace(/\"/, '');
                expression = TaxonomySyntaxAPI.buildExpression(currentUrl);
                expression.add("*" + taxonomyId + "*");
                mainUrl.queryParam('q').set('"taxonomy"', '"' + expression.compile() + '"');
            } else {

                if (url.indexOf("q=") > -1) {
                    mainUrl.queryParam('q').set('"taxonomy"', '"' + "*" + taxonomyId + "*" + '"');
                } else {
                    mainUrl.queryParam('q', '"taxonomy":"' + "*" + taxonomyId + "*" + '"');
                }
            }
            renderURL(mainUrl.compile());
            break;
        case "remove":
            if (url.indexOf("taxonomy") > -1) {
                currentUrl = mainUrl.queryParam('q').get('"taxonomy"').replace(/^\"/, '').replace(/\"/, '');
                expression = TaxonomySyntaxAPI.buildExpression(currentUrl);
                expression.remove("*" + taxonomyId + "*");

                var compiledExp = expression.compile();
                if (compiledExp) {
                    mainUrl.queryParam('q').set('"taxonomy"', '"' + compiledExp + '"');
                } else {
                    mainUrl.queryParam('q').remove('"taxonomy"');
                }
            }
            renderURL(mainUrl.compile());
            break;
        case "update":
            if (url.indexOf("taxonomy") > -1) {
                currentUrl = mainUrl.queryParam('q').get('"taxonomy"').replace(/^\"/, '').replace(/\"/, '');
                expression = TaxonomySyntaxAPI.buildExpression(currentUrl);
                expression.remove("*" + taxonomyId.oldQuery + "*");
                expression.add("*" + taxonomyId.newQuery + "*");
                mainUrl.queryParam('q', '"taxonomy":"' + expression.compile() + '"');
            }
            renderURL(mainUrl.compile());
            break;
        default:
            break;
    }
};

/**
 * This method will choose , asset loading is for list assets or top assets.
 * @param url
 */
var renderURL = function (url) {

    if (window.location.href.toString().indexOf("top-assets") > 0) {
        caramel.serverRender({
            body: 'top_assets'
        }, {
            url: url,
            error: function (data) {
                console.log(data);
            },
            success: function (data) {
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
    var liTag = $('<li/>').attr({children: true, class: 'has-sub first-level'});

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


var onClickRemoveAllSelected = function (element) {

    var allMatchingElements = $("#accordion1").find('.selected-disabled');
    disableAllSimilarElements(allMatchingElements);

    var elementId = $(element).closest('a').attr('id');

    var topSelectedElements = $("#accordion1").find('.filter-tag');

    for (var i = 0; i < topSelectedElements.length; i++) {
        if ($(topSelectedElements[i]).attr('id').split("#")[0] === elementId) {
            $(topSelectedElements[i]).find('.actions').find('.btn-remove').click()
            return;
        }
    }

    return false;

};

var disableAllSimilarElements = function (elements) {
    for (var k = 0; k < elements.length; k++) {
        $(elements[k]).attr('onclick', 'return false;').addClass('selected-disabled');
        $(elements[k]).find('.btn-primary').attr('onclick', 'onClickRemoveAllSelected(this);return false;');
        $(elements[k]).closest('li').addClass('active');
        $(elements[k]).find('.btn-primary').removeClass('btn-primary').removeClass('btn-add').addClass('btn-danger').
        addClass('btn-remove').attr('title', 'Remove Filter');
        $(elements[k]).find('.fw-add').removeClass('fw-add').addClass('fw-minus');
    }
};

var globalClickedElement, breadcrumbTaxonomy = "", breadcrumbIdsTaxonomy = "";

/**
 * This method will invoke when press the taxonomy add button.
 * It will generate selected element path and required html format
 * @param element
 */
var displayPaths = function (element) {
    globalClickedElement = $(element).closest('a');
    //disable all similar elements

    var selectedElements = $("#accordion1").find("[id=" + $(element).closest('a').attr('id') + "]");
    disableAllSimilarElements(selectedElements);

    glbTaxoInstance = $(element).parents('.has-sub').last();
    var parentElements = $(globalClickedElement).parents();
    var pathArray = [];
    var pathIdArray = [];
    var taxonomyName = $('> a', glbTaxoInstance).attr('elementtext');

    if (!generateFromURL) {
        resolveTaxonomyCRUDQueries($(globalClickedElement).attr('id').replaceAll('-', '/'), "add");
    }

    for (var i = 0; i < parentElements.length; i++) {
        if (parentElements[i].nodeName == "LI") {
            pathArray.push($(parentElements[i]).find('a').attr('elementtext'));
            pathIdArray.push($(parentElements[i]).find('a').attr('id'));
        }
    }

    pathArray = pathArray.reverse();
    for (var j = 1; j < pathArray.length; j++) {
        (j == pathArray.length - 1) ? breadcrumbTaxonomy += pathArray[j] : breadcrumbTaxonomy += pathArray[j] + '-';
    }
    for (var k = 0; k < pathIdArray.length; k++) {
        (k == pathIdArray.length - 1) ? breadcrumbIdsTaxonomy += pathIdArray[k] : breadcrumbIdsTaxonomy +=
            pathIdArray[k] + '#';
    }

    setSelectedPath(pathArray[pathArray.length - 1], breadcrumbTaxonomy, breadcrumbIdsTaxonomy, DIV_HIDDEN_PREFIX +
        $(element).closest('a').attr('data-taxonomyId'), element, taxonomyName, pathArray.length);

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
    $(element).parents('.has-sub').last().removeClass("has-sub");

    // Add new multiple and or
    if ($(element).closest('.add').hasClass('add')) {
        $(element).closest('.add').removeClass('add');

    }
    $('[data-toggle="tooltip"]').tooltip();
};

/**
 * This method will invoke when clicking the close button in edit menu
 * @param element
 */
var onClickHideBock = function (element) {
    $(element).closest('.filter-tag').removeClass("edit");
    $(element).closest('.filter-tag').find('li').removeClass('active');
};

/**
 * This method will update current buttons classes with suitable action
 * @param element Element that need to update
 */
var updateButtonsAttributes = function (element) {
    $(element).attr('onclick', 'onClickMenuGenerate(this);return false;');
    $(element).find('.btn-remove').attr('onclick', 'displayPaths(this);return false;');
    $(element).removeClass('active');
    if ($(element).closest('.value-edit').length > 0) {
        $(element).find('.btn-remove').attr('onclick', 'updateTaxonomy(this);return false;');
        $(element).find('.btn-remove').removeClass('btn-remove').removeClass('btn-danger').addClass('btn-update').addClass('btn-primary').attr('title', 'Update Filter').attr('data-original-title', 'Update Filter');
        $(element).find('.fw-minus').removeClass('fw-minus').addClass('fw-sync');

        $(element).removeClass('selected-disabled');
    } else {
        // $(allMatchingElements[j]).attr('onclick', 'onClickMenuGenerate(this);return false;');
        $(element).find('.btn-remove').attr('onclick', 'displayPaths(this);return false;');
        $(element).find('.btn-remove').removeClass('btn-remove').removeClass('btn-danger').addClass('btn-add').addClass('btn-primary').attr('title', 'Add Filter').attr('data-original-title', 'Add Filter');
        $(element).find('.fw-minus').removeClass('fw-minus').addClass('fw-add');

        $(element).removeClass('selected-disabled');
    }
};

/**
 * This method will remove selected element from the taxonomy view
 * and modify the search query
 * @param element
 */
var removeClickedElement = function (element) {
    if (!generateFromURL) {
        resolveTaxonomyCRUDQueries($(element).closest('.filter-tag').attr('id').split("#")[0].replaceAll('-', '/'),
            "remove");
    }

    // remove All selected matched elements
    var allMatchingElements = $("#accordion1").find('.selected-disabled');

    for (var j = 0; j < allMatchingElements.length; j++) {
        if ($(allMatchingElements[j]).attr('id') == $(element).closest('.filter-tag').attr('id').split('#')[0]) {
            updateButtonsAttributes($(allMatchingElements[j]));

        }
    }

    //  when last selected element deleted , show basic taxonomy selection
    if ($(element).closest('.filter-tag').siblings('.filter-tag').length == 0) {
        $(element).closest('.first-level').find('.taxonomy-grouped-or-wrapper').remove();
        $(element).closest('.first-level').prev().remove();
        $(element).closest('.filter-tag').parent().addClass("has-sub").removeClass("disabled");
        $(element).closest('.filter-tag').parent().find('a').attr('onclick', 'onClickMenuGenerate(this);return false;');

        $(element).closest('.filter-tag').remove();

        removeDeleteButtonsMainTaxonomy(element);
    } else if ($(element).closest('.filter-tag').attr('id') === $(element).closest('.first-level').find('.filter-tag').
        last().attr('id')) {
        var prevElement = $(element).closest('.first-level').find('.filter-tag').last().prev();
        $(element).closest('.filter-tag').remove();
        $(prevElement).find('.taxonomy-or-sep-operation').html("");
        $(prevElement).find('.taxonomy-or-sep-wrapper').find('.btn-primary').show();
        $(prevElement).find('.taxonomy-or-sep-wrapper').find('.btn-primary').
        attr('onclick', 'AddNewORTaxonomy(this);return false;');
        $(prevElement).find('.taxonomy-or-sep-wrapper').find('.btn-primary').attr('data-original-title', 'Add Filter');
        $(prevElement).find('.taxonomy-or-sep-wrapper').find('.fw-cancel').removeClass('fw-cancel').addClass('fw-add');

    } else {
        $(element).closest('.filter-tag').remove();
    }

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
    //remove unwanted tooltip div element inside cloned edit view
    $(element).closest('.filter-tag').find('.tooltip').remove();
    $(element).closest('.filter-tag').find('.value-edit').find('[aria-expanded="true"]').attr('aria-expanded', 'false');
    var openElements = $(element).closest('.filter-tag').attr('id').split('#');

    for (var i = 1; i < openElements.length; i++) {
        $(element).closest('.filter-tag').find('.value-edit').find('#' + openElements[i]).parent().
        attr('aria-expanded', 'true');

    }
    var listIds = $(element).closest('.filter-tag').attr('id').split('#');
    $(element).closest('.filter-tag').find('.value-edit').find('#' + listIds[0]).parent().addClass('active');

    var filterTag = $(element).closest('.filter-tag');
    /*    var orSeparator = $('.taxonomy-or-sep-wrapper', filterTag);*/

    filterTag.addClass("edit");
    filterTag.removeClass("expand");
    $('[data-toggle="tooltip"]').tooltip();
};

/**
 * This method will invoke when clicking on update button
 * This will invoke query update method
 * @param element
 */
var updated = false;
var updateTaxonomy = function (element) {

    var updateData = {
        "oldQuery": $(element).closest('.filter-tag').attr('id').split("#")[0].replaceAll('-', '/'),
        "newQuery": $(element).closest('a').attr('id').replaceAll('-', '/')
    };
    if (!generateFromURL) {
        resolveTaxonomyCRUDQueries(updateData, "update");
    }
    var parentElements = $(globalClickedElement).parents();
    var pathArray = [];
    var pathIdArray = [];

    for (var i = 0; i < parentElements.length; i++) {
        if (parentElements[i].nodeName == "LI") {
            pathArray.push($(parentElements[i]).find('a').attr('elementtext'));
            pathIdArray.push($(parentElements[i]).find('a').attr('id'));
        }
    }

    // remove All selected matched elements
    var allMatchingElements = $("#accordion1").find('.selected-disabled');

    for (var j = 0; j < allMatchingElements.length; j++) {
        if ($(allMatchingElements[j]).attr('id') == $(element).closest('.filter-tag').attr('id').split('#')[0]) {
            updateButtonsAttributes($(allMatchingElements[j]));

        }
    }

    var selectedElements = $("#accordion1").find("[id=" + $(element).closest('a').attr('id') + "]");
    disableAllSimilarElements(selectedElements);

    pathArray = pathArray.reverse();
    for (var j = 0; j < pathArray.length; j++) {
        (j == pathArray.length - 1) ? breadcrumbTaxonomy += pathArray[j] : breadcrumbTaxonomy += pathArray[j] + '-';
    }
    for (var k = 0; k < pathIdArray.length; k++) {
        (k == pathIdArray.length - 1) ? breadcrumbIdsTaxonomy += pathIdArray[k] : breadcrumbIdsTaxonomy +=
            pathIdArray[k] + '#';
    }


    var tempEle = generateExpandedElements(breadcrumbTaxonomy, '-');


    $(element).closest('.filter-tag').attr('id', breadcrumbIdsTaxonomy);
    $(element).closest('.filter-tag').attr('idpath', breadcrumbTaxonomy);
    $(element).closest('.filter-tag').find('.value-expand').html(tempEle.find('ul').first());
    $(element).closest('.filter-tag').find('.value-full').html(breadcrumbTaxonomy.replaceAll('-', '/'));
    $(element).closest('.filter-tag').find('.value-truncate').html(pathArray[pathArray.length - 1]);
    if (pathArray.length > 2) {
        $(element).closest('.filter-tag').find('.value-truncate').text("../" + pathArray[pathArray.length - 1]);
    } else {
        $(element).closest('.filter-tag').find('.value-truncate').text(pathArray[pathArray.length - 1]);
    }

    $(element).closest('.filter-tag').find('.value-truncate').attr('data-original-title', breadcrumbTaxonomy.
    replaceAll('-', '/'));

    breadcrumbIdsTaxonomy = "";
    breadcrumbTaxonomy = "";
    updated = true;

    $(element).closest('.filter-tag').removeClass("edit");
    $(element).closest('.filter-tag').removeClass("expand");
    // $(element).closest('.filter-tag').find('.value-edit').find('ul').first().remove();

    return false;
};

/**
 * This method will generate html element for selected path
 * @param breadcrumbTaxonomy
 * @returns html element
 */
var generateExpandedElements = function (breadcrumbTaxonomy, parameter) {
    var newUl, newLi, tempEle;
    var pathArray = breadcrumbTaxonomy.split(parameter);
    // creating ul,li markup - already selected
    for (var k = pathArray.length - 1; k >= 0; k--) {
        newLi = $('<li/>').attr({'data-value': pathArray[k]}).append(pathArray[k]);
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
var setSelectedPath = function (element, breadcrumbTaxonomy, breadcrumbIdsTaxonomy, taxonomyId, originalElement,
                                taxonomyName, pathArrayLength) {

    var divFilterTag = $('<div/>').attr({
        id: breadcrumbIdsTaxonomy,
        idPath: breadcrumbTaxonomy,
        'data-taxonomyId': taxonomyId,
        class: 'filter-tag'
    });

    var tempEle = generateExpandedElements(breadcrumbTaxonomy, '-');
    var elementText = (pathArrayLength > 2) ? ".. /" + element : "&emsp;" + element;

    divFilterTag.append('<span class="actions">'
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
        + '<span class="value value-truncate" data-placement="top" data-toggle="tooltip" data-original-title="' + breadcrumbTaxonomy.replaceAll('-', '/') + '" data-original-title="">' + elementText + '</span>'
        + '<span class="value value-full">' + breadcrumbTaxonomy.replaceAll('-', '/') + '</span>'
        + '<span class="value value-expand"> <ul>' + $(tempEle).html() + "</ul>"
        + '</span>');


    var spanValEdit = $('<span/>').attr({class: 'value value-edit'});
    var newClonedElement;
    if ($(originalElement).closest('.add').hasClass('add')) {
        var currentId = $(originalElement).closest('.add').clone().attr('id');
        // cloning new element
        newClonedElement = $(originalElement).closest('.add').clone().attr('id', currentId + '-cloned-id');
        $(newClonedElement).find('.btn-add').attr('title', 'Update Filter').
        attr('data-original-title', 'Update Filter');
        $(newClonedElement).find('.fw-add').removeClass('fw-add').addClass('fw-sync');
        $(newClonedElement).find('.btn-add').attr('onclick', 'updateTaxonomy(this);return false;');
        $(newClonedElement).find('.btn-add').removeClass('btn-add').addClass('btn-update');

        spanValEdit.append(newClonedElement);
        $(divFilterTag).append(spanValEdit);
    } else {
        newClonedElement = $(originalElement).closest('.first-level').find('ul').first().clone().attr('id',
            'cloned-id');
        $(newClonedElement).find('.btn-add').attr('title', 'Update Filter').
        attr('data-original-title', 'Update Filter');
        $(newClonedElement).find('.fw-add').removeClass('fw-add').addClass('fw-sync');
        $(newClonedElement).find('.btn-add').attr('onclick', 'updateTaxonomy(this);return false;');
        $(newClonedElement).find('.btn-add').removeClass('btn-add').addClass('btn-update');

        spanValEdit.append(newClonedElement);
        $(divFilterTag).append(spanValEdit);

        $(originalElement).closest('.first-level').before('<div class="taxonomy-group-title">' + taxonomyName +
            '</div>');

    }

    divFilterTag.append('<div class="taxonomy-or-sep-wrapper">' +
        '<div class="taxonomy-or-sep">' +
        '<span class="taxonomy-or-sep-operation"> </span>' +
        '<button type="button" class="btn btn-primary" data-toggle="tooltip"  title="Add Filter" onclick="AddNewORTaxonomy(this);return false;" data-original-title="Add Filter">' +
        '<span class="icon fw fw-stack"><i class="fw fw-add fw-stack-1x"></i><i class="fw fw-circle-outline fw-stack-2x"></i></span>' +
        '</button>' +
        '</div>' +
        '</div>');

    // Adding bottom or bar with plus mark
    if ($(originalElement).closest('.add').hasClass('add')) {

        $(originalElement).closest('.first-level').append(divFilterTag);
    } else {
        var taxonomyItem = $(originalElement).parents('.has-sub').last();
        $(taxonomyItem).append(divFilterTag);
    }

    $(originalElement).closest('.filter-tag').find('.taxonomy-or-sep-wrapper').find('.btn-primary').hide();
    $(originalElement).closest('.filter-tag').find('.taxonomy-or-sep-operation').append("OR");
    // $(originalElement).closest('.filter-tag').find('.taxonomy-or-sep-wrapper').remove()

};

/**
 * This method for add new taxonomy inside selected item
 *
 * @param element
 * @constructor
 */
var AddNewORTaxonomy = function (element) {
    var clonedTaxonomy = $(element).closest('.first-level').find('ul').first().clone();
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

    $(clonedTaxonomy).addClass("has-sub");
    $(clonedTaxonomy).addClass("add");
    $(clonedTaxonomy).removeClass("disabled");
    $(element).closest('.filter-tag').append(clonedTaxonomy);

    $(element).find('.fw-add').removeClass('fw-add').addClass('fw-cancel');
    $(element).attr('onclick', 'cancelORTaxonomy(this);return false;');
    $(element).attr('data-original-title', 'Cancel');
    $(element).attr('title', 'Cancel');

};

/**
 * This method is for cancel button which appear when adding or filters
 *  this will hide expanded taxonomy addition view
 * @param element
 */
var cancelORTaxonomy = function (element) {
    $(element).closest('.taxonomy-or-sep-wrapper').next().remove();
    // $(element).find('.fw-cancel').removeClass('btn-or-cancel');
    $(element).find('.fw-cancel').removeClass('fw-cancel').addClass('fw-add');
    $(element).attr('onclick', 'AddNewORTaxonomy(this);return false;');
    $(element).attr('data-original-title', 'Add Filter');
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
            url = caramel.context + '/apis/taxonomies/' + $(element).attr('taxonomy') + '?' + resolveDomain();

        } else {
            url = caramel.context + '/apis/taxonomies/' + $(element).attr('taxonomy') + '/' +
                $(element).attr('id').replaceAll('-', '/') + '?children=true' + '&' + resolveDomain();
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
    $('[data-toggle="tooltip"]').tooltip();
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

        var actionButton,ispan1x;

        if ($(child).closest('.value-edit').length > 0) {
            actionButton = $('<button/>').attr({
                type: 'button',
                class: 'btn btn-primary btn-update',
                'data-toggle': 'tooltip',
                title: 'Update Filter',
                'data-original-title': 'Update Filter',
                onclick: 'updateTaxonomy(this);return false;'
            });
            ispan1x = $('<i/>').attr({class: 'fw fw-sync fw-stack-1x'});
        } else {
            actionButton = $('<button/>').attr({
                type: 'button',
                class: 'btn btn-primary btn-add',
                'data-toggle': 'tooltip',
                title: 'Add Filter',
                'data-original-title': 'Add Filter',
                onclick: 'displayPaths(this);return false;'
            });
            ispan1x = $('<i/>').attr({class: 'fw fw-add fw-stack-1x'});
        }

        var buttonSpan = $('<span/>').attr({class: 'icon fw fw-stack'});
        var ispan2x = $('<i/>').attr({class: 'fw fw-circle-outline fw-stack-2x'});

        buttonSpan.append(ispan1x);
        buttonSpan.append(ispan2x);

        actionButton.append(buttonSpan);
        innerAnchorTag.append(actionButton);

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

    (parseInt(store.listAssetsCount) || parseInt(store.assetCount) ) ? assetAvailability = true :
        assetAvailability = false;

    if (window.location.href.indexOf("list") < 0 && window.location.href.indexOf("top-assets") < 0 &&
        window.location.href.indexOf('taxonomy') < 0) {
        $("#taxonomy-section").hide();
    }

    if (((store.taxonomyAvailability && assetAvailability) || ((window.location.href.indexOf("top-assets") > 0) &&
        (store.topAssettaxonomyAvailability)) ) || (window.location.href.indexOf('taxonomy') > -1)) {

        $("#taxonomy-section").show();

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
                formatTaxonomyData(data);
                generateTaxonomyViewFromUrl();
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

    (store.assetCount > 0) ? assetAvailability = true : assetAvailability = false;

});


$(window).load(function () {
    $('[data-toggle="tooltip"]').tooltip();
    nanoScrollerSelector.nanoScroller({alwaysVisible: true});
});
$('body').on('click', '#maximize-taxonomy', function () {
    $(taxonomySection).find('.first-level div').removeClass('expand');
    var taxonomy = $('> .taxonomy', taxonomySection).contents();
    $('.taxonomy', taxonomyExpandView).html(taxonomy);
    taxonomySection.hide();
    taxonomyExpandView.show();
    nanoScrollerSelector.nanoScroller();
    $(window).resize();
});

$('body').on('click', '#contract-taxonomy', function () {
    $(taxonomyExpandView).find('.first-level div').removeClass('expand');
    var taxonomy = $('.taxonomy', taxonomyExpandView).contents();
    $('> .taxonomy', taxonomySection).html(taxonomy);
    taxonomyExpandView.hide();
    taxonomySection.show();
    nanoScrollerSelector.nanoScroller();
});


$('body').on('click', '.taxonomy ul.nav li a', function () {
    $(this).closest('.first-level').find('li.active').removeClass('active');

    if (!isFirstLevel($(this))) {
        $(this).closest('li').addClass('active');
    }
});


$('body').on('click', '.taxonomy .filter-tag .value', function (e) {
    if (!$(this).closest('.filter-tag').hasClass('edit')) {
        var truncateElement = $(e.currentTarget).closest('div').attr('idpath').split('-');

        if ($("#taxonomy-section").is(':visible')) {
            if (truncateElement.length >= 2 && !updated) { // restrict expand more than 2 levels
                $(this).closest('.filter-tag').toggleClass('expand');
            }
        } else if (!updated) {
            $(this).closest('.filter-tag').toggleClass('expand');
        }

        if ($("#taxonomy-section").is(':visible')) {
            var valText;
            if ($(this).hasClass("value-truncate")) {
                valText = $(this).siblings(".value-name").text();
            } else {
                valText = $(this).text();
            }

            if ($($(this).siblings('.value-expand').find('li').first()[0]).attr('data-value') === valText) {
                var newHtml;
                //since has class not working here
                if ($(this).attr('class').indexOf('value-name') > 0) {
                    newHtml = $($(this).siblings('.value-expand').find('li').first()[0]).html().
                    split($(this).text())[1];

                } else {
                    newHtml = $($(this).siblings('.value-expand').find('li').first()[0]).html().split($(this).
                    siblings('.value-name').text())[1];
                }

                $($(this).siblings('.value-expand').find('li').first()[0]).html(newHtml);
            }
        } else {
            if (!updated) {
                $($(this).siblings('.value-expand')).html(generateExpandedElements($(this).html(), "/"));
            }
            updated = false;
        }

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

var taxonomyName;
/**
 * This method will load taxonomy name relared to specific root id
 *
 * @param taxonomyId
 */
var clickElementByExpression = function (taxonomyId) {

    $.ajax({
        url: caramel.context + '/apis/taxonomies/' + assetType + '?taxonomyId=' + taxonomyId + "&" + resolveDomain(),
        type: 'GET',
        async: false,
        headers: {
            Accept: "application/json"
        },
        success: function (data) {
            taxonomyName = data[0].taxonomyName;
            $("#taxo" + data[0].taxonomyName).click();
        },
        error: function () {

        }
    });

};

/**
 * This method will generate taxonomy based on url when page refresh
 *
 */
var generateTaxonomyViewFromUrl = function () {
    if (window.location.href.indexOf("taxonomy") > 0) {
        generateFromURL = true;

        var url = decodeURIComponent(window.location.href);
        var mainUrl = URL.buildURL(url);
        var currentUrl;

        currentUrl = mainUrl.queryParam('q').get('"taxonomy"').replace(/^\"/, '').replace(/\"/, '');

        if (currentUrl.indexOf("AND") < 0 && currentUrl.indexOf("OR") < 0) {
            currentUrl = currentUrl.replace(/^\*/, '').replace(/\*/, '');
        }
        var expression = new TaxonomySyntaxAPI.Expression();
        expression = TaxonomySyntaxAPI.buildExpression(currentUrl);
        var expressionArray = [];
        expressionArray = expression.groups();

        // inside list of paths in one taxonomy
        for (var i = 0; i < expressionArray.length; i++) {
            if (expressionArray[i].length > 0) {
                var urlPaths = expressionArray[i];
                for (var v = 0; v < urlPaths.length; v++) {
                    urlPaths[v] = urlPaths[v].replace(/^\*/, '').replace(/\*/, '');
                }
                clickElementByExpression(urlPaths[0].split('/')[0]);
                var elementId = urlPaths[0].split('/')[0];
                var onceClicked = false;
                // inside list of elements in one path
                for (var j = 0; j < urlPaths.length; j++) {
                    var listOfIds = urlPaths[j].split('/');
                    elementId = urlPaths[j].split('/')[0];
                    if (listOfIds.length > 2) {
                        for (var b = 1; b < listOfIds.length; b++) {
                            elementId += '-' + listOfIds[b];

                            if (!onceClicked) {
                                if (listOfIds.length - 1 == b) {
                                    $("#" + elementId).find('.btn-add').click();
                                    onceClicked = true;
                                } else {
                                    $("#" + elementId).click();
                                }
                            } else {

                                if (listOfIds.length - 1 == b) {
                                    if ($('[data-taxonomyid=hiddendivtaxo' + taxonomyName + ']').last().last().
                                        find(".taxonomy-or-sep-wrapper").find('.btn-primary').
                                        attr('title') != "Cancel") {
                                        $('[data-taxonomyid=hiddendivtaxo' + taxonomyName + ']').last().last().
                                        find(".taxonomy-or-sep-wrapper").find('.btn-primary').click();
                                    }

                                    $('[data-taxonomyid=hiddendivtaxo' + taxonomyName + ']').last().find('.add').
                                    find("#" + elementId).find('.btn-add').click();

                                } else {
                                    if ($('[data-taxonomyid=hiddendivtaxo' + taxonomyName + ']').last().last().
                                        find(".taxonomy-or-sep-wrapper").find('.btn-primary').
                                        attr('title') != "Cancel") {
                                        $('[data-taxonomyid=hiddendivtaxo' + taxonomyName + ']').last().last().
                                        find(".taxonomy-or-sep-wrapper").find('.btn-primary').click();
                                    }
                                    $('[data-taxonomyid=hiddendivtaxo' + taxonomyName + ']').last().find(".add").
                                    find("#" + elementId).click();

                                }
                            }
                        }


                    } else {
                        elementId = listOfIds[0] + '-' + listOfIds[1];
                        if (!onceClicked) {
                            $("#" + elementId).find('.btn-add').click();
                            onceClicked = true;
                        } else {
                            $('[data-taxonomyid=hiddendivtaxo' + taxonomyName + ']').last().last().
                            find(".taxonomy-or-sep-wrapper").find('.btn-primary').click();
                            $('[data-taxonomyid=hiddendivtaxo' + taxonomyName + ']').last().find('.add').
                            find("#" + elementId).find('.btn-add').click();
                        }
                    }


                }
            }

        }

    }
    generateFromURL = false;

};