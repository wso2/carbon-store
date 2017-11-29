/*
 *  Copyright (c) 2005-2014, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
$(function () {
    validator.initValidationEvents('form-asset-create', function () {
    });
    $('#btn-create-asset').removeAttr('disabled');
    $('select').each(function (index) {
        if ($(this).attr('data-valcount')) {
            $(this).select2();
        }
    });
    var obtainFormMeta = function (formId) {
        return $(formId).data();
    };
    var populateTags = function (arr) {
        var entry;
        var modifiedArr = [];
        var tagEntry;

        //The Select2 plugin creates multiple entries in the FormData
        //object.These duplicates need to be removed and a single
        //_tags entry created in their place

        arr.forEach(function (entry) {
            if (entry.name !== '_tags') {
                modifiedArr.push(entry);
            } else {
                tagEntry = entry;
                if (tagEntry == undefined) {
                    return;
                }
                tagEntry.value = tagsAPI.selectedTags();
            }
        });
        modifiedArr.push(tagEntry);
        return modifiedArr;
    };

    $('#form-asset-create').ajaxForm({
        beforeSubmit: function (arr) {
            var createButton = $('#btn-create-asset');
            createButton.attr('disabled', 'disabled');
            createButton.next().attr('disabled', 'disabled');
            /*caramel.render('loading', 'Creating asset. Please wait..', function (info, content) {
             var $content = $(content).removeClass('loading-animation-big').addClass('loading-animation');
             createButton.parent().append($content);
             });*/
            // populateTags(arr);
            if (!validator.isValidForm('form-asset-create')) {
                window.scrollTo(0, 0);
                $('div.error').each(function () {
                    var $container = $(this).closest('div.responsive-form-container');
                    if (!$container.hasClass('in')) {
                        $container.show('fast').addClass('in');
                    }
                });
                $('#btn-create-asset').removeAttr('disabled');
                setTimeout(
                    function () {
                        $('.loading-animation').remove();
                    }, 1000);
                return false;
            }
            messages.alertInfoLoader('<i class="fa fa-spinner fa-pulse" id="assetLoader"></i> <strong>Creating the new asset</strong>. Please wait...<i class="fa fa-close" onclick="clearWaiting()"></i>');
        },
        success: function (data) {
            var options = obtainFormMeta('#form-asset-create');
            var type = PublisherUtils.resolveCurrentPageAssetType();
            $('#btn-create-asset').removeAttr('disabled');
            $.cookie("new-asset-" + type, data.id + ":" + type + ":" + data.name);
            window.location = options.redirectUrl;
        },
        error: function (response) {
            var result;
            messages.hideAlertInfoLoader();
            if (response && response.responseText) {
                result = JSON.parse(response.responseText);
            }
            if (result && result.moreInfomation) {
                messages.alertError('Unable to create the ' + PublisherUtils.resolveCurrentPageAssetType() + ' instance.' + result.moreInfomation);
            } else {
                messages.alertError('Unable to add the ' + PublisherUtils.resolveCurrentPageAssetType() + ' instance.');
            }
            $('#btn-create-asset').removeAttr('disabled');
            $('.fa-spinner').parent().remove();
        }
    });
    var initDatePicker = function () {
        if ($(this).attr('data-render-options') == "date-time") {
            var dateField = this;
            $(this).DatePicker({
                mode: 'single',
                position: 'right',
                onBeforeShow: function (el) {
                    if ($(dateField).val().replace(/^\s+|\s+$/g, "")) {
                        $(dateField).DatePickerSetDate($(dateField).val(), true);
                    }

                },
                onChange: function (date, el) {
                    $(el).val((date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear());
                    if ($('#closeOnSelect input').attr('checked')) {
                        $(el).DatePickerHide();
                    }
                }
            });
        }
    };

    $('#form-asset-create input[type="text"]').each(initDatePicker);


    var removeUnboundRow = function (link) {
        var table = link.closest('table');
        var requiredOneRow = false;
        var numberOfRows = $('tr', table).length;
        if (table.attr('data-required-row')) {
            requiredOneRow = true;
        }
        if (requiredOneRow && numberOfRows == 2) {
            messages.alertError('Required to have at-least one row.');
            return false;
        }
        if (numberOfRows == 2) {
            table.hide();
        }
        link.closest('tr').remove();
    };

    $('.js-add-unbounded-row').click(function () {
        var tableName = $(this).attr('data-name');
        var table = $('#table_' + tableName);
        table.find('thead').show();
        var referenceRow = $('#table_reference_' + tableName);
        var newRow = referenceRow.clone().removeAttr('id');
        $('[data-toggle="tooltip"]', newRow).each(function () {
            var attr = $(this).attr('data-original-title');
            if (typeof attr !== typeof undefined && attr !== false) {
                $(this).attr('title', $(this).attr('data-original-title'));
            }
        });
        $('input[type="text"]', newRow).val('');
        table.show().append(newRow);
        table.find('thead').show();
        $('select',newRow).select2();
    });

    $('.js-unbounded-table').on('click', 'a', function (event) {
        removeUnboundRow($(event.target));
    });

    $('.js-unbounded-table').on('click', 'input[type="checkbox"]', function (event) {
        var checkbox = event.target;
        var hiddenField = $(checkbox).next();
        if ($(checkbox).is(":checked")) {
            $(hiddenField).val('on');
        } else {
            $(hiddenField).val('off');
        }
    });

    $('.tmp_refernceTableForUnbounded').each(function () {
        $(this).detach().attr('class', 'refernceTableForUnbounded').appendTo('body');
    });

    $('.tmp_refernceTableForOptionText').each(function () {
        $(this).detach().attr('class', 'refernceTableForUnbounded').appendTo('body');
    });

    $('#form-asset-create a.collapsing-h2').off('click', '**').on('click', function (e) {
        e.preventDefault();
        var $panel = $(this).parent().next();
        if ($panel.is(":visible")) {
            $panel.slideUp();
            $(this).parent().addClass('collapsed');
        } else {
            $panel.slideDown();
            $(this).parent().removeClass('collapsed');
        }
    });
    /**
     * Hides tables which dose not contain required fields.
     * count the number of required fields in one table, if count equals to zero
     * then hide that table. First table will expand always
     */
    $('#form-asset-create .responsive-form-container').each(function (index) {
        if ($(this).find('.required-field').length == 0 && index != 0) {
            $(this).hide();
            $('.field-title').eq(index).addClass("collapsed");
        }
    });

    initTaxonomyBrowser(null);

    String.prototype.replaceAll = function (find, replace) {
        var str = this;
        return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
    };

    $('#btn-create-asset').click(function (e) {
        var taxonomyList = $('#taxonomy-list')[0];
        if (selectedTaxonomy && taxonomyList) {
            taxonomyList.value = selectedTaxonomy.join(',');
        }
    });

    $('button[type=reset]').click(function (e) {
        initTaxonomyBrowser(null);
        resetTaxonomyBrowser();
    });
});
