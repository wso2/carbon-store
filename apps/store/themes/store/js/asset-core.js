var asset = {};

(function (asset) {
    asset.process = function (type, path, destination) {
        if(!store.user) {
            $('#modal-login').modal('show');
            return;
        }
        //location.href = caramel.context + '/extensions/assets/' + type + '/process?asset=' + path + '&destination=' + encodeURIComponent(location.href);
        location.href = caramel.context + '/apis/subscriptions?type=' + type + '&asset=' + path + '&destination=' + encodeURIComponent(location.href);
    };

    asset.unsubscribeBookmark = function (type, path, destination) {
        if(!store.user) {
            $('#modal-login').modal('show');
            return;
        }
        $.ajax({
            url: caramel.url('/apis/subscriptions') + '?type=' + type + '&asset=' + path,
            method:'DELETE',
            success: function (data) {
                location.href = destination;
            },
            error: function () {
                console.log('error');
            }
        });
    };
}(asset));