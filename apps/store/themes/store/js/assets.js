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

//TODO: add delay before opening more details
/*
 var timer;
 var details;
 ;
 */
var rows_added = 0;
var last_to = 0;
var doPagination = true;
store.infiniteScroll ={};

store.infiniteScroll.addItemsToPage = function(){
    /*
     clean the counted rows from the session
     fist time load the viewable number of rows to the screen rows_per_page
     - Data for this are viewable width and height in the screen ( screen_width, screen_height)
     keep the rows counted in the session   (rows_added)

     calculate the row suppose to be displayed (row_current)
     -  rows_per_page and scroll position (scroll_pos)

     if(row_current > rows_added ) then
     - do a call to get the remaining rows and append them

     */
    var screen_width = $(window).width();
    var screen_height = $(window).height();

    var thumb_width = 170;
    var thumb_height = 270;

    var menu_width = 0;
    var header_height = 163;
    if($('#leftmenu').is(":visible")){
        screen_width = screen_width - menu_width;
    }
    screen_height = screen_height - header_height;

    var items_per_row = (screen_width-screen_width%thumb_width)/thumb_width;
    var rows_per_page = (screen_height-screen_height%thumb_height)/thumb_height;
    var scroll_pos = $(document).scrollTop();
    var row_current =  (screen_height+scroll_pos-(screen_height+scroll_pos)%thumb_height)/thumb_height;
    row_current++; // We increase the row current by 1 since we need to provide one additional row to scroll down without loading it from backend
    store.infiniteScroll.recalculateRowsAdded = function(){
        return (last_to - last_to%items_per_row)/items_per_row;
    };

    var from = 0;
    var to = 0;
    console.info("***************");
    console.info(row_current);
    console.info(rows_added);
    if(row_current > rows_added && doPagination){
        from = rows_added * items_per_row;
        to = row_current*items_per_row;
        last_to = to; //We store this os we can recalculate rows_added when resolution change
        rows_added = row_current;
        console.info(from,to);
        console.info("***************");
        store.infiniteScroll.getItems(from,to);


    }

};

store.infiniteScroll.getItems = function(from,to){
    var count = to-from;
    var dynamicData = {};
    dynamicData["from"] = from;
    dynamicData["to"] = to;
    // Returns the jQuery ajax method
    var url = caramel.tenantedUrl(store.asset.paging.url+"&start="+from+"&count="+count);
    if(url.indexOf('tag')== -1){
        caramel.data({
                         title : null,
                         body : ['assets']
                     }, {
                         url : url,
                         success : function(data, status, xhr) {
                             caramel.render('assets', data.body.assets.context, function(info,content){
                                 $('.assets-container section').append(content);
                             });
                         },
                         error : function(xhr, status, error) {
                             doPagination = false;
                         }
                     });
    }

};
store.infiniteScroll.showAll = function(){
    $('.assets-container section').empty();
    store.infiniteScroll.addItemsToPage();
    $(window).scroll(function(){
        store.infiniteScroll.addItemsToPage();
    });
    $(window).resize(function () {
        //recalculate "rows_added"
        rows_added = store.infiniteScroll.recalculateRowsAdded();
        store.infiniteScroll.addItemsToPage();
    });
};
$(function() {
    /*
    * Bookmark event handler
    * */
    $('.js_bookmark').click(function () {
        var elem = $(this);
        asset.process(elem.data('type'), elem.data('aid'), location.href);
    });

    /*
    * subscribe button event handler
    * */
	$(document).on('click', '#assets-container .asset-add-btn', function(event) {
		var parent = $(this).parent().parent().parent();
		asset.process(parent.data('type'), parent.data('id'), location.href);
		event.stopPropagation();
	});
    /*
    * Sort button event handler
    * */
    $(document).on('click', '#ul-sort-assets li a', function(e) {
        currentPage = 1;
        $('#ul-sort-assets li a').removeClass('selected-type');
        var thiz = $(this);
        thiz.addClass('selected-type');
        loadAssets(thiz.attr('href'));
        mouseStop();
        e.preventDefault();
    });
    /*
    * Pagination for listing page
    * */
    store.infiniteScroll.showAll();
	var loadAssetsScroll = function(url) {
		//TO-DO
		/* As tags are not Indexing so far
		*  Assert pagination and is not supporteed and There for infiniteScroll is disable to 'Tag'
		* */
		if(url.indexOf('tag')== -1){
		caramel.data({
			title : null,
			body : ['assets']
		}, {
			url : url,
			success : function(data, status, xhr) {
                infiniteScroll = data.body.assets.context.assets.length >= 12;
                currentPag = 1;
				renderAssetsScroll(data);
				$('.loading-inf-scroll').hide();
			},
			error : function(xhr, status, error) {
                infiniteScroll = false;
			}
		});
		$('.loading-inf-scroll').show();
		}
	};
	var scroll = function() {
		if(infiniteScroll || (store.asset.paging.size >= 12 && infiniteScroll == null)) {
			if($(window).scrollTop() + $(window).height() >= $(document).height() * .8) {
				var assetCount = (++store.asset.count)*12;
				var url = caramel.tenantedUrl(store.asset.paging.url+"&start="+assetCount+"&count="+12);
				loadAssetsScroll(url);
				$(window).unbind('scroll', scroll);
				setTimeout(function() {
					$(window).bind('scroll', scroll);
				}, 500);
			}
		} else {
			$('.loading-inf-scroll').hide();
		}
	};
	caramel.loaded('js', 'assets');
	caramel.loaded('js', 'sort-assets');
});
