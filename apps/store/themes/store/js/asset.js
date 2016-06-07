$(function () {
    $('.action-container').on(
        {
            mouseenter: function () {
                $(this).find("i").removeClass().addClass("fa fa-remove");
            },
            mouseleave: function () {
                $(this).find("i").removeClass().addClass("fa fa-star");
            },
            click: function () {
                var elem = $(this);
                asset.unsubscribeBookmark(elem.data('type'), elem.data('aid'), location.href, elem);
            }
        },'#btn-remove-subscribe').on(
        {
            click: function () {
                var elem = $(this);
                asset.process(elem.data('type'), elem.data('aid'), location.href, elem);
            }
        },'#btn-add-gadget');


    $("a[data-toggle='tooltip']").tooltip();

    $('.embed-snippet').hide();

    $('.btn-embed').click(function () {
        $('.embed-snippet').toggle(400);
        return false;
    });

    var el = $('.user-rating'),
        rating = el.data('rating');
    $($('input', el)[rating - 1]).attr('checked', 'checked');

    $('.auto-submit-star').rating({
        callback: function (value, link) {
            if (value == undefined) {
                value = 0;
            }
            $('.rate-num-assert').html('(' + value + ')');
            caramel.post('/apis/rate', {
                asset: $('#assetp-tabs').data('aid'),
                value: value || 0
            }, function (data) {

            });
        }
    });

});
