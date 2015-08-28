$(function(){
    $('.js_bookmark').click(function () {
        var elem = $(this);
        asset.process(elem.data('type'), elem.data('aid'), location.href, elem);
    });

});
