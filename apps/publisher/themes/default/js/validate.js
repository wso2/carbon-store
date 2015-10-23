var validator = {};
validator.validateMethods = {};

validator.addMethod = function (validation, callback) {
    validator.validateMethods[validation] = callback;
};
validator.addDefaultMethods = function () {
    validator.addMethod('required', function (element) {
        if ($(element).val().length > 0) {
            return "";
        } else {
            return $(element).attr('data-validate-required') || "Please enter a value.";
        }
    });
    validator.addMethod('regexp', function (element) {
        var regexpStr = $(element).attr('data-regexp') || '';
        var regexp = new RegExp(regexpStr);
        if (regexp.test($(element).val())) {
            return "";
        } else {
            return $(element).attr('data-validate-regexp') ||
                "Doesn't satisfy regular expression:" + $(element).attr('data-regexp');
        }

    })
};
validator.validate = function (element, callback) {
    var classes = $(element).attr('class').split(' ');
    var errorMessage = "";
    for (var i = 0; i < classes.length; i++) {
        if (/^validate-/g.test(classes[i])) {
            var validation = "";
            if (classes[i].split('validate-').length > 1) {
                validation = classes[i].split('validate-')[1];
            }
            for (var validateMethod in validator.validateMethods) {

                if (validator.validateMethods.hasOwnProperty(validateMethod)) {
                    if (validation == validateMethod) {
                        var validationResult = validator.validateMethods[validateMethod](element);
                        if (validationResult != "") {
                            errorMessage += validationResult + "<br />";
                        }
                    }
                }
            }
        }
    }

    if (errorMessage.length > 0) {
        if ($(element).next().hasClass('error')) {
            $(element).next().html(errorMessage);
        } else {
            $(element).after('<div class="error">' + errorMessage + '</div>');
        }
        return false;
    } else {
        if ($(element).next().hasClass('error')) {
            $(element).next().remove();
        }
        return true;
    }
};
validator.removeValidationEvents = function(form){
    var $form = typeof form == "string" ? $('#' + form) : form;
    $form.off('focus blur keyup change', '**');
    $('.error').remove();
};
validator.initValidationEvents = function (form, submitCallback) {
    var $form = typeof form == "string" ? $('#' + form) : form;
    $form.on('focus blur keyup change', 'input[type="text"],input[type="file"],textarea', function (e) {
        var element = e.target;
        validator.validate(element);
    });

    if(!submitCallback){
        $form.submit(function (e) {
            var formIsValid = validator.isValidForm($form);
            if (!formIsValid) {
                window.scrollTo(0, 0);
                e.preventDefault();
            }
        });
    }else{
        submitCallback();
    }
};
validator.isValidForm = function (form) {
    var $form = typeof form == "string" ? $('#' + form) : form;
    var formIsValid = true;
    $('input[type="text"],input[type="file"],textarea', $form).each(function () {
        var fieldValid = validator.validate(this);
        formIsValid = formIsValid && fieldValid;
    });
    return formIsValid;
};
validator.addDefaultMethods();