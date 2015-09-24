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
    $('#editAssetButton').removeAttr('disabled');
    var obtainFormMeta = function(formId) {
        return $(formId).data();
    };

    $('#form-asset-update').ajaxForm({
        beforeSubmit:function(){
            $('#editAssetButton').attr('disabled','disabled');
        },
        success: function(data) {
            messages.alertSuccess('Updated the '+PublisherUtils.resolveCurrentPageAssetType()+ ' successfully');
            var options=obtainFormMeta('#form-asset-update');
            $('#editAssetButton').removeAttr('disabled');
            window.location = options.redirectUrl + data.id;
        },
        error: function() {
            $('#editAssetButton').removeAttr('disabled');
        }
    });

    var initDatePicker =  function(){
        console.info('init date picker');
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
        if($('tr',table).length == 2){
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
});