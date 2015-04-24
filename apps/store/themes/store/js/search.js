/*
 * Copyright (c) WSO2 Inc. (http://wso2.com) All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

$(function () {
    History.Adapter.bind(window, 'statechange', function () {
        var state = History.getState();
        if (state.data.id === 'sort-assets') {
            renderAssets(state.data.context);
        } else if (state.data.id === 'top-assets') {
            var el = $('.store-left'), data = state.data.context;
            //caramel.css($('head'), data.header['sort-assets'].resources.css, 'sort-assets');
            //caramel.code($('head'), data.body['assets'].resources.code);
            async.parallel({
                topAssets: function (callback) {
                    caramel.render('top-assets', data.body['top-assets'].context, callback);
                }
            }, function (err, result) {
                theme.loaded(el, result.sort);
                el.html(result.topAssets);
                $(".assetSlider").carouFredSel({
                    items: 4,
                    width: "100%",
                    infinite: false,
                    auto: false,
                    circular: false,
                    pagination: ".assetSliderPag"

                });
                mouseStop();
                /*el.append(result.paging);
                 caramel.js($('body'), data.body['assets'].resources.js, 'assets', function () {
                 mouseStop();
                 });
                 caramel.js($('body'), data.header['sort-assets'].resources.js, 'sort-assets', function () {
                 updateSortUI();
                 });*/
                $(document).scrollTop(0);
            });
        }
    });

    /*
     var search = function () {
     var url;
     currentPage = 1;
     if (store.asset) {
     url = caramel.url('/assets/' + store.asset.type + '/?query=' + $('#search').val());
     caramel.data({
     title: null,
     header: ['sort-assets'],
     body: ['assets', 'pagination']
     }, {
     url: url,
     success: function (data, status, xhr) {
     //TODO: Integrate a new History.js library to fix this
     if ($.browser.msie == true && $.browser.version < 10) {
     renderAssets(data);
     } else {
     History.pushState({
     id: 'sort-assets',
     context: data
     }, document.title, url);
     }
     },
     error: function (xhr, status, error) {
     theme.loaded($('#assets-container').parent(), '<p>Error while retrieving data.</p>');
     }
     });
     theme.loading($('#assets-container').parent());
     } else if ($('#search').val().length > 0 && $('#search').val() != undefined) {
     url = caramel.url('/assets/all/?query=' + $('#search').val());
     caramel.data({
     title: null,
     body: ['top-assets']
     }, {
     url: url,
     success: function (data, status, xhr) {
     //TODO: Integrate a new History.js library to fix this
     if ($.browser.msie == true && $.browser.version < 10) {
     renderAssets(data);
     } else {
     History.pushState({
     id: 'top-assets',
     context: data
     }, document.title, url);
     }
     },
     error: function (xhr, status, error) {
     theme.loaded($('#assets-container').parent(), '<p>Error while retrieving data.</p>');
     }
     });
     theme.loading($('#assets-container').parent());
     }
     };
     */

    var buildParams = function (query) {
        return 'q=' + query;
    };

    /**
     * The function builds a json object with fields containing values
     * @param  {[type]} containerId [description]
     * @return {[type]}             [description]
     */
    var getSearchFields = function (containerId) {
        var q = {};
        var output = '';
        var searchQuery ='';
        //Check if the user has only entered a search term in the search box and not
        //used the advanced search
        if(!$('#search-dropdown-cont').is(':visible')){
            searchQuery = $('#search').val();
            if(searchQuery !== ''){
                output = '"name":"'+searchQuery+'"';
            }
            return output;
        }

        $inputs = $(containerId + ' :input');
        $inputs.each(function () {
            if ((this.name != undefined) && (this.name != '') && (this.value) && (this.value != '')) {
                output += '"' + this.name + '": ' + '"' + $(this).val() + '",';
            }
            //q[this.name]=$(this).val();
        });
        //Check if the the user has only entered text
        if (output === '') {
            searchQuery = $('#search').val();
            if (searchQuery !== '') {
                output = '"overview_name":"' + searchQuery + '"';
            }
        }
        return output;//JSON.stringify(q);
    };

    var search = function () {
        var url, searchVal = getSearchFields('#search-dropdown-cont');//$('#search').val();
        //var url, searchVal = test($('#search').val());
        currentPage = 1;
        var path = window.location.href;//current page path
        if (store.asset) {
            if(path.match('/t/')){
                var regex = '/t/{1}([0-9A-Za-z-\\.@:%_\+~#=]+)';
                var domain = path.match(regex)[1];
                url = caramel.url('/t/'+ domain +'/asts/' + store.asset.type + '/list?' + buildParams(searchVal));
            }else{
                url = caramel.url('/asts/' + store.asset.type + '/list?' + buildParams(searchVal));
            }
            caramel.data({
                title: null,
                header: ['header'],
                body: ['assets', 'sort-assets']
            }, {
                url: url,
                success: function (data, status, xhr) {
                    //TODO: Integrate a new History.js library to fix this
                    if ($.browser.msie == true && $.browser.version < 10) {
                        renderAssets(data);
                    } else {
                        History.pushState({
                            id: 'sort-assets',
                            context: data
                        }, document.title, url);
                    }
                },
                error: function (xhr, status, error) {
                    theme.loaded($('#assets-container').parent(), '<p>Error while retrieving data.</p>');
                }
            });
            theme.loading($('#assets-container').parent());
        } else if (searchVal.length > 0 && searchVal != undefined) {
            if(path.match('/t/')){
                var regex = '/t/{1}([0-9A-Za-z-\\.@:%_\+~#=]+)';
                var domain = path.match(regex)[1];
                url = caramel.url('/t/'+ domain +'/?' + buildParams(searchVal));
            } else {
                url = caramel.url('/?' + buildParams(searchVal));
            }
            window.location = url;
            //TODO: The top assets page should render results without causing a page reload
            /*caramel.data({
             title: null,
             header: ['header'],
             body: ['top-assets', 'navigation', 'sort-assets']
             }, {
             url: url,
             success: function (data, status, xhr) {
             //TODO: Integrate a new History.js library to fix this
             if ($.browser.msie == true && $.browser.version < 10) {
             renderAssets(data);
             } else {
             History.pushState({
             id: 'top-assets',
             context: data
             }, document.title, url);
             }
             },
             error: function (xhr, status, error) {
             theme.loaded($('#assets-container').parent(), '<p>Error while retrieving data.</p>');
             }
             });
             theme.loading($('#assets-container').parent());*/
        }

        $('.search-bar h2').find('.page').text(' / Search: "' + searchVal + '"');
    };

    $('#search-dropdown-cont').ontoggle = function ($, divobj, state) {
        var icon = $('#search-dropdown-arrow').find('i'), cls = icon.attr('class');
        icon.removeClass().addClass(cls == 'icon-sort-down' ? 'icon-sort-up' : 'icon-sort-down');
    }

    $('#search').keypress(function (e) {
        if (e.keyCode === 13) {
            if ($('#search-dropdown-cont').is(':visible')) {
                $('#search').val('');
                makeQuery();
            }
            search();
        } else if (e.keyCode == 27) {

            $('#search-dropdown-cont').toggle();
        }

    })
        .click(function (e) {
            if ($('#search-dropdown-cont').hasClass('search-dropdown-cont-single')) {
                $(this).animate({width: '1170px'}, 100);
            } else {
                $(this).animate({width: '500px'}, 100);
            }
            e.stopPropagation();
        });
    /*
     .blur(function(){
     $(this).animate({width:'100%'});
     })*/


    $(document).click(function () {
        $('#search').animate({width: '100%'});
    });
    /*
     $('#search').blur(function(){
     $(this).fadeOut();
     $('#search-button').fadeIn("fast");
     });*/

    $('#search-button').click(function () {
        if ($('#search').val() == '') return;
        if ($('#search-dropdown-cont').is(':visible')) {
            $('#search').val('');
            makeQuery();
        }
        search();
        /*
         $(this).fadeOut("fast", function(){
         $('#search').fadeIn("fast").focus();
         });*/
    });

    $('#search-dropdown-arrow').click(function (e) {
        e.stopPropagation();
        e.preventDefault();
        var icon = $(this).find('i'), cls = icon.attr('class');
        icon.removeClass().addClass(cls == 'icon-sort-down' ? 'icon-sort-up' : 'icon-sort-down');
        if ($('#search').val().length > 0) {
            if ($('#search').val().indexOf(',')) {
                var qarray = $('#search').val().split(",");
                if (qarray.length > 0) {
                    $('#search-dropdown-cont').children('div').each(function () {
                        var $this = $(this);
                        $this.find('input').val('')

                    });
                    for (var i = 0; i < qarray.length; i++) {
                        $('#search-dropdown-cont').children('div').each(function () {
                            var $this = $(this);
                            var idVal = $this.find('input').attr('id').toLowerCase();
                            if (idVal == qarray[i].split(':')[0].toLowerCase()) {
                                $this.find('input').val(qarray[i].split(':')[1])
                            }
                        });

//                        $('#search-dropdown-cont').children('div').find('#'+qarray[i].split(':')[0].toLowerCase()).val(qarray[i].split(':')[1]);
//                        $('#'+qarray[i].split(':')[0]).val(qarray[i].split(':')[1]);
                    }

                }
            }
        }
        $('#search-dropdown-cont').delay(300).slideToggle("fast");
        $('#search').trigger('click');
    });

    $('#search-dropdown-close').click(function (e) {
        e.stopPropagation();
        $('#search-dropdown-cont').toggle();
        var icon = $('#search-dropdown-arrow').find('i'), cls = icon.attr('class');
        icon.removeClass().addClass(cls == 'icon-sort-down' ? 'icon-sort-up' : 'icon-sort-down');
    });

    $('html').click(function () {
        if ($('#search-dropdown-cont').is(':visible')) {
            $('#search-dropdown-cont').hide();

            var icon = $('#search-dropdown-arrow').find('i'), cls = icon.attr('class');
            icon.removeClass().addClass(cls == 'icon-sort-down' ? 'icon-sort-up' : 'icon-sort-down');
        }

    });

    $('#search-dropdown-cont').click(function (e) {
        e.stopPropagation();
    });

    $('#search-dropdown-cont').find('input').keypress(function (e) {
        if (e.keyCode == 13) {
            $('#search-button2').trigger('click');
        }
    });
    /*
     $('#search').keypress(function (e) {
     if (e.keyCode === 13) {
     search();
     }
     });

     $('#search-button').click(function () {
     search();
     return false;
     });*/
    /*
     var test = function (que) {
     var map = {};
     var key = "";
     var value = "";
     var isKey = true;
     for (var i = 0; i < que.length; i++) {
     if (isKey) {
     for (; i < que.length; i++) {
     if (que.charAt(i) == ":") {
     isKey = false;
     break;
     }
     key += que.charAt(i);
     }
     } else if (que.charAt(i) != " ") {
     if (que.charAt(i) == "\"") {
     i++;
     for (; i < que.length; i++) {
     if (que.charAt(i) == "\"") {
     break;
     }
     value += que.charAt(i);
     }
     } else {
     for (; i < que.length; i++) {
     if (que.charAt(i) == " ") {
     break;
     }
     value += que.charAt(i);
     }
     }
     isKey = true;
     } else {

     }
     if (isKey) {
     map[key] = value;
     key = "";
     value = "";
     }

     }
     var query = "";
     for (var searchKey in map) {
     query += searchKey + "=" + map[searchKey] + "&";
     }
     return query.substring(0, query.length - 1);
     };
     */

    var makeQuery = function () {

        $('#search-dropdown-cont').children('div').each(function () {
            var $this = $(this);
            var data = getValue($this);
            if (data.value.length > 0) {
                if (data.value.length > 0) {
                    $('#search').val($('#search').val() + ' ' + data.name + ':"' + data.value + '"');
                }
            } else {
                if (data.value.length > 0) {
                    $('#search').val(data.name + ':"' + data.value + '"');
                }
            }
        });
    };

    /**
     * The function obtains the value of a field given form regardless of whether
     * it is an input field or a select field
     * @param element The jquery element which encapsulates the elemnt in which the
     * input field resides
     *
     */
    var getValue = function (element) {
        var field = $(element).find('input'); //Try locate an input field
        var data = {};
        data.value = '';


        //If there is no input field check for a select
        if (!field[0]) {
            field = $(element).find('select');
        }

        //Check if a field exists  and obtain the value
        if (field) {
            data.name = field.attr('name');
            data.value = field.val();
        }
        return data;
    };

    $('#search-button2').click(function () {
        $('#search').val('');

        makeQuery();
        if ($('#search').val() == '') return;
        search();
        $('#search-dropdown-cont input').val('');
        return false;
    });

    $('#container-search').affix({
        offset: { top: $('.navbar').offset().top + 80}
    });
});