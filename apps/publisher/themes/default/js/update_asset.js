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

var appliedTaxonomy = [];
$(function() {
    var URL = caramel.context + '/apis/asset/' + store.publisher.assetId + '/taxonomies?type=' + store.publisher.type;

    $.ajax({
        url: URL,
        type: 'GET',
        async: false,
        headers: {
            Accept: "application/json"
        },
        success: function (response) {
            appliedTaxonomy = response.data;
            initTaxonomyBrowser(appliedTaxonomy);
        }
    });

    validator.initValidationEvents('form-asset-update',function(){});
    $('#editAssetButton').removeAttr('disabled');
    $('select').each(function (index) {
        if ($(this).attr('data-valcount')) {
            $(this).select2();
        }
    });
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
            setTimeout(
                function () {
                    window.location.reload();
                }, 1500);
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
        $('select',newRow).select2();

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

    $('#editAssetButton').click(function (e) {
        var taxonomyList = $('#taxonomy-list')[0];
        if (selectedTaxonomy && taxonomyList) {
            taxonomyList.value = selectedTaxonomy.join(',');
        }
    });

    $('input[type=reset]').click(function (e) {
        initTaxonomyBrowser(appliedTaxonomy);
        resetTaxonomyBrowser();
    });
});

var showImageFull = function (img) {
    $(img).next().trigger('click');
};
