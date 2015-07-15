/*
 *  Copyright (c) 2005-2014, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */
$(function(){
	var SEARCH_API = '/apis/assets?q=';
	var SEARCH_BUTTON = '#search-btn';
	var SEARCH_FORM = '#search-form';
	var processInputField = function(field){
		var result = field;
		switch(field.type) {
			case 'text':
				result = field;
				break;
			default:
				break;
		}
		return result;
	};
	var getInputFields = function(){
		var obj = {};
		var fields = $(SEARCH_FORM).find(':input');
		var field;
		for(var index = 0; index < fields.length; index++){
			field = fields[index];
			field = processInputField(field);
			if((field.name)&&(field.value)){
				obj[field.name] = field.value;
			}
		}
		return obj;
	};
	var createQueryString = function(key,value){
		return '"'+key+'":"'+value+'"';
	}
	var buildQuery = function(){
		var fields = getInputFields();
		var queryString =[];
		var value;
		for(var key in fields){
			value = fields[key];
			queryString.push(createQueryString(key,value));
		}
		return queryString.join(',');
	};
	var isEmptyQuery = function(query) {
		query = query.trim();
		return (query.length <= 0);
	};
	var createAPIQuery = function(query) {
		//TODO:Remove this
		return caramel.url(SEARCH_API+query+'&count=100');
		//return caramel.url('/apis/assets?type=gadget&q='+query);
	};
	var partial = function(name) {
        return '/themes/' + caramel.themer + '/partials/' + name + '.hbs';
    };
    var spinnerURL = function() {
        return caramel.url('/themes/default/img/preloader-40x40.gif');
    };
    var loadPartials = function (type, partial, done) {
        $.ajax({
            url: caramel.url('/apis/partials') + '?type=' + type + '&partial=' + partial,
            success: function (data) {
                done(false, data);
            },
            error: function () {
                done(err);
            }
        });
    };
    var render = function (type, partial, data, done) {
        loadPartials(type, partial, function (err, partials) {
            caramel.partials(partials, function () {
                caramel.render(partial, data, function (err, html) {
                    var partial;
                    for (partial in partials) {
                        if (partials.hasOwnProperty(partial)) {
                            delete Handlebars.partials[partial];
                        }
                    }
                    done(err, html);
                });
            })
        });
    };
    var renderPartial = function(partialKey, containerKey, data, fn) {
        fn = fn || function() {};
        var partialName = partialKey;
        var containerName = containerKey;
        if (!partialName) {
            throw 'A template name has not been specified for template key ' + partialKey;
        }
        if (!containerName) {
            throw 'A container name has not been specified for container key ' + containerKey;
        }

        var i;
        var length = data.length;
        var el = $('#'+containerName);
        var jobs = [];
        for(i = 0; i < length; i++) {
            jobs.push((function(data) {
                return function(done) {
                    render(data.type, partialKey, data, function (err, html) {
                        el.append(html);
                        done();
                    });
                };
            }(data[i])));
        }
        async.series(jobs, function(err, results) {
            removeSpinner();
        });
        fn(containerName);
    };
	var renderResults = function(data){
        renderPartial('advance-search-result-list', 'search-results-sandbox', data);
	};
	var renderEmptyResults = function() {
        removeSpinner();
		$('#search-results-sandbox').html('We are sorry but we could not find any matching assets');
	};
	var renderSpinner = function(){
		var imgString = '<img src='+spinnerURL()+' alt="ajax loading icon" >';
        $('#search-results-loader').html(imgString);
	};
    var removeSpinner = function() {
        $('#search-results-loader').empty();
    };
    var convertTimeToUTC = function (asset) {
        if (!asset.attributes.overview_createdtime) {
            return;
        }
        var value = asset.attributes.overview_createdtime;
        var date = new Date();
        date.setTime(value);
        asset.attributes.overview_createdtime = date.toUTCString();
        return asset;
    };
	var processResults = function(data){
		var assets = data;
		var asset;
		var map = {};
		var arr = [];
		var type;
		for(var index = 0; index < assets.length; index++){
			asset = assets[index];
            convertTimeToUTC(asset);
			type = asset.type;
			if(!map[type]){
				map[type] = {};
				map[type].type = type;
				map[type].assets = [];
			}
			map[type].assets.push(asset);
		}

		for(var item in map){
			arr.push(map[item]);
		}

		return arr;
	};
	var performSearchQuery = function(url) {
        $('#search-results-sandbox').empty();
		renderSpinner();
		$.ajax({
			url:url,
			method:'GET',
			success:function(data){
				var results = data.list || [];
				if(results.length<=0) {
					renderEmptyResults();
				} else {
					results = processResults(results);
					renderResults(results||[]);
				}
			},error:function(){
				alert('Failed to get results');
			}
		});
	};
	$(SEARCH_BUTTON).on('click',function(e){
		e.preventDefault();
		var query = buildQuery();
		var apiQuery;
		if(isEmptyQuery(query)) {
			console.log('User has not entered anything');
			return;
		}
		apiQuery = createAPIQuery(query);
		performSearchQuery(apiQuery);
	})
});