var asset = {};

(function (asset) {
    var PROCESSING_TEXT = "processing";
    var SUCCESS_TEXT =  "success";
    var ERROR_TEXT = "error";
    var getText = function (key) {
        var bookmarkData = $('.main-bookmark');
        var text = "A message was not defined for " + key + " please check process-asset templates";
        if (bookmarkData.length) {
            text = bookmarkData.first().data(key);
        }
        return text;
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
    We calculate the URL dynamically  by removing the tags expression from the query
     */
    $('.es-asset-tag').on('click', function(e) {
        e.preventDefault();
        var url = window.location.href;
        url = buildTagURL(url);
        window.location = url;
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
        //Do not alter the query if there are no sort options
        if (Object.keys(sortOptions).length < 1) {
            return url;
        }
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
        //We did not add any new query paramters
        if (newQueryParams.length < 1) {
            return url;
        }
        //Integrate any newly added sort parameters to the URL
        var urlComponents = url.split('?');
        var urlWithoutQueryParams = urlComponents.slice(0, 1);
        var urlWithQueryParams = urlComponents.slice(1);
        //Check if there are no query params and create an empty array
        if ((urlWithQueryParams.length === 1) && (urlWithQueryParams[0] === '')) {
            urlWithQueryParams = [];
        }
        return urlWithoutQueryParams.concat(newQueryParams.concat(urlWithQueryParams).join('&')).join('?');
    }

    /**
     * Removes the tags query from the URL
     * @param  {[type]} url [description]
     * @return {[type]}     [description]
     */
    function buildTagURL(url) {
        var decodedURI = decodeURIComponent(url);
        //Split by ?
        var splitURI = decodedURI.split('?');
        var uri = splitURI.slice(0, 1);
        var queryParams = splitURI.slice(1) || '';
        queryParams = (queryParams.length === 0) ? '' : queryParams[0];
        queryParams = queryParams.split('&');
        var qIndex = -1;
        var qTagsIndex = -1;
        queryParams.forEach(function(query, index) {
            qIndex = (query.indexOf('q=') > -1) ? index : qIndex;
        });
        var q = [];
        if (qIndex > -1) {
            q = queryParams[qIndex].replace('q=', '').split(',');
        }
        q.forEach(function(kvPair, index) {
            qTagsIndex = (kvPair.indexOf('tags') > -1) ? index : qTagsIndex;
        });
        if (qTagsIndex > -1) {
            q.splice(qTagsIndex, 1);
        }
        //Remove the existing query
        if (qIndex > -1) {
            queryParams.splice(qIndex);
            var qvalue = q.join(',');
            q = (qvalue === '') ? [] : ['q=' + qvalue];
        }
        q = ((q.length === 1) && (q[0] === '')) ? [] : q;
        var newQueryParams = [queryParams.concat(q).join('&')];
        newQueryParams = ((newQueryParams.length === 1) && (newQueryParams[0] === '')) ? [] : newQueryParams;
        return uri.concat(newQueryParams).join('?');
    }

    $('.assets-show-more').click(function(){
        $(this).toggle();
        $('.assets-show-less').toggle();
        $('.navigation .all-item').show();
    });

    $('.assets-show-less').click(function(){
        $(this).toggle();
        $('.assets-show-more').toggle();
        $('.navigation .all-item').each(function(){
            if(!$(this).attr('data-selected')){
                $(this).hide();
            }
        });
    });


}(asset));