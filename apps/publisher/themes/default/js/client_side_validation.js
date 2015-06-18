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

//Custom validator for valid Email check support custom error messages per field
$.validator.addMethod("EmailTypeCheck", function (value, element) {
    if (value == "") {
        $.validator.messages.checkEmail = "this field must not be empty";
        return false;
    } else {
        var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        console.log(regex.test(value));
        if (!regex.test(value)) {
            $.validator.messages.checkEmail = "this field must be email(johnjim@gmail.com)";
        }
        return regex.test(value);
    }
}, $.validator.messages.checkEmail);
//custom validator for valid url check
$.validator.addMethod("UrlTypeCheck", function (value, element) {
    console.log(value);
    var myRegExp = /^http:\/\/[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+$/;
    console.log(myRegExp.test(value.trim()));
    return myRegExp.test(value.trim());
}, "please provide valid url (http://www.abc.com)");
//custom validator for remote ajax call to validate asset name
$.validator.addMethod("FieldValidate", function (value, element) {
    var data = '%22name%22 : %22' + value + '%22';
    var result = false;
    $.ajax({
        type: "GET",
        url: caramel.url("/apis/assets?type=gadget&q=" + data),
        dataType: "json",
        async: false,
        headers: {
            Accept: "application/json"
        },
        success: function (data, textStatus, xhr) {
            var obj = data;
            if (obj.list.length > 0) {
                result = false;
            } else {
                result = true;
            }
        },
        error: function (xhr, thrownError) {
            console.log("error " + xhr.responseText + "  " + thrownError);
        }
    });
    return result;
}, "The name already taken");
// Dependent validation
$.validator.addMethod("valueContainsComp", function (value, element) {
    var items = document.getElementsByClassName('valueContainsComp');
    for (var i = 0; i < items.length; i++)
        console.log(items[i].value);
}, "this is checking comparison");
//custom validator for required field.
$.validator.addMethod("requiredChecked", function (value, element) {
    return value.length != 0;
}, "this field should not be empty Please fill the data");
//check all the inputs are alphabetical letters
$.validator.addMethod("alphaChecked", function (value, element) {
    var letters = /^[A-Za-z]+$/;
    return !!value.match(letters);
}, "this field should be contains letters only");
//check all the inputs are numeric
$.validator.addMethod("numericChecked", function (value, element) {
    var numbers = /^[0-9]+$/;
    return !!value.match(numbers);
}, "Please input numeric characters only");
//check for alphaNumeric
$.validator.addMethod("alphaNumericChecked", function (value, element) {
    var letters = /^[0-9a-zA-Z]+$/;
    return !!value.match(letters);
}, "Please input alphanumeric characters only");
//check for valid date
$.validator.addMethod("dateChecked", function (value, element) {
    var dateformat = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/;
    // Match the date format through regular expression
    if (value.match(dateformat)) {
        //Test which seperator is used '/' or '-'
        var opera1 = value.split('/');
        var opera2 = value.split('-');
        lopera1 = opera1.length;
        lopera2 = opera2.length;
        // Extract the string into month, date and year
        if (lopera1 > 1) {
            var pdate = inputText.value.split('/');
        } else if (lopera2 > 1) {
            var pdate = inputText.value.split('-');
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
}, "Invalid data format");
// phone number validation
$.validator.addMethod("phoneNOCheck", function (value, element) {
    var phoneno = /^\d{10}$/;
    return !!(value.match(phoneno));
}, "Enter the valid phone number");
//credit card validation
$.validator.addMethod("creditCardCheck", function (value, element) {
    var cardno = /^(?:3[47][0-9]{13})$/;
    return !!value.match(cardno);
}, "Not a valid Amercican Express credit card number!");