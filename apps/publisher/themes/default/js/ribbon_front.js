$( document ).ready(function() {
    $("[data-toggle=popover]").popover();

    $(".ctrl-asset-type-switcher").popover({
        html : true,
        content: function() {
            return $('#content-asset-types').html();
        }
    });

    $('#nav').affix({
        offset: {
            top: $('header').height()
        }
    });
});
