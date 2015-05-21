
$(function(){

    //$('[data-toggle="tooltip"]').tooltip();

    $("[data-toggle=popover]").popover();

    $(".ctrl-filter-type-switcher").popover({
        html : true,
        content: function() {
            return $('#content-filter-types').html();
        }
    });
});
