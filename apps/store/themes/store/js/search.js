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
    var isEmpty = function(input) {
        return (input.length === 0);
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
        //Remove trailing whitespaces if any
        input = input.trim();
        input = replaceAll(input,"(\\s)*:(\\s)*", ":");

        //Use case #1 : The user has only entered a name
        if(isTokenizedTerm(input)){
            if(input.indexOf('"') > -1){
                q.name = JSON.stringify(JSON.parse(input));
            } else {
                q.name = encodeURIComponent(input);
            }
            return q;
        }

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
     * Replace all the occurrences of $regex by $replace in $originalString
     * @param  {originalString} input - Raw string.
     * @param  {regex} input - Target key word or regex that need to be replaced.
     * @param  {replace} input - Replacement key word
     * @return {String}       Output string
     */
    var replaceAll = function(originalString, regex, replace) {
        return originalString.replace(new RegExp(regex, 'g'), replace);
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
            $.cookie("searchQuery", searchQuery);
            if (searchQuery.indexOf(":") == -1 && searchQuery.trim() !== "") {
                searchQuery = setDefaultSearchQuery(searchQuery);
            }
            var array = getSearchKeyArray($('#categorization-query').val());
            //Removes the categorization values from the hidden field if it exists in the search query
            for (var i = 0; i < categorizationArray.length; i++) {
                if (searchQuery.indexOf(categorizationArray[i]) > -1) {
                    for (var j = 0; j < array.length; j++) {
                        if (array[j].indexOf(categorizationArray[i]) > -1) {
                            array.splice(j, 1);
                            break;
                        }
                    }
                }
            }
            $('#categorization-query').val(array.join(' '));
            searchQuery = searchQuery +  " " + $('#categorization-query').val();
            if(searchQuery.trim() !== ''){
                q = parseUsedDefinedQuery(searchQuery);
                q = JSON.stringify(q);
                q = q.replace('{','').replace('}', '');
                q = encodeURIComponent(q);
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

    var setDefaultSearchQuery = function(query){
        return "_default:" +query;
    };

    /***
     * This method is used to get the categorization values as an array
     * @param query
     * @returns {Array}
     */
    var getSearchKeyArray = function (query){

        var terms;
        var term;
        var arr =[];
        var previous;

        terms = query.split(' ');
        for(var index = 0; index < terms.length; index++){
            term = terms[index];
            term = term.trim(); //Remove any whitespaces
            //If this term is not empty and does not have a : then it should be appended to the
            //previous term
            if((!isEmpty(term))&&(isTokenizedTerm(term))){
                previous = arr.length -1;
                if(previous>=0) {
                    arr[previous]= arr[previous]+' '+term;
                }
            } else {
                arr.push(term);
            }
        }

        return arr;
    };

    /**
     * This method checks if the search query has matching open and closed brackets.
     * @param query         search query
     * @returns {boolean}   true if query is valid
     */
    var checkParentheses = function (query) {
        var parentheses = "()",
            stack = [],
            i, character, positions;

        for (i = 0; character = query[i]; i++) {
            positions = parentheses.indexOf(character);

            if (positions === -1) {
                continue;
            }

            if (positions % 2 === 0) {
                stack.push(positions + 1);
            } else {
                if (stack.length === 0 || stack.pop() !== positions) {
                    return false;
                }
            }
        }

        return stack.length === 0;
    };

    /**
     * Simple validator for the search query. Validates for enclosed quotations and parenthesis.
     * @param query         search query
     * @returns {boolean}   validity of the query.
     */
    var validateQuery = function (query) {
        query = decodeURIComponent(query);
        var matches = query.match(/\\"/g);
        var count = matches ? matches.length : 0;
        if (count % 2 !== 0) {
            return false;
        }
        return checkParentheses(query);
    };

    var search = function () {
        var url, searchVal = getSearchFields('#advanced-search');
        if (!validateQuery(searchVal)) {
            messages.alertError("Syntax error in search query. Please correct and submit again.");
            var searchBox = $('#search');
            searchBox
                .addClass('has-error')
                .keyup(function () {
                    if (validateQuery(getSearchFields('#advanced-search'))) {
                        searchBox.removeClass('has-error');
                    } else {
                        searchBox.addClass('has-error');
                    }
                });
            return;
        }
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
    });

});