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
const TAXONOMY_DROPDOWN = '#taxonomy-dropdown-menu';
const TAXONOMY_BROWSER = '.taxonomy-browser';
const SELECTED_CONTAINER = '.selected-taxonomy-container';
const SELECTED_CONTENT = '.selected-taxonomy-content';
const BACK_LINK = '<li class="back" style="display: none;"><a href="#">...</a></li>';
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
    }
    else if ($(window).width() >= 768 && $(window).width() <= 992) {
        columnsCount = 2;
    }
    else if ($(window).width() > 992 && $(window).width() <= 1200) {
        columnsCount = 3;
    }
    else {
        columnsCount = 4;
    }
};

/**
 * Updates taxonomy browser data window visibility based on the click event.
 * @param dataWindow    current window that the click event occurred
 */
var updateTaxonomyWindow = function (dataWindow) {
    if ($('[data-window=' + ( dataWindow + 1 ) + ']').length > 0) {
        $('[data-window]:gt(' + ( dataWindow + 1 ) + ')').hide();
        $('[data-window=' + ( dataWindow + 1 ) + ']').fadeIn();

        var windowToHide = ( (dataWindow + 1) - columnsCount );

        if (windowToHide >= 0) {
            $('[data-window]:lt(' + ( windowToHide + 1 ) + ')').hide();
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
            var html = '';
            for (var key in results) {
                if (results.hasOwnProperty(key)) {
                    html += '<li><a role="menuitem" tabindex="-1" href="' + results[key].name + '">'
                        + results[key].name + '</a></li>';
                }
            }
            $(TAXONOMY_DROPDOWN).html(html);
            if ($('#dropdown-button').children().length === 0) {
                $('#taxonomy-dropdown').clone(true, true).appendTo('#dropdown-button');
            }
        }
    });
};

/**
 * Loads the root level children for the given taxonomy name.
 * @param taxonomyName  name of the taxonomy
 */
var loadTaxonomyRoot = function (taxonomyName) {
    $.ajax({
        type: 'GET',
        url: BASE_URL + '/' + taxonomyName,
        success: function (results) {
            for (var key in results) {
                if (results.hasOwnProperty(key)) {
                    var children = results[key].children;
                    var html = '<div class="col-xs-12 col-sm-6 col-md-4 col-lg-3 taxonomy-select-window" data-root="'
                        + taxonomyName + '" data-parent="' + taxonomyName + '" data-window="0"><ul>' + BACK_LINK;

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
                    updateTaxonomyWindow(0);
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
                + taxonomyName + '" data-parent="' + element + '" data-window="' + (dataWindow + 1) + '"><ul>' + BACK_LINK;

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
 * Initializes the taxonomy browser view.
 * @param appliedTaxonomy   array of applied taxonomy for the asset
 */
var initTaxonomyBrowser = function (appliedTaxonomy) {
    $(TAXONOMY_BROWSER).hide();
    $('#taxonomy-list')[0].value = '';
    $(SELECTED_CONTENT).empty();
    selectedTaxonomy.length = 0;

    if (appliedTaxonomy && appliedTaxonomy.length !== 0) {
        //if already applied tags exists
        $(SELECTED_CONTAINER).show();
        $('.message-info').hide();

        for (var key in appliedTaxonomy) {
            if (appliedTaxonomy.hasOwnProperty(key)) {
                var element = appliedTaxonomy[key];
                if (selectedTaxonomy.indexOf(element) < 0) {
                    selectedTaxonomy.push(appliedTaxonomy[key]);
                    $(SELECTED_CONTENT).append('<div data-value="' + appliedTaxonomy[key] + '"><span>'
                        + appliedTaxonomy[key].split('/').join(' > ') + '</span>'
                        + '<button type="button" class="btn btn-danger btn-remove">'
                        + '<i class="fw fw-cancel"></i></span></button></div>');
                }
            }
        }
    } else {
        //if not initialize to empty view
        $(SELECTED_CONTAINER).hide();
        $('.message-info').show();
    }
    loadTaxonomies();
};

$(function () {
    initWindowColumns();

    $(TAXONOMY_DROPDOWN).on('click', 'a', function (e) {
        e.preventDefault();
        var element = $(this).attr('href');
        var rootWindow = $('[data-window=0]');
        if (rootWindow.length === 0) {
            loadTaxonomyRoot(element);
        } else {
            $('[data-window]:eq(0), [data-window]:gt(0)').each(function () {
                $(this).find('li').removeClass('active');
                windowObject[$(this).data('parent')] = $(this);
                $(this).remove();
            });

            if (windowObject[element]) {
                $(TAXONOMY_SELECT).html(windowObject[element].first());
                delete windowObject[element];
                updateTaxonomyWindow(0);
            } else {
                loadTaxonomyRoot(element);
            }
        }
        $(BREADCRUMB_SELECTOR).html('<li>' + element + RIGHT_ARROW + '</li>');
        $(TAXONOMY_BROWSER).show();
    });

    $(TAXONOMY_SELECT).on('click', COLUMN_SELECTOR + ' li:not(.back):not(.leaf) a', function (e) {
        e.preventDefault();
        var element = $(this).attr('href');
        var root = $(this).closest('div').data('root');
        var dataWindow = parseInt($(this).closest('div').data('window'));

        $(this).closest('li').siblings().siblings().each(function () {
            $(this).removeClass('active');
            $('button', this).remove();
        });
        $(this).closest('li:not(.back)').addClass('active');

        $('[data-window]:gt(' + dataWindow + ')').each(function () {
            $(this).find('li').removeClass('active');
            windowObject[$(this).data('parent')] = $(this);
            $(this).remove();
        });

        if (windowObject[element]) {
            $(TAXONOMY_SELECT).append(windowObject[element].first());
            delete windowObject[element];
            updateTaxonomyWindow(dataWindow);
        } else {
            loadTaxonomyChildren(root, element, dataWindow);
        }

        // Updating taxonomy breadcrumb
        $(BREADCRUMB_SELECTOR).html($(BREADCRUMB_SELECTOR + ' > li').first());
        $(COLUMN_SELECTOR + ' ul > li').each(function () {
            if ($(this).hasClass('active')) {
                $(BREADCRUMB_SELECTOR).append('<li>' + $('a', this).html() + '</li>');
            }
        });
    });

    $(TAXONOMY_SELECT).on('click', COLUMN_SELECTOR + ' li.back > a', function (e) {
        e.preventDefault();

        var dataWindow = $(this).closest(COLUMN_SELECTOR).data('window'),
            windowsToHide = ( (dataWindow - 1) + columnsCount );

        // Hide windows that are overflowing
        $('[data-window]:gt(' + (windowsToHide - 1) + ')').hide();
        $('[data-window=' + dataWindow + '] > ul > li.back').hide();
        $('[data-window=' + ( dataWindow - 1 ) + ']').fadeIn();
    });

    $(TAXONOMY_SELECT).on('click', COLUMN_SELECTOR + ' li.leaf > a', function (e) {
        e.preventDefault();
        displayValue.length = 0;
        var elemParent = $(this).closest('li');
        elemParent.siblings().each(function () {
            $(this).removeClass('active');
            $('button', this).remove();
        });
        $(this).closest('li:not(.back)').addClass('active');

        // Updating taxonomy breadcrumb
        $(BREADCRUMB_SELECTOR).html($(BREADCRUMB_SELECTOR + ' > li').first());
        $(COLUMN_SELECTOR + ' ul > li').each(function () {
            if ($(this).hasClass('active')) {
                displayValue.push($('a', this).text());
                $(BREADCRUMB_SELECTOR).append('<li>' + $('a', this).html() + '</li>');
            }
        });

        //Appending the add button to leaf nodes
        if (selectedTaxonomy.indexOf($(this).attr('href')) < 0) {
            elemParent.append(' <button class="btn btn-add"><span>Add</span>'
                + '<span class="icon fw fw-stack"><i class="fw fw-add fw-stack-1x"></i>'
                + '<i class="fw fw-circle-outline fw-stack-2x"></i></span></button>');
        }
    });

    $(TAXONOMY_SELECT).on('click', COLUMN_SELECTOR + ' li.leaf > button', function (e) {
        e.preventDefault();
        var selectedValue = $(this).prev('a').attr('href');
        if (selectedTaxonomy.indexOf(selectedValue) < 0) {
            selectedTaxonomy.push(selectedValue);
            $(SELECTED_CONTENT).append(
                '<div data-value="' + selectedValue + '"><span>' + displayValue.join(' > ') + '</span>'
                + '<button type="button" class="btn btn-danger btn-remove">'
                + '<i class="fw fw-cancel"></i></span></button></div>');
        }

        if (selectedTaxonomy.length === 1) {
            $('.message-info').hide();
            $(SELECTED_CONTAINER).show();
        }
        $(this).remove();
    });

    $(SELECTED_CONTENT).on('click', 'button', function (e) {
        e.preventDefault();
        var removedIndex = selectedTaxonomy.indexOf($(this).closest('div').data('value'));
        selectedTaxonomy.splice(removedIndex, 1);
        $(this).closest('div').remove();

        if ($(SELECTED_CONTENT).children().length < 1) {
            initTaxonomyBrowser(null);
        }
    });
});
