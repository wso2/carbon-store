$(function () {

    $('.no-bookmark').on('click', function () {
        $($(this).parents('[class^="ctrl-wr-asset"]').find(".confirmation-popup-container")).fadeOut();
    });

    $('.yes-bookmark').on('click', function () {
        var elem = $($(this).parents('[class^="ctrl-wr-asset"]').find(".js_bookmark"));
        asset.unsubscribeBookmark(elem.data('type'), elem.data('aid'), location.href, elem);
        $(this).parents('[class^="ctrl-wr-asset"]').fadeOut();

    });

    $('.js_bookmark').on(
        {
            click: function () {
                $($(this).parents('[class^="ctrl-wr-asset"]').find(".confirmation-popup-container")).fadeIn();
            }
        }, '.store-bookmarked').on(
        {
            click: function () {
                var elem = $(this).parent();
                asset.process(elem.data('type'), elem.data('aid'), location.href, elem);
            }
        }, '.store-bookmark');
});
