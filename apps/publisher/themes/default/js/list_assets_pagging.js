var rows_added = 0;
var last_to = 0;
var items_per_row = 0;
var doPagination = true;
store.infiniteScroll = {};
store.infiniteScroll.recalculateRowsAdded = function () {
    return (last_to - last_to % items_per_row) / items_per_row;
};
store.infiniteScroll.addItemsToPage = function () {
    var screen_width = $(window).width();
    var screen_height = $(window).height();
    var thumb_width = 170;
    var thumb_height = 280;
    var gutter_width = 20;
    var header_height = 163;
    screen_width = screen_width - gutter_width; // reduce the padding from the screen size
    screen_height = screen_height - header_height;
    items_per_row = (screen_width - screen_width % thumb_width) / thumb_width;
    //var rows_per_page = (screen_height-screen_height%thumb_height)/thumb_height;
    var scroll_pos = $(document).scrollTop();
    var row_current = Math.floor((screen_height + scroll_pos - header_height) / thumb_height);
    row_current = row_current + 3; // We increase the row current by 2 since we need to provide one additional row to scroll down without loading it from backend
    var from = 0;
    var to = 0;
    if (row_current > rows_added && doPagination) {
        from = rows_added * items_per_row;
        to = row_current * items_per_row;
        last_to = to; //We store this os we can recalculate rows_added when resolution change
        rows_added = row_current;
        console.info("from = " + from + " count = " + (to - from) + " row_current = ", row_current + " screen_height = " + screen_height + " scroll_pos = " + scroll_pos + " thumb_height = " + thumb_height);
        store.infiniteScroll.getItems(from, to);
    }
};
var partialsLoaded = false;
store.infiniteScroll.getItems = function (from, to) {
    var count = to - from;
    var dynamicData = {};
    dynamicData["from"] = from;
    dynamicData["to"] = to;
    // Returns the jQuery ajax method
    var path = window.location.href; //current page path
    var param = '&&paginationLimit=' + to + '&&start=' + from + '&&count=' + count + setSortingParams(path) + setQueryParams(path);
    var assetType = store.publisher.type; //load type from store global object
    var url = '/publisher/apis/assets?type=' + assetType + param; // build url for the endpoint call
    //var url = caramel.tenantedUrl(store.asset.paging.url+"&start="+from+"&count="+count);     //TODO enable tenanted url thing..
    var loadAssets = function () {
        $.ajax({
            url: url,
            type: 'GET',
            headers: {
                Accept: "application/json; charset=utf-8"
            },
            success: function (response) { //on success
                var assets = convertTimeToUTC(response.list);
                if (assets) {
                    caramel.render('list_assets_table_body', assets, function (info, content) {
                        $('#list_assets_content').append(content);
                    });
                } else { //if no assets retrieved for this page
                    doPagination = false;
                }
            },
            error: function (response) { //on error
                doPagination = false;
            }
        });
    };
    if (partialsLoaded) {
        loadAssets();
        return;
    }
    var initialUrl = '/publisher/assets/' + assetType + '/list';
    caramel.data({
        "title": null,
        "listassets": ["list-assets"]
    }, {
        url: initialUrl,
        success: function (data, status, xhr) {
            caramel.partials(data._.partials, function () {
                partialsLoaded = true;
                loadAssets();
            });
        },
        error: function (xhr, status, error) {
            doPagination = false;
        }
    });
};
store.infiniteScroll.showAll = function () {
    $('.assets-container section').empty();
    store.infiniteScroll.addItemsToPage();
    $(window).scroll(function () {
        store.infiniteScroll.addItemsToPage();
    });
    $(window).resize(function () {
        //recalculate "rows_added"
        rows_added = store.infiniteScroll.recalculateRowsAdded();
        store.infiniteScroll.addItemsToPage();
    });
};
$(function () {
    /*
     * Pagination for listing page
     * */
    store.infiniteScroll.showAll();
});