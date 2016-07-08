var asset = {};

(function (asset) {
    var PROCESSING_TEXT = "processing";
    var SUCCESS_TEXT =  "success";
    var ERROR_TEXT = "error";
    var getText = function(key) {
        return $('#main-bookmark').data(key);
    };
    asset.process = function (type, path, destination, elem) {
        if (!store.user) {
            $('#modal-login').modal('show');
            return;
        }
        $(elem).find("i").removeClass().addClass('fa fa-spinner fa-spin');
        $(elem).find('#main-bookmark').html(getText(PROCESSING_TEXT));
        $(elem).unbind('click');
        $.ajax({
            url: caramel.url('/apis/subscriptions'),
            data: {type: type, asset: path, destination: encodeURIComponent(location.href)},
            method: 'POST',
            success: function (data) {
                messages.alertSuccess(getText(SUCCESS_TEXT));
                window.location.href=destination;
            },
            error: function () {
                messages.alertError(getText(ERROR_TEXT));
                $('i', elem).removeClass().addClass('fw fw-bookmark store-bookmark');
            }
        });
    };

    asset.unsubscribeBookmark = function (type, path, destination, elem) {
        if (!store.user) {
            $('#modal-login').modal('show');
            return;
        }
        $(elem).find("i").removeClass().addClass('fa fa-spinner fa-spin');
        $(elem).find('#main-bookmark').html(getText(PROCESSING_TEXT));
        $.ajax({
            url: caramel.url('/apis/subscriptions') + '?type=' + type + '&asset=' + path,
            method: 'DELETE',
            dataType: 'text json',
            success: function (data) {
                messages.alertSuccess(getText(SUCCESS_TEXT));
                $('i', elem).removeClass().addClass('fw fw-bookmark store-bookmark');
                $(elem).parents('[class^="ctrl-wr-asset"]').fadeOut();
                if ($(elem).find('#main-bookmark').length > 0) {
                    $(elem).find("i").removeClass().addClass('fw fw-bookmark');
                    $(elem).find('#main-bookmark').html("Bookmark");
                    $(elem).attr('id', 'btn-add-gadget');
                }
            },
            error: function (data) {
                var parent = $(elem).parents('[class^="ctrl-wr-asset"]');
                messages.alertError(getText(ERROR_TEXT));
                $(parent.find(".confirmation-popup-container")).fadeOut();
                parent.find('.btn-group').show();
                parent.find('#bookmark-animation').hide();
                $('i', elem).removeClass().addClass('fw fw-bookmark store-bookmarked');
            }
        });
    };

     /*
    We rewrite the url with sorting meta data.This is needed to support
    the way we filter taxonomy without a page reload
     */
    $('.sorting-option').on('click', function(e) {
        e.preventDefault();
        var sortOptions = {};
        sortOptions.sortBy = $(this).data('sortByQuery');
        sortOptions.sort = $(this).data('sortQuery');
        window.location= enrichUrlWithSortParams(window.location.href, sortOptions)
    });

    /*
    The function adds the sorting properties provided in the sorting options into
    the provided URL
     */
    function enrichUrlWithSortParams(url, sortOptions) {
        var sortByPattern = /sortBy=([^&;]+)/;
        var sortPattern = /sort=([^&;]+)/;
        var matchedSortByPattern = url.match(sortByPattern);
        var matchedSortPattern = url.match(sortPattern);
        var hasSortBy = !!matchedSortByPattern;
        var hasSort = !!matchedSortPattern;
        //Encode any provided sort option values
        Object.keys(sortOptions).forEach(function(key) {
            sortOptions[key] = encodeURIComponent(sortOptions[key]);
        });
        //Handle replacing any existing sort and sortBy values
        if ((hasSort) && (sortOptions.sort)) {
            url = url.replace(sortPattern, 'sort=' + sortOptions.sort);
        }
        if ((hasSortBy) && (sortOptions.sortBy)) {
            url = url.replace(sortByPattern, 'sortBy=' + sortOptions.sortBy);
        }
        //Check if there is atleast one query parameter
        var hasExistingQueryParams = url.indexOf('?') > -1;
        var newQueryParams = [];
        if (!hasExistingQueryParams) {
            url += '?';
        }
        //Handle adding sort when it does not exist in the url
        if (!hasSort) {
            newQueryParams.push('sort=' + sortOptions.sort);
        }
        if (!hasSortBy) {
            newQueryParams.push('sortBy=' + sortOptions.sortBy);
        }
        if (newQueryParams.length > 0) {
            if (hasExistingQueryParams) {
                url += '&';
            }
            url += newQueryParams.join('&');
        }
        return url;
    }
}(asset));