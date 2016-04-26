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

$(function() {
    var programmatically = false;
    var URL = caramel.context + '/apis/asset/' + store.publisher.assetId + '/taxonomies?type=' + store.publisher.type;

    var selectedTaxa = [];
    var originalPath = "";
    var originalPathAry = [];
    $.ajax({
        url: URL,
        type: 'GET',
        async: false,
        headers: {
            Accept: "application/json"
        },
        success: function (response) {

            selectedTaxa = response.data;

            for (var i = 0; i < selectedTaxa.length; i++) {
                var pathList = selectedTaxa[i].split("/");
                for (var j = 0; j < pathList.length - 1; j++) {
                    try {
                        if (j == 0) {
                            originalPath = pathList[0];
                            if (originalPathAry.length == 0) {
                                originalPathAry.push(originalPath);
                            }
                        } else {
                            originalPath += "/" + pathList[j];
                            originalPathAry.push(originalPath);
                        }
                    } catch (e) {

                    }
                }
            }
            originalPathAry = unique(originalPathAry);
            originalPathAry = originalPathAry.reverse();
        },
        error: function () {
        }
    });


    function unique(list) {
        var result = [];
        $.each(list, function(i, e) {
            if ($.inArray(e, result) == -1) result.push(e);
        });
        return result;
    }

    var currentNode;
    var jsTreeView = $('#jstree-taxonomy');

    jsTreeView.jstree({
        conditionalselect : function (node, event) {
            var tree = $('#jstree-taxonomy').jstree(true);
            if (tree.is_leaf(node) || event.toElement.className == "jstree-icon jstree-checkbox" || event.toElement.className == "jstree-icon jstree-checkbox jstree-undetermined") {
                if (!tree.is_leaf(node)) {
                    tree.open_all(node);
                }
                return true;

            } else {
                //tree.open_node(node);
                if (tree.is_open(node)) {
                    tree.close_node(node);
                }else {
                    tree.open_node(node);
                }
                return false;
            }

        },
        plugins: ["checkbox", "conditionalselect"],
        core: {
            data: {
                animation: 0,
                check_callback: true,
                url: function (node) {
                    // modify url when clicking on tree nodes to load children
                    if (node.id === '#') {
                        return caramel.context + '/apis/taxonomies';
                    } else {
                        return caramel.context + '/apis/taxonomies?terms=' + node.id + '/children';
                    }
                },
                data: function (node) {
                    currentNode = node;
                },
                success: function (data) {

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
                        for (var i = 0; i < (data.length); i++) {
                            data[i].id = currentNode.original.id + "/" + data[i].elementName;
                            if (data[i].text == "") {
                                data[i].text = data[i].elementName;
                            }

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




    $("#jstree-taxonomy").on("click.jstree", function (e, datax) {
        programmatically = false;

    });
    /**
     * recursively open nodes. finally required nodes are opened, we will check required leaf nodes
     */
    $("#jstree-taxonomy").on("after_open.jstree", function (e, datax) {
        if (programmatically) {
            datax.instance.open_node(originalPathAry.pop());
            if (originalPathAry.length == 0) {
                for (var i = 0; i < selectedTaxa.length; i++) {
                    datax.instance.check_node(selectedTaxa[i]);
                }
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



    /**
     * This method will invoked on first load of (root) jstree
     */
    $("#jstree-taxonomy").on("loaded.jstree", function (e, datax) {
        programmatically = true;
        datax.instance.open_node(originalPathAry.pop());


    });


    $("#editAssetButton").click(function () {
        var jsTree = $('#jstree-taxonomy').jstree(true);
        var checkedNodesList = jsTree.get_checked(true);
        var pathFromRoot = "";
        for (var i = 0; i < checkedNodesList.length; i++) {
            if (jsTree.is_leaf(checkedNodesList[i])) {

                pathFromRoot += checkedNodesList[i].id + ",";
            }
        }
        $("#taxonomy-list")[0].value = pathFromRoot;
        // var checkedNodes = $('#data').jstree("get_all_checked");

    });

    $("input[type='reset']").on("click", function(event){
        var jsTree = $('#jstree-taxonomy').jstree(true);
        jsTree.uncheck_all();
        for (var i = 0; i < selectedTaxa.length; i++) {
            jsTree.check_node(selectedTaxa[i]);
        }

    });

    validator.initValidationEvents('form-asset-update',function(){});
    $('#editAssetButton').removeAttr('disabled');
    var obtainFormMeta = function(formId) {
        return $(formId).data();
    };

    $('#form-asset-update').ajaxForm({
        beforeSubmit:function(){
            var editButton = $('#editAssetButton');
            editButton.attr('disabled', 'disabled');
            editButton.next().attr('disabled', 'disabled');
            caramel.render('loading', 'Updating asset. Please wait..', function (info, content) {
                var $content = $(content).removeClass('loading-animation-big').addClass('loading-animation');
                editButton.parent().append($content);
            });
            if (!validator.isValidForm('form-asset-update')) {
                window.scrollTo(0, 0);
                $('div.error').each(function () {
                    var $container = $(this).closest('div.responsive-form-container');
                    if (!$container.hasClass('in')) {
                        $container.show('fast').addClass('in');
                    }
                });
                $('#editAssetButton').removeAttr('disabled');
                setTimeout(
                    function () {
                        $('.loading-animation').remove();
                    }, 1000);
                return false;
            }
        },
        success: function(data) {
            var editButton = $('#editAssetButton');
            messages.alertSuccess('Updated the '+PublisherUtils.resolveCurrentPageAssetType()+ ' successfully');
            var options=obtainFormMeta('#form-asset-update');
            editButton.removeAttr('disabled');
            editButton.next().removeAttr('disabled');
            $('.loading-animation').css('display','none');
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

    var initDatePicker =  function(){
        if($(this).attr('data-render-options') == "date-time"){
            var dateField = this;
            $(this).DatePicker({
                mode: 'single',
                position: 'right',
                onBeforeShow: function(el){
                    if($(dateField).val().replace(/^\s+|\s+$/g,"")){
                        $(dateField).DatePickerSetDate($(dateField).val(), true);
                    }

                },
                onChange: function(date, el) {
                    $(el).val((date.getMonth()+1)+'/'+date.getDate()+'/'+date.getFullYear());
                    if($('#closeOnSelect input').attr('checked')) {
                        $(el).DatePickerHide();
                    }
                }
            });
        }
    };

    $('#form-asset-update input[type="text"]').each(initDatePicker);


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

    $('.js-add-unbounded-row').click(function(){
        var tableName = $(this).attr('data-name');
        var table = $('#table_'+tableName);
        table.find('thead').show();
        var referenceRow = $('#table_reference_'+tableName);
        var newRow = referenceRow.clone().removeAttr('id');
        $('input[type="text"]', newRow).val('');
        table.show().append(newRow);
        table.find('thead').show();
        $('input[type="text"]',newRow).each(initDatePicker);

    });
    $('.js-unbounded-table').on('click','a',function(event){
        removeUnboundRow($(event.target));

    });

    $('.tmp_refernceTableForUnbounded').each(function(){
        $(this).detach().attr('class','refernceTableForUnbounded').appendTo('body');
    });

    $('.tmp_refernceTableForOptionText').each(function(){
        $(this).detach().attr('class','refernceTableForUnbounded').appendTo('body');
    });

    $('#form-asset-update a.collapsing-h2').off('click', '**').on('click', function (e) {
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
     * Hides all the tables except the first table in order to improve
     * readability
     */
    $('#form-asset-update .responsive-form-container').each(function(index){
        if(index!=0){
            $(this).hide();
        }
    });

    /**
     * Changes the field icon to collapsed state
     */
    $('.field-title').each(function(index){
        if(index!=0){
            $(this).addClass("collapsed");
        }
    });

    $('#btn-cancel-update').on('click', function(e) {
        var assetId = $('#asset-id').val();
        var assetType = $('#asset-type').val();
        var path = caramel.url('/assets/'+assetType + '/details/' + assetId);

        $.ajax({
            success : function(response) {
                window.location = path;
            }
        });
    });
});