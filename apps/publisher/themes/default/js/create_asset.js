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
    validator.initValidationEvents('form-asset-create',function(){});
    $('#btn-create-asset').removeAttr('disabled');
    var obtainFormMeta = function (formId) {
        return $(formId).data();
    };
    var populateTags = function (arr) {
        var entry;
        for (var index = 0; index < arr.length; index++) {
            entry = arr [index];
            if (entry.name === '_tags') {
                entry.value = tagsAPI.selectedTags();
            }
        }
    };
    $('#form-asset-create').ajaxForm({
        beforeSubmit: function (arr) {
            var createButton = $('#btn-create-asset');
            createButton.attr('disabled', 'disabled');
            createButton.next().attr('disabled', 'disabled');
            caramel.render('loading', 'Creating asset. Please wait..', function (info, content) {
                var $content = $(content).removeClass('loading-animation-big').addClass('loading-animation');
                createButton.parent().append($content);
            });
            populateTags(arr);
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
            if (response && response.responseText){
                result = JSON.parse(response.responseText);
            }
            if (result && result.moreInfomation){
                messages.alertError(result.moreInfomation);
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


    var removeUnboundRow = function(link){
        var table = link.closest('table');
        var requiredOneRow = false;
        var numberOfRows = $('tr',table).length;
        if(table.attr('data-required-row')){
            requiredOneRow = true;
        }
        if(requiredOneRow && numberOfRows == 2){
            messages.alertError('Required to have at-least one row.');
            return false;
        }
        if(numberOfRows == 2){
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
        $('input[type="text"]', newRow).val('');
        table.show().append(newRow);
        table.find('thead').show();
        $('input[type="text"]', newRow).each(initDatePicker);

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
        if($panel.is(":visible")){
            $panel.slideUp();
            $(this).parent().addClass('collapsed');
        }else{
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



    /**
     * This method will store user selected nodes values into a hidden html text input field before submit
     * From the backend read this data as text field values
     */
    $("#btn-create-asset").click(function () {
        var jsTree = $('#jstree-taxonomy').jstree(true);
        var checkedNodesList = jsTree.get_checked(true);
        var pathFromRoot = "";
        for (var i = 0; i < checkedNodesList.length; i++) {
            if (jsTree.is_leaf(checkedNodesList[i])) {

                pathFromRoot += checkedNodesList[i].id + ",";
            }
        }
        $("#taxonomy-list")[0].value = pathFromRoot;
    });

    /**
     * This method will render the jstree using lazy loading. There is one specific call url for root node.
     * Other Url will dynamically generated while getting user clicked values and load the rest of nodes
     * @type {*|jQuery|HTMLElement}
     */

    var currentNode;
    var currentNodeAry = [];
    var jsTreeView = $('#jstree-taxonomy');
    jsTreeView.jstree({
        conditionalselect: function (node, event) {
            var tree = $('#jstree-taxonomy').jstree(true);
            if (tree.is_leaf(node) || $(event.originalEvent.target).attr("class") == "jstree-icon jstree-checkbox" || $(event.originalEvent.target).attr("class") == "jstree-icon jstree-checkbox jstree-undetermined") {
                if (!tree.is_leaf(node)) {
                    tree.open_all(node);
                }
                return true;

            } else {
                /// tree.open_node(node);
                if (tree.is_open(node)) {
                    tree.close_node(node);
                }else {
                    tree.open_node(node);
                }
                return false;
            }
            return true;
        },
        plugins: ["checkbox", "conditionalselect"],
        checkbox: {


        },

        core: {
            data: {
                animation: 0,

                url: function (node) {

                    if (node.id === '#') {
                        return caramel.context + '/apis/taxonomies';
                    } else {
                        return caramel.context + '/apis/taxonomies?terms=' + node.id + '/children';
                    }
                },
                data: function (node) {
                    currentNode = node;
                    if (node.id != "#") {
                        currentNodeAry.push(node);
                    }

                },
                success: function (data) {
                    //modify the REST API return data
                    var children;
                    try {
                        children = Array.isArray(data[0].children);
                    } catch (e) {

                    }

                    if (children) {
                        data[0].id = data[0].elementName;
                        if (data[0].text == "") {
                            data[0].text = data[0].elementName;
                        }
                        for (var i = 0; i < data[0].children.length; i++) {
                            data[0].children[i].id = data[0].elementName + "/" + data[0].children[i].elementName;
                            if (data[0].children[i].text == "") {
                                data[0].children[i].text = data[0].children[i].elementName;
                            }
                        }
                    } else {
                        for (var j = 0;j<currentNodeAry.length;j++) {
                            for (var i = 0; i < (data.length); i++) {
                                data[i].id = currentNodeAry[j].original.id + "/" + data[i].elementName;
                                if (data[i].text == "") {
                                    data[i].text = data[i].elementName;
                                }
                            }
                            currentNodeAry = [];
                        }
                    }

                }

            },
            themes: {
                dots: true,
                icons: false
            }
        }

    });

    /**
     * This method will open root node by default
     */
    $("#jstree-taxonomy").on("ready.jstree", function (e, data) {
        // try to improve using data parameter
        var tree = $('#jstree-taxonomy').jstree(true);
        tree.open_node(tree.get_node("#").children);
        $("#" + tree.get_node("#").children[0]).find('.jstree-ocl').first().remove();
        $("#" + tree.get_node("#").children[0]).find('> a > .jstree-checkbox').remove()

    });

    $("#tree").bind("select_node.jstree", function (e, data) {
        $("#jstree-taxonomy").jstree("toggle_node", data.node);
        $("#jstree-taxonomy").jstree("deselect_node", data.node);
    });
    String.prototype.replaceAll = function (find, replace) {
        var str = this;
        return str.replace(new RegExp(find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replace);
    };

    $("button[type='reset']").on("click", function(event){
        var jsTree = $('#jstree-taxonomy').jstree(true);
        jsTree.uncheck_all();
    });

});