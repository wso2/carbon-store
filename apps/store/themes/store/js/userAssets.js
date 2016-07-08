$(function () {

    $('.no-bookmark').on('click', function () {
        $($(this).parents('[class^="ctrl-wr-asset"]').find(".confirmation-popup-container")).fadeOut();
    });

    $('.yes-bookmark').on('click', function () {
        var parent = $(this).parents('[class^="ctrl-wr-asset"]');
        var elem = $(parent.find(".js_bookmark"));
        parent.find('.btn-group').hide();
        parent.find('#bookmark-animation').show();
        asset.unsubscribeBookmark(elem.data('type'), elem.data('aid'), location.href, elem);
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
