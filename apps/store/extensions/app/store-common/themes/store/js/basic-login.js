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

    $('#username').keypress(function () {
        $('#regFormError').hide();
    });

    $('#password').keypress(function () {
        $('#regFormError').hide();
    });

    $("#basic-login-form").validate({
        rules: {
            username: "required",
            password: "required"
        },
        messages: {
            username: "Please provide a username",
            password: "Please provide a password"
        }
    });

    var spinnerURL = function(){
        return caramel.url('/extensions/app/store-common/themes/store/img/sign-in.gif');
    };

    var showSpinner = function(spinnerLocation,msg){
        $(spinnerLocation).html('<img src="'+spinnerURL()+'" /> '+msg);
        $(spinnerLocation).attr('disabled',true);
    };

    var hideSpinner = function(spinnerLocation,msg){
       $(spinnerLocation).html(msg); 
       $(spinnerLocation).attr('disabled',false);
    };

    $('#basic-login-form').ajaxForm({
        beforeSubmit:function(e){
            showSpinner('#submitBtn','SIGNING IN');
        },
        success: function (data) {
            data = JSON.parse(data);
            var url = data.referer || caramel.url('');
            window.location = url;
        },
        error: function (data) {
            var regFormError = $('#regFormError');
            var errorMessage = data.responseJSON.error.replace(/^\s+|\s+$/gm,'');
            if(errorMessage.length > 0 ){
                regFormError.show();
                regFormError.text(errorMessage);
            }
            $("#basic-login-form").resetForm();
            $('#username').focus();
            $('#password-error').hide();
            $('#password').removeClass('error');
            hideSpinner('#submitBtn','SIGN IN ');
        }
    });
});