$( document ).ready(function() {
    $("[data-toggle=popover]").popover();


    // Enabling Popover Example 2 - JS (hidden content and title capturing)
    $("#popoverExampleTwo").popover({
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
