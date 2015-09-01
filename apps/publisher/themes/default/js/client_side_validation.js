/*
 *  Copyright (c) 2005-2014, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the 'License'); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */
$(window).load(function() {
    var assetType = store.publisher.type;
    $.validator.addMethod('isValidEmail', function (value, element) {
        if (value == '') {
            $.validator.messages.checkEmail = 'This field must not be empty';
            return false;
        } else {
            var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
            if (!regex.test(value)) {
                $.validator.messages.checkEmail = 'This field must be email(example@mail.com)';
            }
            return regex.test(value);
        }
    }, $.validator.messages.checkEmail);
//custom validator for valid url check
    $.validator.addMethod('isValidUrl', function (value, element) {
        var myRegExp = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;
        return myRegExp.test(value);
    }, 'Please provide valid url (http://www.example.org)');
//custom validator for remote ajax call to validate asset name
//    $.validator.addClassRules('isUniqueField', {
//        'remote': {
//            type: 'GET',
//            url: caramel.url('/assets/'+ assetType +'/apis/validation?type='+assetType),
//            success: function (data, status, xhr) {
//                xhr.responseText = false;
//                return false;
//            }
//        }
//    });
//$.validator.addMethod('isUniqueField',function(value,element){
//    console.log('is unique field');
//    $.ajax({
//        type: 'GET',
//        //url: caramel.url('apis/validation'),
//        url: caramel.url('/validation/'),
//        success: function () {
//            console.log('success');
//            return false;
//        },
//        error: function (xhr, thrownError) {
//            console.log('error ' + xhr.responseText + '  ' + thrownError);
//        }
//    });
//},'this is error message');
    //TODO asyn call is set to be true
$.validator.addMethod('isUniqueField', function (value, element) {
    var errorMsg = 'The '+ element.getAttribute('name') +' already taken';
    var data = '%22name%22 : %22' + value + '%22';
    var result = false;
    var obj;
    $.ajax({
        type: 'GET',
        url: caramel.url('/apis/assets?type='+assetType+'&_wildcard=false&q=' + data),
        dataType: 'json',
        async: false,
        success: function (data) {
            obj = data;
            result = obj.list.length <= 0;
            $.validator.messages.isUniqueField = errorMsg;
        },
        error: function (xhr, thrownError) {
            console.log('error ' + xhr.responseText + '  ' + thrownError);
        }
    });
    return result;
},$.validator.messages.isUniqueField);
//custom validation for ignoring special characters at input fields
    $.validator.addMethod('ignoreSpecialCharacters', function (value, element) {
        var erroMsg = 'This field '+ element.getAttribute('name') +' should not contains special characters';
        //(~!@#;%^*()+={}|\<>"',) --> Illegal characters
        var regex = /^[0-9a-zA-Z\_\-\/\,\.\?\:\s]+$/;
        $.validator.messages.ignoreSpecialCharacters = erroMsg;
        return regex.test(value);
    }, $.validator.messages.ignoreSpecialCharacters);
//custom validator for required field.
    $.validator.addMethod('isRequiredField', function (value, element) {
        return value.length != 0;
    }, 'This field should not be empty Please fill the data');
//check all the inputs are alphabetical letters
    $.validator.addMethod('isAlphaOnly', function (value, element) {
        var letters = /^[A-Za-z]+$/;
        return letters.test(value);
    }, 'This field should be contains letters only');
//check all the inputs are numeric
    $.validator.addMethod('isNumericOnly', function (value, element) {
        var numbers = /^[0-9]+$/;
        return numbers.test(value);
    }, 'Please input numbers only');
//check for alphaNumeric
    $.validator.addMethod('isAlphaNumericOnly', function (value, element) {
        var letters = /^[0-9a-zA-Z]+$/;
        return letters.test(value);
    }, 'Please input alphanumeric characters only');
//check for valid date
    $.validator.addMethod('isValidDate', function (value, element) {
        var dateformat = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/;
        // Match the date format through regular expression
        if (value.match(dateformat)) {
            //Test which seperator is used '/' or '-'
            var opera1 = value.split('/');
            var opera2 = value.split('-');
            var pdate;
            lopera1 = opera1.length;
            lopera2 = opera2.length;
            // Extract the string into month, date and year
            if (lopera1 > 1) {
                pdate = inputText.value.split('/');
            } else if (lopera2 > 1) {
                pdate = inputText.value.split('-');
            }
            var dd = parseInt(pdate[0]);
            var mm = parseInt(pdate[1]);
            var yy = parseInt(pdate[2]);
            // Create list of days of a month [assume there is no leap year by default]
            var ListofDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (mm == 1 || mm > 2) {
                if (dd > ListofDays[mm - 1]) {
                    return false;
                }
            }
            if (mm == 2) {
                var lyear = false;
                if ((!(yy % 4) && yy % 100) || !(yy % 400)) {
                    lyear = true;
                }
                if ((lyear == false) && (dd >= 29)) {
                    return false;
                }
                if ((lyear == true) && (dd > 29)) {
                    return false;
                }
            }
        } else {
            return false;
        }
    }, 'Invalid date format');
// phone number validation
    $.validator.addMethod('isValidTelephoneNo', function (value, element) {
        var phoneno = /^\d{10}$/;
        return (phoneno.test(value));
    }, 'Enter the valid phone number');
//credit card validation
    $.validator.addMethod('isValidCreditCardNo', function (value, element) {
        var cardno = /^(?:3[47][0-9]{13})$/;
        return cardno.test(value);
    }, 'Not a valid credit card number!');
});