/*
 *  Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
var URL = {};
(function() {
    URL.buildURL = function(url) {
        return new Url(url);
    };

    function Url(url) {
        this.url = url;
        this.urlBase = '';
        this.queryParams = [];
        init(this);
    }
    Url.prototype.compile = function() {
        return reconstructURL(this.urlBase, this.queryParams);
    };
    Url.prototype.toString = function() {
        return reconstructURL(this.urlBase, this.queryParams);
    }
    Url.prototype.queryParam = function() {
        if (arguments.length === 1) {
            return getQueryParam.apply(this, arguments);
        }
        if (arguments.length === 2) {
            addQueryParam.apply(this, arguments);
            return this;
        }
    };
    Url.prototype.removeQueryParam = function() {
        removeQuery.apply(this, arguments);
        return this;
    };

    function init(expression) {
        expression.urlBase = '';
        var components = expression.url.split('?');
        expression.urlBase = components[0];
        //If there are no other components
        if (components.length === 1) {
            return;
        }
        expression.queryParams = processQueryParams(components[1] || '');
    }

    function processQueryParams(queryParamsString) {
        var components = queryParamsString.split('&');
        var params = [];
        components.forEach(function(component) {
            if (component !== '') {
                params.push(new QueryParam(component));
            }
        });
        return params;
    }

    function reconstructURL(urlBase, queryParams) {
        var params = [];
        queryParams.forEach(function(queryParam) {
            params.push(queryParam.compile());
        });
        var queryParamComponent = params.join('&');
        queryParams = (queryParamComponent === '') ? [] : [queryParamComponent];
        return [urlBase].concat(queryParams).join('?');
    }

    function addQueryParam(key, value) {
        //Check if the query param exists
        var queryParam = this.queryParam(key);
        value = (typeof value === 'QueryParam') ? value : (new QueryParam(key, value));
        //New query parameter
        if (!queryParam) {
            this.queryParams.splice(0, 0, value);
            //this.queryParams.push(value);
            return;
        }
        var indexToReplace = getQueryParamIndex(key, this.queryParams);
        if (indexToReplace < 0) {
            throw 'Could not add the query parameter with key: ' + key;
        }
        this.queryParams.splice(indexToReplace, 1);
        this.queryParams = this.queryParams.slice(0, indexToReplace).concat([value]).concat(this.queryParams.slice(indexToReplace));
    }

    function getQueryParam(key) {
        var value = null;
        this.queryParams.forEach(function(queryParam) {
            if (queryParam.key === key) {
                value = queryParam;
            }
        });
        return value;
    }

    function getQueryParamIndex(key, queryParams) {
        var index = -1;
        queryParams.forEach(function(queryParam, indexOfQueryParam) {
            if (queryParam.key === key) {
                index = indexOfQueryParam;
            }
        });
        return index;
    }

    function removeQuery(key) {
        var indexToReplace = getQueryParamIndex(key, this.queryParams);
        if (indexToReplace < 0) {
            return;
        }
        this.queryParams.splice(indexToReplace, 1);
    }

    function QueryParam() {
        var value = arguments[0];
        if (arguments.length === 2) {
            value = arguments[0] + '=' + arguments[1];
        }
        this.queryParamString = value;
        this.key = '';
        this.value = '';
        //Break up the value into a map
        initQueryParam.apply(this);
    }
    QueryParam.prototype.set = function(key, newValue) {
        if (this.value instanceof ValueMap) {
            this.value.set(key, newValue);
            return this;
        }
        this.value = new ValueMap();
        this.value.set(key, newValue);
        return this;
    };
    QueryParam.prototype.get = function(key) {
        //Retrieve the value of the query param
        if (!key) {
            return this.value;
        }
        if (this.value instanceof ValueMap) {
            return this.value.get(key);
        }
        return null;
    };
    QueryParam.prototype.remove = function(key) {
        if (this.value instanceof ValueMap) {
            this.value.remove(key);
        }
        return this;
    };
    QueryParam.prototype.compile = function() {
        return this.toString();
    };
    QueryParam.prototype.toString = function() {
        return reconstructQueryParam.apply(this);
    };

    function initQueryParam() {
        var components = this.queryParamString.split('=');
        this.key = components[0];
        var valueComponents = (components[1] || '').split(',');
        if ((valueComponents.length === 1) && ((components[1] || '').indexOf(':') < 0)) {
            this.value = components[1];
        } else {
            this.value = new ValueMap(valueComponents);
        }
    }

    function reconstructQueryParam() {
        var value = this.value;
        if (this.value instanceof ValueMap) {
            value = encodeURIComponent(value.compile());
        }
        if (value === '') {
            return '';
        }
        return [this.key].concat([value]).join('=');
    }

    function ValueMap(values) {
        values = values || [];
        this.map = {};
        that = this;
        values.forEach(function(kv) {
            var components = kv.split(':');
            that.map[components[0]] = components[1];
        });
    }
    ValueMap.prototype.get = function(key) {
        return this.map[key];
    };
    ValueMap.prototype.set = function(key, value) {
        this.map[key] = value;
        return this;
    };
    ValueMap.prototype.remove = function(key) {
        if (this.map.hasOwnProperty(key)) {
            delete this.map[key];
        }
        return this;
    };
    ValueMap.prototype.compile = function() {
        return this.toString();
    };
    ValueMap.prototype.toString = function() {
        var values = [];
        var that = this;
        Object.keys(this.map).forEach(function(key) {
            values.push(key + ':' + that.map[key]);
        })
        return values.join(',');
    };
}());