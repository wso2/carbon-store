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

const BASE_URL = caramel.context + '/apis/taxonomies';
const TAXONOMY_SELECT = '.taxonomy-select';
const COLUMN_SELECTOR = '.taxonomy-select-window';
const BREADCRUMB_SELECTOR = '.taxonomy-breadcrumb > ol';
const TAXONOMY_BROWSER = '.taxonomy-browser';
const SELECTED_CONTAINER = '.selected-taxonomy-container';
const SELECTED_CONTENT = '.selected-taxonomy-content';
const TAXONOMY_SELECT_BUTTON = '#taxonomy-select-button';
const CANCEL_BUTTON = '#cancel-button';
const BACK_LINK = '<li class="back" style="display: none;"><a href="#">../</a></li>';
const RIGHT_ARROW = ' <i class="icon fw fw-right-arrow"></i>';

var windowObject = {};
var selectedTaxonomy = [];
var displayValue = [];
var columnsCount;

/**
 * Initializes the taxonomy browser window column size based on the window size.
 */
var initWindowColumns = function () {
    if ($(window).width() < 768) {
        columnsCount = 1;
    } else if ($(window).width() >= 768 && $(window).width() <= 992) {
        columnsCount = 2;
    } else if ($(window).width() > 992 && $(window).width() <= 1200) {
        columnsCount = 3;
    } else {
        columnsCount = 4;
    }
};

/**
 * Updates taxonomy browser data window visibility based on the click event.
 * @param dataWindow    current window that the click event occurred
 */
var updateTaxonomyWindow = function (dataWindow) {
    if ($('[data-window=' + (dataWindow + 1) + ']').length > 0) {
        $('[data-window]:gt(' + (dataWindow + 1) + ')').hide();
        $('[data-window=' + (dataWindow + 1) + ']').fadeIn();

        var windowToHide = ((dataWindow + 1) - columnsCount);

        if (windowToHide >= 0) {
            $('[data-window]:lt(' + (windowToHide + 1) + ')').hide();
            $('[data-window=' + (windowToHide + 1) + '] > ul > li.back').show();
        }
    }
};

/**
 * Loads available taxonomies for the asset type.
 */
var loadTaxonomies = function () {
    $.ajax({
        type: 'GET',
        url: BASE_URL + '?assetType=' + store.publisher.type,
        success: function (results) {
            var html = '<div class="col-xs-12 col-sm-6 col-md-4 col-lg-3 taxonomy-select-window" data-root="#"' +
                ' data-window="0"><ul>';
            for (var key in results) {
                if (results.hasOwnProperty(key)) {
                    html += '<li><a href="' + results[key].name + '">' + results[key].name + RIGHT_ARROW + '</a></li>';
                }
            }
            html += '</ul></div>';
            $(TAXONOMY_SELECT).html(html);
        }
    });
};

/**
 * Loads the root level children for the given taxonomy name.
 * @param taxonomyName  name of the taxonomy
 * @param dataWindow    window of the current element
 */
var loadTaxonomyRoot = function (taxonomyName, dataWindow) {
    $.ajax({
        type: 'GET',
        url: BASE_URL + '/' + taxonomyName,
        success: function (results) {
            for (var key in results) {
                if (results.hasOwnProperty(key)) {
                    var children = results[key].children;
                    var html = '<div class="col-xs-12 col-sm-6 col-md-4 col-lg-3 taxonomy-select-window" data-root="'
                        + taxonomyName + '" data-parent="' + taxonomyName + '" data-window="' + (dataWindow + 1)
                        + '"><ul>' + BACK_LINK;
                    for (var index in children) {
                        if (children.hasOwnProperty(index)) {
                            var child = children[index];
                            if (child.children) {
                                html += '<li><a href="' + child.currentElement + '">' + child.label + RIGHT_ARROW;
                            } else {
                                html += '<li class="leaf"><a href="' + child.currentElement + '">' + child.label;
                            }
                            html += '</a></li>';
                        }
                    }
                    html += '</ul></div>';
                    $(TAXONOMY_SELECT).append(html);
                    updateTaxonomyWindow(dataWindow);
                }
            }
        }
    });
};

/**
 * Loads the children of a given element.
 * @param taxonomyName  name of the taxonomy
 * @param element       current element
 * @param dataWindow    window of the current element
 */
var loadTaxonomyChildren = function (taxonomyName, element, dataWindow) {
    $.ajax({
        type: 'GET',
        url: BASE_URL + '/' + taxonomyName + '/' + element + "?children=true",
        success: function (results) {
            var html = '<div class="col-xs-12 col-sm-6 col-md-4 col-lg-3 taxonomy-select-window" data-root="'
                + taxonomyName + '" data-parent="' + element + '" data-window="' + (dataWindow + 1) + '"><ul>'
                + BACK_LINK;

            for (var key in results) {
                if (results.hasOwnProperty(key)) {
                    var child = results[key];
                    if (child.children) {
                        html += '<li><a href="' + child.currentElement + '">' + child.label + RIGHT_ARROW;
                    } else {
                        html += '<li class="leaf"><a href="' + child.currentElement + '">' + child.label;
                    }
                    html += '</a></li>';
                }
            }
            html += '</ul></div>';
            $(TAXONOMY_SELECT).append(html);
            updateTaxonomyWindow(dataWindow);
        }
    });
};

/**
 * Get the name of a taxonomy element and push to a global array displayValue.
 * @param taxonomyName  name of the taxonomy
 * @param taxonomyPath  path of the element
 */
var getTaxonomyElementDisplayName = function (taxonomyName, taxonomyPath) {
    $.ajax({
        type: 'GET',
        async: false,
        url: BASE_URL + '/' + taxonomyName + '/' + taxonomyPath,
        success: function (results) {
            displayValue.push(results[0].label);
        }
    })
};

/**
 * Get display value of taxonomy path and push to a global array displayValue.
 * @param taxonomyPath  taxonomy path
 */
var getTaxonomyDisplayName = function (taxonomyPath) {
    var taxonomyPathList = taxonomyPath.split('/');
    var taxonomyId = taxonomyPathList[0];
    $.ajax({
        type: 'GET',
        async: false,
        url: BASE_URL + '/' + store.publisher.type + '/?taxonomyId=' + taxonomyId,
        success: function (results) {
            var taxonomyName = results[0].taxonomyName;
            displayValue.push(taxonomyName);
            var path = taxonomyId;
            for (var i = 1; i < taxonomyPathList.length; ++i) {
                path += '/' + taxonomyPathList[i];
                getTaxonomyElementDisplayName(taxonomyName, path);
            }
        }
    });
};

/**
 * Resets taxonomy browser to the initial position.
 */
var resetTaxonomyBrowser = function () {
    $(COLUMN_SELECTOR + ' li').removeClass('active');
    $(COLUMN_SELECTOR + ' li > button').remove();
    $(COLUMN_SELECTOR + ' li.back').hide();

    $('[data-window]:gt(0)').each(function () {
        var parent = $(this).data('parent');
        if (!windowObject[parent]) {
            windowObject[parent] = $(this);
        }
        $(this).remove();
    });
    $(BREADCRUMB_SELECTOR).empty();
    $(TAXONOMY_BROWSER).hide('slow');
    $(CANCEL_BUTTON).hide();
    $(TAXONOMY_SELECT_BUTTON).show();
    $('[data-window=0]').show();
};

/**
 * Initializes the taxonomy browser view.
 * @param appliedTaxonomy   array of applied taxonomy for the asset
 */
function initTaxonomyBrowser(appliedTaxonomy) {
    $(TAXONOMY_BROWSER).hide();
    if ($('#taxonomy-list')[0]) {
        $('#taxonomy-list')[0].value = '';
    }
    $(SELECTED_CONTENT).empty();
    selectedTaxonomy.length = 0;

    if (appliedTaxonomy && appliedTaxonomy.length !== 0) {
        //if already applied tags exists
        $(SELECTED_CONTAINER).show('slow');

        for (var key in appliedTaxonomy) {
            if (appliedTaxonomy.hasOwnProperty(key)) {
                var element = appliedTaxonomy[key];
                getTaxonomyDisplayName(element);
                if (selectedTaxonomy.indexOf(element) < 0) {
                    selectedTaxonomy.push(appliedTaxonomy[key]);
                    $(SELECTED_CONTENT).append('<div data-value="' + appliedTaxonomy[key] + '"><span>'
                        + displayValue.join(' > ') + '</span>'
                        + '<button type="button" class="btn btn-danger btn-remove">'
                        + '<i class="fw fw-cancel"></i></span></button></div>');
                }
                displayValue.length = 0;
            }
        }
    } else {
        //if not initialize to empty view
        $(SELECTED_CONTAINER).hide();
    }
    loadTaxonomies();
}

$(function () {
    initWindowColumns();

    $('#taxonomy').find('.collapsing-h2').click(function () {
        resetTaxonomyBrowser();
    });

    $(TAXONOMY_SELECT_BUTTON).click(function () {
        $(TAXONOMY_BROWSER).show('medium');
        $(CANCEL_BUTTON).show();
        $(TAXONOMY_SELECT_BUTTON).hide();
    });

    $(CANCEL_BUTTON).click(function () {
        resetTaxonomyBrowser();
    });

    $(TAXONOMY_SELECT).on('click', COLUMN_SELECTOR + ' li:not(.back):not(.leaf) a', function (e) {
        e.preventDefault();
        var element = $(this).attr('href');
        var root = $(this).closest('div').data('root');
        var dataWindow = parseInt($(this).closest('div').data('window'));

        $('[data-window]:gt(' + dataWindow + ')').each(function () {
            var parent = $(this).data('parent');
            if (!windowObject[parent]) {
                windowObject[parent] = $(this);
            }
            $(this).remove();
        });

        if (windowObject[element]) {
            $(TAXONOMY_SELECT).append(windowObject[element].first());
            delete windowObject[element];
            updateTaxonomyWindow(dataWindow);
        } else {
            if (dataWindow === 0) {
                loadTaxonomyRoot(element, dataWindow);
            } else {
                loadTaxonomyChildren(root, element, dataWindow);
            }
        }

        $(this).closest('li:not(.back)').addClass('active');
        $(this).closest('li').siblings().each(function () {
            $(this).removeClass('active');
            $('button', this).remove();
        });

        // Updating taxonomy breadcrumb
        $(BREADCRUMB_SELECTOR).empty();
        $(COLUMN_SELECTOR + ' ul > li').each(function () {
            if ($(this).hasClass('active')) {
                $(BREADCRUMB_SELECTOR).append('<li>' + $('a', this).html() + '</li>');
            }
        });
    });

    $(TAXONOMY_SELECT).on('click', COLUMN_SELECTOR + ' li.back > a', function (e) {
        e.preventDefault();

        var dataWindow = $(this).closest(COLUMN_SELECTOR).data('window'),
            windowsToHide = ((dataWindow - 1) + columnsCount);

        // Hide windows that are overflowing
        $('[data-window]:gt(' + (windowsToHide - 1) + ')').hide();
        $('[data-window=' + dataWindow + '] > ul > li.back').hide();
        $('[data-window=' + (dataWindow - 1) + ']').fadeIn();
    });

    $(TAXONOMY_SELECT).on('click', COLUMN_SELECTOR + ' li.leaf > a', function (e) {
        e.preventDefault();
        displayValue.length = 0;

        var dataWindow = parseInt($(this).closest('div').data('window'));
        $('[data-window]:gt(' + dataWindow + ')').each(function () {
            if (!windowObject[parent]) {
                windowObject[parent] = $(this);
            }
            $(this).remove();
        });

        var elemParent = $(this).closest('li');
        $(this).closest('li:not(.back)').addClass('active');
        elemParent.siblings().each(function () {
            $(this).removeClass('active');
            $('button', this).remove();
        });

        // Updating taxonomy breadcrumb
        $(BREADCRUMB_SELECTOR).empty();
        $(COLUMN_SELECTOR + ' ul > li').each(function () {
            if ($(this).hasClass('active')) {
                $(BREADCRUMB_SELECTOR).append('<li>' + $('a', this).html() + '</li>');
            }
        });

        //Appending buttons to leaf nodes
        if (selectedTaxonomy.indexOf($(this).attr('href')) < 0) {
            appendButton(elemParent, true);
        } else {
            appendButton(elemParent, false);
        }
    });

    $(TAXONOMY_SELECT).on('click', COLUMN_SELECTOR + ' li.leaf > button.btn-add', function (e) {
        e.preventDefault();
        var selectedValue = $(this).prev('a').attr('href');
        $(BREADCRUMB_SELECTOR + ' li').each(function () {
            displayValue.push($(this).text());
        });

        if (selectedTaxonomy.indexOf(selectedValue) < 0) {
            selectedTaxonomy.push(selectedValue);
            $(SELECTED_CONTENT).append(
                '<div data-value="' + selectedValue + '"><span>' + displayValue.join(' > ') + '</span>'
                + '<button type="button" class="btn btn-danger btn-remove">'
                + '<i class="fw fw-cancel"></i></span></button></div>');
            displayValue.length = 0;
        }

        if (selectedTaxonomy.length === 1) {
            $(SELECTED_CONTAINER).show('slow');
        }
        appendButton($(this).closest('li'), false);
        $(this).remove();

    });

    $(TAXONOMY_SELECT).on('click', COLUMN_SELECTOR + ' li.leaf > button.btn-remove', function (e) {
        e.preventDefault();
        var selectedValue = $(this).prev('a').attr('href');
        $('[data-value="' + selectedValue + '"] > button').trigger('click');
        appendButton($(this).closest('li'), true);
        $(this).remove();
    });

    $(SELECTED_CONTENT).on('click', 'button', function (e) {
        e.preventDefault();
        var dataValue = $(this).closest('div').data('value');
        var removedIndex = selectedTaxonomy.indexOf(dataValue);
        selectedTaxonomy.splice(removedIndex, 1);
        $(this).closest('div').remove();

        var selectedColumn = $(COLUMN_SELECTOR + ' a[href="' + dataValue + '"]').closest('li');
        selectedColumn.find('button').remove();
        if (selectedColumn.hasClass('active')) {
            appendButton(selectedColumn, true);
        }

        if ($(SELECTED_CONTENT).children().length < 1) {
            $(SELECTED_CONTAINER).hide('slow');
        }
    });

    function appendButton(element, add) {
        if (add) {
            element.append(' <button class="btn btn-add">'
                + '<span class="icon fw-stack"><i class="fw fw-add fw-stack-1x"></i>'
                + '<i class="fw fw-ring fw-stack-2x"></i></span>  Add</button>');
        } else {
            element.append(' <button class="btn btn-remove">'
                + '<span class="icon fw-stack"><i class="fw fw-minus fw-stack-1x"></i>'
                + '<i class="fw fw-ring fw-stack-2x"></i></span>  Remove</button>');
        }
    }
});

$(window).resize(function () {
    var previousColumnCount = columnsCount;
    initWindowColumns();
    var difference = columnsCount - previousColumnCount;
    if (difference !== 0) {
        var dataWindows = $(COLUMN_SELECTOR).map(function () {
            return $(this).data('window');
        }).get();
        var highestWindow = Math.max.apply(Math, dataWindows);
        if (difference < 0) {
            $('[data-window=' + (highestWindow - columnsCount) + ']').hide();
            $('[data-window=' + (highestWindow - columnsCount + 1) + ']').find('li.back').show();
        } else {
            for (var i = 0; i < columnsCount; ++i) {
                $('[data-window=' + (highestWindow - i) + ']').show();
                $('[data-window=' + (highestWindow - i + 1) + ']').find('li.back').hide();
            }
        }
    }
});
