var messages = {};
messages.alertSuccess = function(value){
    $.notify(value, {
        globalPosition: 'top center',
        className: 'success'
    });
};
messages.alertError = function(value){
    $.notify(value, {
        globalPosition: 'top center',
        className: 'error'
    });
};
messages.alertInfo = function(value){
    $.notify(value, {
        globalPosition: 'top center',
        className: 'info'
    });
};
messages.alertInfoLoader = function(value){
    var loadingImage = caramel.url('/themes/default/img/preloader-40x40.gif');
    value = '<img src="' + loadingImage + '" /> ' + value;
    $.notify(value, {
        globalPosition: 'top center',
        className: 'info'
    });
};
messages.alertWarn = function(value){
    var value = params.value;
    $.notify(value, {
        globalPosition: 'top center',
        className: 'warn'
    });
};
messages.alertWarn = function(value){
    var value = params.value;
    $.notify(value, {
        globalPosition: 'top center',
        className: 'warn'
    });
};