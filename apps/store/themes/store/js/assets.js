/*
 * Copyright (c) 2014, WSO2 Inc. (http://wso2.com) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 var timer;
 var details;
 ;
 */
store.rows_added = 0;
store.last_to = 0;
store.items_per_row = 0;
store.doPagination = true;
store.firstRun = true;
store.infiniteScroll ={};
store.infiniteScroll.recalculateRowsAdded = function(){
    return (store.last_to - store.last_to%store.items_per_row)/store.items_per_row;
};
store.infiniteScroll.addItemsToPage = function(cb){
    var screen_width = $(window).width();
    var screen_height = $(window).height();


    var header_height = 163;
    var thumb_width = 170;
    var thumb_height = 280;
    var gutter_width = 20;

    screen_width = screen_width - gutter_width; // reduce the padding from the screen size
    screen_height = screen_height - header_height;

    store.items_per_row = (screen_width-screen_width%thumb_width)/thumb_width;
    //var rows_per_page = (screen_height-screen_height%thumb_height)/thumb_height;
    var scroll_pos = $(document).scrollTop();
    var row_current =  (screen_height+scroll_pos-(screen_height+scroll_pos)%thumb_height)/thumb_height;
    row_current +=3 ; // We increase the row current by 2 since we need to provide one additional row to scroll down without loading it from backend


    var from = 0;
    var to = 0;
    if(row_current > store.rows_added && store.doPagination){
        from = store.rows_added * store.items_per_row;
        to = row_current*store.items_per_row;
        store.last_to = to; //We store this os we can recalculate rows_added when resolution change
        store.rows_added = row_current;

        store.infiniteScroll.getItems(from,to,cb);

    }

};

store.infiniteScroll.getItems = function(from,to,cb){
    cb = cb ? cb : function(){};
    var count = to-from;
    var dynamicData = {};
    dynamicData["from"] = from;
    dynamicData["to"] = to;
    var path = window.location.href; //current page path
    // Returns the jQuery ajax method
    var url = caramel.tenantedUrl(store.asset.paging.url+"&paginationLimit=" + to + "&start="+from+"&count="+count+store.infiniteScroll.setQueryParams(path));

    if(!store.firstRun) {
        caramel.render('loading', 'Loading assets.', function (info, content) {
            $('.loading-animation-big').remove();
            $('body').append($(content));
            $('.loading-animation-big').css('bottom','48px').css('left','0');
        });
    } else {
        store.firstRun = false;
    }
    caramel.data({
        title : null,
        body : ['assets']
    }, {
        url : url,
        success : function(data, status, xhr) {
            if(data.body.assets.context.assets.length == 0) store.doPagination = false;
            caramel.partials(data._.partials, function() {
                caramel.render('assets-thumbnails', data.body.assets.context, function (info, content) {
                    $('.assets-container section').show();
                    $('.assets-container section').append($(content));
                    if(data.body.assets.context.assets.length != 0){
                        $('.top-assets-empty-assert').remove();
                    }
                    if (data.body.assets.context.assets.length > 1) {
                        $('.sort-asset-container').show();
                    } else if ($('.assets-container div.ctrl-wr-asset').length > 1) {
                        $('.sort-asset-container').show();
                    } else {
                        $('.sort-asset-container').hide();
                    }
                    $('.loading-animation-big').remove();
                });
                if(data.body.assets.context.assets.length == 0
                    && (!$('.assets-container section').html() || ($('.assets-container section').html()
                    && $('.assets-container section').html().trim() == ''))){
                    caramel.render('assets', data.body.assets.context, function (info, content) {
                        if($('.assets-container').html().indexOf('top-assets-empty-assert') <= -1){
                            if(store.user){
                                $('.assets-container').
                                    append("<div class='top-assets-empty-assert'>There are no assets available</div>");
                            } else {
                                $('.assets-container').
                                    append("<div class='top-assets-empty-assert'>There are no publicly available assets." +
                                    " Please login to access your assets</div>");
                            }
                            $('.sort-asset-container').hide();
                        }
                    });
                }
            });
            cb(data,status);
        },
        error : function(xhr, status, error) {
            $('.loading-animation-big').remove();
            store.doPagination = false;
            cb({},status,error);
        },
        cache : false
    });
    //}

};
store.infiniteScroll.showAll = function(){
    store.infiniteScroll.addItemsToPage();
    $(window).scroll(function(){
        store.infiniteScroll.addItemsToPage();
    });
    $(window).resize(function () {
        //recalculate "rows_added"
        store.rows_added = store.infiniteScroll.recalculateRowsAdded();
        store.infiniteScroll.addItemsToPage();
    });
};
/**
 * Build query parameters based on page path
 * @param {string} path  : string
 */
store.infiniteScroll.setQueryParams = function(path) {
    var query = '';
    var obj = path.split('?');
    if(obj[1]){
        var params = obj[1].split("&");
        for(var j=0; j<params.length;j++){
            var paramsPart = params[j];
            if(paramsPart.indexOf("q=") != -1){
                query = '&&' + paramsPart;
            }
        }
    }
    return query;
};
$(function() {
    /*
     * Bookmark event handler
     * */
    $('#assets-container').on('click', '.js_bookmark', function () {
        var elem = $(this);
        asset.process(elem.data('type'), elem.data('aid'), location.href, elem);
    });

    /*
     * subscribe button event handler
     * */
    $(document).on('click', '#assets-container .asset-add-btn', function(event) {
        var parent = $(this).parent().parent().parent();
        asset.process(parent.data('type'), parent.data('id'), location.href, parent);
        event.stopPropagation();
    });
    /*
     * Sort button event handler
     * */
    $('#sortDropdown').click(function(e){
        e.preventDefault();
    });
    /*
     * Pagination for listing page
     * */
    $('.assets-container section .ctrl-wr-asset').remove();
    store.infiniteScroll.showAll();
    caramel.loaded('js', 'assets');
    caramel.loaded('js', 'sort-assets');
});
