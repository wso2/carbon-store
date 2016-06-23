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
var render = function (theme, data, meta, require) {
    data.stream.isLogged = data.isLogged;
    data.stream.isAuthorized = data.isAuthorized;
    data.stream.urlDomain = data.urlDomain;
    data.stream.message = data.message;
    var type = data.stream.id.split(':')[0];
    data.stream.type = type;
    data.input = {
        'type': type,
        'param': data.input_param,
        'myReview': data.stream.myReview,
        'ratings': Array.apply(0, new Array(5)) //Generates an array [5,4,3,2,1] | else register handlebar helper
            .map(function (element, index) {
                return 5 - index;
            })
    };
    if (data.isLogged && data.isAuthorized) {
        theme('simple', {
            body: [
                {partial: 'comment-input', context: data.input},
                {partial: 'stream', context: data.stream}
            ]
        });
    } else {
        theme('simple', {
            body: [
                {partial: 'stream', context: data.stream}
            ]
        });
    }
};
