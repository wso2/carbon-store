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
var render = function(theme, data, meta, require) {
    var navigation = 'navigation';
    var navigationContext = data;
    switch (data.assetTypeCount) {
        case 1:
            navigation = 'navigation-single';
            break;
        default:
            break;
    }
    theme('2-column-right', {
        title: data.title,
        header: [{
            partial: 'header',
            context: data
        }],
        navigation: [{
            partial: navigation,
            context: navigationContext
        }],
        body: [{
            partial: 'my_items',
            context: data
        }],
        right: [{
                partial: 'recent-assets',
                context: data
            }
            // {
            //     partial: 'tags',
            //     context: data.tags
            // }
        ]
    });
};