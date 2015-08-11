
/*
 * Copyright (c) WSO2 Inc. (http://wso2.com) All Rights Reserved.
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

/**
 * The constants namespace defines a set of values which are used throughout the app and asset extensions
 * @namespace
 * @example 
 *     var constants = require('rxt').constants;
 *     print(constants.DEFAULT_TITLE);
 */
var constants = {};
(function(constants) {
    constants.DEFAULT_TITLE = 'ES';
    constants.DEFAULT_DESCRIPTION = 'this is list of top assets';
    constants.MSG_PAGE_INFO_NOT_FOUND = 'Title not found';
    constants.DEFAULT_TENANT = -1234;
    constants.RECENT_ASSET_COUNT = 5; //The default number of recent assets to be retrieved
    constants.POPULAR_ASSET_COUNT = 1;
    constants.DEFAULT_TIME_STAMP_FIELD = 'overview_createdtime';
    constants.ASSET_PROVIDER = 'overview_provider';
    constants.SUBSCRIPTIONS_PATH = '/subscriptions';
    constants.ASSET_EXTENSION_ROOT='/extensions/assets';
    constants.DEFAULT_ASSET_EXTENSION='default';
    constants.APP_CONTEXT = 'rxt.app.context';
    constants.TAGS_QUERY_PATH = '/_system/config/repository/components/org.wso2.carbon.registry/queries/allTags';
    constants.ASSET_TYPES_PATH ='/_system/governance/repository/components/org.wso2.carbon.governance/types';
    constants.TAGS_SERVICE = 'org.wso2.carbon.registry.indexing.service.TermsSearchService';
    constants.DEFAULT_APP_EXTENSION = 'default';
    constants.AUTH_METHOD_BASIC = 'basic';
    constants.AUTH_METHOD_SSO = 'sso';
    constants.AUTH_METHOD_OTHER = 'other';
    /***
     * ES Feature Constants
     */
    constants.ASSET_TYPES_HOTDEPLOYMENT = "assetTypesHotDelploy";
    constants.SOCIAL_FEATURE='social';
    constants.SOCIAL_FEATURE_SCRIPT_KEY='socialScriptSource';
    constants.SOCIAL_FEATURE_SCRIPT_TYPE_KEY='socialScriptType';
    constants.SOCIAL_FEATURE_APP_URL_KEY='socialAppUrl';
    constants.ASSET_DEFAULT_SORT='overview_createdtime';
    constants.Q_SORT='sortBy';
    constants.Q_TAG='tag';
    constants.Q_SORT_ORDER='sort';
    constants.ASSET_DEFAULT_SORT_ORDER='DESC';
    constants.Q_SORT_ORDER_ASCENDING = 'ASC';
    constants.Q_SORT_ORDER_DESCENDING = 'DESC'
    constants.Q_PROP_DEFAULT = '_default';
    constants.Q_PROP_GROUP ='_group';
    constants.Q_PROP_WILDCARD = '_wildcard'
    constants.PROP_DEFAULT = 'default';
    constants.DEFAULT_NAME_ATTRIBUTE = 'overview_name';
    /**
     * Registry actions
     */
    constants.REGISTRY_GET_ACTION = 'http://www.wso2.org/projects/registry/actions/get';
    constants.REGISTRY_ADD_ACTION = 'http://www.wso2.org/projects/registry/actions/add';
    constants.REGISTRY_DELETE_ACTION = 'http://www.wso2.org/projects/registry/actions/delete';
    constants.REGISTRY_AUTHORIZE_ACTION = 'authorize';
    /**
     * Registry roles
     */
    constants.ROLE_EVERYONE = 'Internal/everyone';
    /**
     * URL Patterns
     */
    constants.APP_PAGE_URL_PATTERN = '/{context}/pages/{+suffix}';
    constants.ASSET_PAGE_URL_PATTERN = '/{context}/assets/{type}/{+suffix}';
    constants.ASSET_API_URL_PATTERN = '/{context}/assets/{type}/apis/{+suffix}';
    constants.STORAGE_URL_PATTERN = '/{context}/storage/{type}/{id}/{uuid}/{fileName}';
    constants.ASSET_DETAIL_URL_PATTERN = '/{context}/assets/{type}/{pageName}/{+id}';

    constants.APP_TENANT_PAGE_URL_PATTERN = '/{context}/t/{domain}/pages/{+suffix}';
    constants.ASSET_TENANT_PAGE_URL_PATTERN = '/{context}/t/{domain}/assets/{type}/{+suffix}';
    constants.ASSET_TENANT_API_URL_PATTERN = '/{context}/t/{domain}/assets/{type}/apis/{+suffix}';
    constants.STORAGE_TENANT_URL_PATTERN = '/{context}/t/{domain}/storage/{type}/{id}/{uuid}/{fileName}';
    constants.ASSET_DETAIL_TENANT_URL_PATTERN = '/{context}/t/{domain}/assets/{type}/{pageName}/{+id}';

    constants.TENANT_URL_PATTERN = '/{context}/t/{domain}/{+any}';
    constants.DEFAULT_SUPER_TENANT_URL_PATTERN = '/{context}/{+any}';

    /**
     * URLs
     */
    constants.ASSET_BASE_URL = '/assets/';
    constants.ASSET_API_URL = '/apis/';
    constants.APP_PAGE_URL = '/pages/';
    constants.APP_API_URL = '/apis/';
    /**
     * API URLs
     */
    constants.CREATE_URL = '/{context}/apis/assets/';
    constants.UPDATE_URL = '/{context}/apis/assets/{id}';
    constants.LIST_ASSETS_URL = '/{context}/apis/assets/';
    constants.GET_ASSET_URL = '/{context}/apis/assets/{id}';
    constants.DELETE_ASSET_URL = '/{context}/apis/assets/{id}';
    constants.ASSET_STATE_URL = '/{context}/apis/assets/{id}/state';

    constants.GET_LIFECYCLES_URL = '/{context}/apis/lifecycles/';
    constants.GET_LIFECYCLE_DEFINITION_BY_NAME_URL = '/{context}/apis/lifecycles/{lifecycleName}';
    constants.GET_LIFECYCLE_STATE_URL = '/{context}/apis/lifecycles/{lifecycleName}/{currentState}';

    constants.STATUS_CODES = {
        OK: 200,
        CREATED:201,
        ACCEPTED: 202,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500,
        NOT_IMPLEMENTED: 501,
        NOT_ACCEPTABLE: 406,
        UNSUPPORTED_MEDIATYPE: 415
    };

    constants.THROW_EXCEPTION_TO_CLIENT = 'THROW_EXCEPTION_TO_CLIENT';
    constants.THROW_EXCEPTION_TO_CLIENT = 'THROW_EXCEPTION_TO_CLIENT';
    constants.LOG_EXCEPTION_AND_TERMINATE = 'LOG_EXCEPTION_AND_TERMINATE';
    constants.LOG_EXCEPTION_AND_CONTINUE = 'LOG_AND_CONTINUE_EXCEPTION';
    /**
     * Pagin objects
     */
    constants.DEFAULT_RECENT_ASSET_PAGIN = {
        start: 0,
        count: 5,
        sortBy: '',
        sortOrder: 'DESC'
    };

    constants.DEFAULT_POPULAR_ASSET_PAGIN={
        start:0,
        count:1,
        sortBy:'',
        sortOrder:'ASC'
    };
    constants.DEFAULT_TAG_PAGIN = {
        start: 0,
        count: 10,
        sortBy: 'overview_createdtime',
        sortOrder: 'DESC'
    };

    constants.DEFAULT_ASSET_PAGIN={
        start:0,
        count:12,
        sortBy: 'overview_createdtime',
        sortOrder: 'DESC',
        paginationLimit: 100
    };

    constants.MultitenantConstants = Packages.org.wso2.carbon.utils.multitenancy.MultitenantConstants;

}(constants));
