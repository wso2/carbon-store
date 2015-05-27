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
var validations = {
    alphaOnly: {
        validateFunc: function (ctx) {
            var letters = /^[a-zA-Z]+$/;
            if (ctx.match(letters)) {
                return true;
            }
            return false;
        }
    },
    alphaNumericOnly: {
        validateFunc: function (ctx) {
            var letters = /^[0-9a-zA-Z]+$/;
            ;
            if (ctx.match(letters)) {
                return true;
            }
            return false;
        }
    },
    numericOnly: {
        validateFunc: function (ctx) {
            var letters = /^[0-9]+$/;
            if (ctx.match(letters)) {
                return true;
            }
            return false;
        }
    },
    decimalCheck: {
        validateFunc: function (ctx) {
            var letters = /^[-+]?[0-9]+\.[0-9]+$/;
            if (ctx.match(letters)) {
                return true;
            }
            return false;
        }
    },
    passwordLength: {
        validateFunc: function (ctx) {
            if (ctx.length > 4) {
                return true;
            }
            return false;
        }
    },
    dateValidate: {
        validateFunc: function (ctx) {
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
        }
    },
    requiredField: {
        validateFunc: function (ctx) {
            return ctx.length > 0;
        }
    },
    dateTime: {
        validateFunc: function (ctx) {
            var dateTimeFormat = /^[0,1]?\d\/(([0-2]?\d)|([3][01]))\/((199\d)|([2-9]\d{3}))\s[0-2]?[0-9]:[0-5][0-9] (am|pm)?$/;
            if (ctx.match(dateTimeFormat)) {
                return true;
            }
            return false;
        }
    },
    time: {
        validateFunc: function (ctx) {
            var timeFormat = /^(?:0?[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
            if (ctx.match(timeFormat)) {
                return true;
            }
            return false;
        }
    },
    email: {
        validateFunc: function (ctx) {
            var emailFormat = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            if (ctx.match(emailFormat)) {
                return true;
            }
            return false;
        }
    },
    url: {
        validateFunc: function (ctx) {
            var urlFormat = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i;
            if (ctx.match(urlFormat)) {
                return true;
            }
            return false;
        }
    },
    telephoneNo: {
        validateFunc: function (ctx) {
            var phoneno = /^\d{10}$/;
            if (ctx.match(phoneno)) {
                return true;
            }
            return false;
        }
    }
};