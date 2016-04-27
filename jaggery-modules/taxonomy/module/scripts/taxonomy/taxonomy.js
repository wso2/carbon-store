/*
 * Copyright (c) 2015-2016 WSO2 Inc. (http://wso2.com) All Rights Reserved.
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


var taxonomy = {};
var log = new Log('taxonomy_module');
var GovernanceCommon = org.wso2.carbon.governance.api.util.TaxonomyCategoryParser;
var GovernanceAPITree = org.wso2.carbon.governance.api.util.TaxonomyTreeAPI;
var LAST_MODIFIED_TIME = "LastModifiedTime";
var TAXA = "taxa";

(function (taxonomy) {


    /**
     * This method is use to get the admin defined taxonomy hierarchy list as a path.
     * @param query search query as Xpath
     * @param startNode results from this node
     * @param endNode results filter upto this node
     * @returns  Returns the set of taxonomy list which admin defined
     */
    taxonomy.getNodesList = function (query, startNode, endNode) {
        try {
            return JSON.parse(GovernanceAPITree.getNodes(query, startNode, endNode));
        } catch (e) {
            log.error('Error occurred while retrieving the admin defined taxonomy ', e);
        }
    };

    /**
     *
     * This method is use to get the admin defined category list as a path.
     * Returns the set of categories which admin defined
     * @return {Object}  Categories list as paths, which admin defined.
     */
    taxonomy.getTaxa = function () {
        if (!session.get(TAXA)) {
            return putInSession();
        } else {
            if (session.get(LAST_MODIFIED_TIME) != GovernanceCommon.getLastModifiedTime()) {
                return putInSession();
            }
            return session.get(TAXA);
        }

    };

    function putInSession() {
        session.put(LAST_MODIFIED_TIME, GovernanceCommon.getLastModifiedTime());
        session.put(TAXA, JSON.parse(GovernanceCommon.getPathCategories()));
        return session.get(TAXA)
    }

}(taxonomy));