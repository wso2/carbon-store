var asset = {};

(function (asset) {
    asset.process = function (type, path, destination, elem) {
        if(!store.user) {
            $('#modal-login').modal('show');
            return;
        }
        $(elem).find('.sub-bookmark').addClass('fa fa-spinner fa-spin');
        $.ajax({
            url: caramel.url('/apis/subscriptions'),
            data: {type: type, asset: path, destination: encodeURIComponent(location.href)},
            method:'POST',
            success: function (data) {
                messages.alertSuccess("Successfully subscribed to asset");
                $('i',elem).removeClass('store-bookmark').addClass('store-bookmarked');
            },
            error: function () {
                $(elem).find('.sub-bookmark').removeClass('fa fa-spinner fa-spin');
            }
        });
        //location.href = caramel.context + '/apis/subscriptions?type=' + type + '&asset=' + path + '&destination=' + encodeURIComponent(location.href);
    };

    asset.unsubscribeBookmark = function (type, path, destination, elem) {
        if(!store.user) {
            $('#modal-login').modal('show');
            return;
        }
        $(elem).find('.sub-bookmark').addClass('fa fa-spinner fa-spin');
        $.ajax({
            url: caramel.url('/apis/subscriptions') + '?type=' + type + '&asset=' + path,
            method:'DELETE',
            success: function (data) {
                location.href = destination;
            },
            error: function () {
                $(elem).find('.sub-bookmark').removeClass('fa fa-spinner fa-spin');
            }
        });
    };
}(asset));