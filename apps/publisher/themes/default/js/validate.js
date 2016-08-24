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
var validator = {};
validator.validateMethods = {};
validator.customMethods = [];
validator.VALIDATED_ELEMENTS = 'input[type="text"],input[type="file"],input[type="password"],input[type="checkbox"],textarea,select';
validator.VALIDATED_EVENTS ="focus blur keyup change";
function isTextArea(el){
    return ($(el).prop('tagName') === 'TEXTAREA');
}
/*
 The function add a method to the validation queue
 @validation: key for the method
 @callback: callback to register events on
 @return:
 */
validator.addMethod = function (validation, callback) {
    validator.validateMethods[validation] = callback;
};
/*
 The function add a method to the custom validation queue
 @callback: custom method to execute
 */
validator.addCustomMethod = function (callback) {
    validator.customMethods.push(callback);
};
/*
 Add set of default methods. These methods can be invoke by adding a class prefixing "validate_" to each key.
 Ex: If we add a css class "validate_required" to an element, it will be validated as given by the callback.
 */
validator.addDefaultMethods = function () {
    //Add required field validation to text, password and textarea elements.
    validator.addMethod('required', function (element) {
        var elementType = $(element).attr('type');
        var requirementFilled = false;
        if (elementType == "checkbox") {
            requirementFilled = $(element).is(":checked");
        } else if (elementType == "text" || elementType == "file" || elementType == "textarea" || elementType == "password" || $(element).prop("tagName") === "SELECT" || isTextArea(element)) {
            requirementFilled = $(element).val().length > 0;
        }
        if (requirementFilled) {
            return "";
        } else {
            return $(element).attr('data-validate-required') || "Please enter a value.";
        }
    });
    //Add custom regexp validation to text, password and textarea elements.
    validator.addMethod('regexp', function (element) {
        var regexpStr = $(element).attr('data-regexp') || '';
        var regexp = new RegExp(regexpStr);
        if ($(element).val() == "" || regexp.test($(element).val())) {
            return "";
        } else {
            return $(element).attr('data-validate-regexp') ||
                "Doesn't satisfy regular expression:" + $(element).attr('data-regexp');
        }
    });
};
/*
 The following can be use from an extension as follows.
 It's not bind to a specific field.
 Following method validate to check if at least one of the checkboxes are checked.
 @example:
    validator.addCustomMethod(function () {
        var bronze = $('#tierAvailability_bronze');
        var unlimited = $('#tierAvailability_unlimited');
        var gold = $('#tierAvailability_gold');
        var silver = $('#tierAvailability_silver');
        var errorMessage = "You need to check at least one from the tires";
        var checkboxClickCustomHandler = function () {
            if (silver.is(':checked') || gold.is(':checked') || unlimited.is(':checked') || bronze.is(':checked')) {
                bronze.removeClass("error-field");
                bronze.next().remove();
            } else {
                validator.showErrors(bronze, errorMessage);
            }
        };
        bronze.click(checkboxClickCustomHandler);
        unlimited.click(checkboxClickCustomHandler);
        gold.click(checkboxClickCustomHandler);
        silver.click(checkboxClickCustomHandler);
        if (silver.is(':checked') || gold.is(':checked') || unlimited.is(':checked') || bronze.is(':checked')) {
            return {message: "", element: bronze};
        } else {
            return {message: errorMessage, element: bronze};
        }
    });
 */
validator.validateCustom = function () {
    var noErrors = true;
    for (var i = 0; i < validator.customMethods.length; i++) {
        var validationResult = validator.customMethods[i]();
        var elem = validationResult.element;
        var element;
        if (typeof  elem == "object" && elem instanceof jQuery) {
            element = elem;
        } else {
            element = $(elem);
        }
        if (validationResult.message != "") {
            validator.showErrors(element, validationResult.message);
            noErrors = false;
        } else {
            element.removeClass("error-field");
            element.next().remove();
        }
    }
    return noErrors;
};
/*
 The function shows inline errors for each field with errors. It attaches a new element next to the input element.
 @elem: input element to process on
 @errorMessage: message to be displayed in the UI
 */
validator.showErrors = function (elem, errorMessage) {
    var element;
    if (typeof  elem === "object" && elem instanceof jQuery) {
        element = elem;
    } else {
        element = $(elem);
    }
    if (errorMessage.length > 0) {
        if (element.next().hasClass('error')) {
            element.next().html(errorMessage);
        } else {
            element.addClass("error-field");
            element.after('<div class="error">' + errorMessage + '</div>');
        }
    } else {
        if (element.next().hasClass('error')) {
            element.removeClass("error-field");
            element.next().remove();
        }
    }
};
/*
 The function validate the form input elements
 @element: element to validate upon
 @return: returns true or false where true implies the element is valid.
 */
validator.validate = function (element) {
    var classes = $(element).attr('class').split(' ');
    var errorMessage = "";
    var validationResult;
    for (var i = 0; i < classes.length; i++) {
        if (/^validate-/g.test(classes[i])) {
            var validation = "";
            if (classes[i].split('validate-').length > 1) {
                validation = classes[i].split('validate-')[1];
            }
            for (var validateMethod in validator.validateMethods) {

                if (validator.validateMethods.hasOwnProperty(validateMethod)) {
                    if (validation == validateMethod) {
                        validationResult = validator.validateMethods[validateMethod](element);
                        if (validationResult != "") {
                            errorMessage += validationResult + "<br />";
                        }
                    }
                }
            }
        }
    }
    validator.showErrors(element, errorMessage);
    return errorMessage.length <= 0;
};
/*
 The function removes the validation events. ( Not use within the validate object. It can be use externally. )
 @form: form to do the validations on
 */
validator.removeValidationEvents = function (form) {
    var mainForm;
    if (typeof  form === "object" && form instanceof jQuery) {
        mainForm = form;
    } else {
        mainForm = $(form);
    }
    mainForm.off(validator.VALIDATED_EVENTS, '**');
    $('.error').remove();
    $('.error-field').removeClass("error-field");
};
/*
 The function initialize the validations on a html form element.
 @form: html form to do the validations on
 @submitCallback: execute a custom method to override the behavior when form submitting.
 */
validator.initValidationEvents = function (form, submitCallback) {
    var $form = typeof form === "string" ? $('#' + form) : form;
    $form.on(validator.VALIDATED_EVENTS, validator.VALIDATED_ELEMENTS, function (e) {
        var element = e.target;
        validator.validate(element);
    });
    if (!submitCallback) {
        $form.submit(function (e) {
            var formIsValid = validator.isValidForm($form);
            if (!formIsValid) {
                window.scrollTo(0, 0);
                e.preventDefault();
            }
        });
    } else {
        submitCallback();
    }
};
/*
 This function can be call to validate a form without submitting it.
 @form: html form to do the validations on
 @return: returns true or false where true implies the form is valid.
 */
validator.isValidForm = function (form) {
    var $form = typeof form === "string" ? $('#' + form) : form;
    var formIsValid = true;
    $(validator.VALIDATED_ELEMENTS, $form).each(function () {
        var fieldValid = validator.validate(this);
        formIsValid = formIsValid && fieldValid;
    });
    var customValidation = validator.validateCustom();
    return formIsValid && customValidation;
};
validator.addDefaultMethods();
