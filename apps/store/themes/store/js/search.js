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

    var buildParams = function (query) {
        return 'q=' + query;
    };

    var parseArrToJSON = function(items){
    var item;
    var components;
    var obj = {};
    var key;
    var value;
    for(var index = 0; index < items.length; index++){
        item = items[index];
        components = item.split(':');
        if(components.length == 2) {
            key = components[0];
            value = components[1];
            obj[key]=value;
        }
    }
    return obj;
};
var isTokenizedTerm = function(term){
    return term.indexOf(':')<=-1;
};
/**
 * Takes the users input and builds a query.This method
 * first checks if the user is attempting to search by name , if not
 * it will look for a : delimited complex query
 *    E.g. name:wso2 tags:bubble
 * @param  {[type]} input [description]
 * @return {[type]}       [description]
 */
var parseUsedDefinedQuery = function(input) {
    var terms;
    var q = {};
    var current;
    var term;
    var arr =[];
    var previous;
    //Use case #1 : The user has only entered a name
    if(isTokenizedTerm(input)){
        q.name = input;
        return q;
    }
    //Remove trailing whitespaces if any
    input = input.trim();
    //Use case #2: The user has entered a complex query
    //and one or more properties in the query could values
    //with spaces
    //E.g. name:This is a test tags:wso2
    terms = input.split(' ');

    for(var index = 0; index < terms.length; index++){
        term = terms[index];
        term = term.trim(); //Remove any whitespaces
        //If this term is empty and does not have a : then it should be appended to the
        //previous term
        if((term.length>0)&&(isTokenizedTerm(term))){
            previous = arr.length -1;
            if(previous>=0) {
                arr[previous]= arr[previous]+' '+term;
            }
        } else {
            arr.push(term);
        }
    }
    return parseArrToJSON(arr);
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
        if(!$('#advanced-search').is(':visible')){
            searchQuery = $('#search').val();
            if(searchQuery !== ''){
                q = parseUsedDefinedQuery(searchQuery);
                q = JSON.stringify(q);
                q = q.replace('{','').replace('}', '');
                output =q;
                //output = '"name":"'+searchQuery+'"';
            }
            return output;
        }

        $inputs = $(containerId + ' :input');
        $inputs.each(function () {
            if ((this.name != undefined) && (this.name != '') && (this.value) && (this.value != '') && ($(this).val() != "ignore-value")) {
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
        return output;
    };

    var search = function () {
        var url, searchVal = getSearchFields('#advanced-search');//$('#search').val();
        //var url, searchVal = test($('#search').val());
        currentPage = 1;
        var path = window.location.href;//current page path
        if (store.asset) {
            if(path.match('/t/')){
                var regex = '/t/{1}([0-9A-Za-z-\\.@:%_\+~#=]+)';
                var domain = path.match(regex)[1];
                url = caramel.url('/t/'+ domain +'/assets/' + store.asset.type + '/list?' + buildParams(searchVal));
            }else{
                url = caramel.url('/assets/' + store.asset.type + '/list?' + buildParams(searchVal));
            }
            window.location.href = url;
        } else if (searchVal.length > 0 && searchVal != undefined) {
            if(path.match('/t/')){
                var regex = '/t/{1}([0-9A-Za-z-\\.@:%_\+~#=]+)';
                var domain = path.match(regex)[1];
                url = caramel.url('/t/'+ domain +'/?' + buildParams(searchVal));
            } else {
                url = caramel.url('/?' + buildParams(searchVal));
            }
            window.location = url;
        }

        $('.search-bar h2').find('.page').text(' / Search: "' + searchVal + '"');
    };

    $('#advanced-search').ontoggle = function ($, divobj, state) {
        var icon = $('#search-dropdown-arrow').find('i'), cls = icon.attr('class');
        icon.removeClass().addClass(cls == 'icon-sort-down' ? 'icon-sort-up' : 'icon-sort-down');
    };

    $('#search').keypress(function (e) {
        if (e.keyCode === 13) {
            if ($('#advanced-search').is(':visible')) {
                $('#search').val('');
                makeQuery();
            }
            search();
        } else if (e.keyCode == 27) {

            $('#advanced-search').toggle();
        }

    });

    $('#search-button').click(function () {
        if ($('#search').val() == '') return;
        if ($('#advanced-search').is(':visible')) {
            $('#search').val('');
            makeQuery();
        }
        search();
    });

    $('#search-dropdown-close').click(function (e) {
        e.stopPropagation();
        $('#advanced-search').toggle();
        var icon = $('#search-dropdown-arrow').find('i'), cls = icon.attr('class');
        icon.removeClass().addClass(cls == 'icon-sort-down' ? 'icon-sort-up' : 'icon-sort-down');
    });





    var makeQuery = function () {
        $('#advanced-search').find('div.search-data-field').each(function () {
            var $this = $(this);
            var data = getValue($this);
            if (data.value.length > 0) {
                    $('#search').val($('#search').val() + ',"' + data.name + '":"' + data.value + '"');
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
            if(data.value == "ignore-value"){
                data.value = "";
            }
        }
        return data;
    };

    $('#search-button2').click(function () {
        $('#search').val('');

        makeQuery();
        if ($('#search').val() == '') return;
        search();
        $('#advanced-search input').val('');
        return false;
    });

    $('#advanced-search-btn').click(function(){
        $(this).next().toggle();
    });

    $('body').click(function(e){
        if(e.target.id == "advanced-search-btn") return;
        if($('#advanced-search').is(":visible")){
            $('#advanced-search').hide();
        }
    });

    $('#advanced-search').click(function(e){
        e.stopPropagation()
    }).find('input').keypress(function (e) {
        if (e.keyCode == 13) {
            $('#search-button2').trigger('click');
        }
    });
    $('#advanced-search').find('select').each(function(){
        $(this).val('ignore-value');
    })


});