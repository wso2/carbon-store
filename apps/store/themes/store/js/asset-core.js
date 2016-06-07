var asset = {};

(function (asset) {
    asset.process = function (type, path, destination, elem) {
        if (!store.user) {
            $('#modal-login').modal('show');
            return;
        }
        $(elem).find("i").removeClass().addClass('fa fa-spinner fa-spin');
        $(elem).find('#main-bookmark').html(" Adding...");
        $(elem).unbind('click');
        $.ajax({
            url: caramel.url('/apis/subscriptions'),
            data: {type: type, asset: path, destination: encodeURIComponent(location.href)},
            method: 'POST',
            success: function (data) {
                messages.alertSuccess("Successfully subscribed to asset");
                $(elem).find("i").removeClass().addClass('fa fa-star');
                $(elem).find('#main-bookmark').html("Bookmarked");
                $(elem).click(function () {
                    var elem = $(this);
                    asset.unsubscribeBookmark(elem.data('type'), elem.data('aid'), location.href, elem);
                });
                $(elem).attr('id', 'btn-remove-subscribe');
            },
            error: function () {
                messages.alertError("Failed to bookmark this asset!");
            }
        });
        //location.href = caramel.context + '/apis/subscriptions?type=' + type + '&asset=' + path + '&destination=' + encodeURIComponent(location.href);
    };

    asset.unsubscribeBookmark = function (type, path, destination, elem) {
        if (!store.user) {
            $('#modal-login').modal('show');
            return;
        }
        $(elem).find("i").removeClass().addClass('fa fa-spinner fa-spin');
        $(elem).find('#main-bookmark').html(" Removing...");
        $(elem).unbind('click');
        $.ajax({
            url: caramel.url('/apis/subscriptions') + '?type=' + type + '&asset=' + path,
            method: 'DELETE',
            dataType: 'text json',
            success: function (data) {
                messages.alertSuccess("Successfully un-subscribed to asset");
                $(elem).find("i").removeClass().addClass('fw fw-bookmark');
                $(elem).find('#main-bookmark').html("Bookmark");
                $(elem).click(function () {
                    var elem = $(this);
                    asset.process(elem.data('type'), elem.data('aid'), location.href, elem);
                }).attr('id', 'btn-add-gadget');
            },
            error: function (data) {
                messages.alertError("Failed to un-bookmark this asset!");
                $(elem).find('i').removeClass();
                $(elem).unbind('click').css("background-color", "rgba(213, 35, 35, 0.78)");
                $(elem).find('#main-bookmark').html("Error!");
            }
        });
    };
}(asset));