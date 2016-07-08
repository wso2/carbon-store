/*
 * Copyright (c) 2016 WSO2 Inc. (http://wso2.com) All Rights Reserved.
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

var assetAvailability = false;
var taxonomy = {};
var log = new Log('taxonomy_module');
var TaxonomyService = carbon.server.osgiService('org.wso2.carbon.governance.taxonomy.services.ITaxonomyServices');

var queryBean =  Packages.org.wso2.carbon.governance.taxonomy.beans.QueryBean;
var paginationBean = Packages.org.wso2.carbon.governance.taxonomy.beans.PaginationBean;



(function (taxonomy) {
    /**
     * This method is use to get the admin defined taxonomy hierarchy list as a path.
     * @param query search query as Xpath
     * @param startNode results from this node
     * @param endNode results filter upto this node
     * @returns  Returns the set of taxonomy list which admin defined
     */
    taxonomy.getNodesList = function (query, startNode, endNode, displayName) {
            queryBean = new queryBean();
            paginationBean = new paginationBean();
            queryBean.setTaxonomyName(displayName);
            queryBean.setQuery(query);
            paginationBean.setStartNode(startNode);
            paginationBean.setEndNode(endNode);
            return JSON.parse(TaxonomyService.query(queryBean,paginationBean));
    };
    /**
     * This method is use to get the taxonomy by rootId.
     * @param query search query : asset Type
     * @param assetType asset type name
     * @returns  Returns the set of taxonomy list which admin defined
     */
    taxonomy.getTaxonomyName = function (query, assetType) {
            queryBean = new queryBean();
            queryBean.setAssetType(assetType);
            queryBean.setQuery(query);
            return JSON.parse(TaxonomyService.getTaxonomyName(queryBean));
    };


}(taxonomy));