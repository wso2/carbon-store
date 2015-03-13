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
/*
 Description:The registry operator is use to wrap the wso2 registry resource crud operations.
 Filename: registry.operator.js
 Created Date: 2/20/2015
 */
var registryOperator = function() {
    var log = new Log("registry.operator");
    var uuid = require("uuid");
    var carbon = require('carbon');
    var utils = require("utils");
    var es = require("store");
    var ref = utils.file;
    var pathPrefix = '/_system/governance/store/asset_resources/';
    /**
     * Add a file resource to the registry path
     * @param  fileObj file to be added to the registry
     * @return the uuid+uploaded file name for the asset
     */
    function addFile(fileObj) {
        var tenantId = fileObj.tenantId || carbon.server.superTenant.tenantId;
        var registry = es.server.systemRegistry(tenantId);
        var resource = {};
        resource.content = fileObj.file.getStream();
        var extension = ref.getExtension(fileObj.file);
        resource.mediaType = ref.getMimeType(extension);
        log.info("Extension of the inserting file is " + extension);
        log.info("Media type of the inserting file is " + resource.mediaType);
        resource.uuid = uuid.generate();
        resource.name = fileObj.file.getName();
        resource.properties = {};
        resource.properties.extension = extension;
        var pathSuffix = fileObj.type + "/" + fileObj.assetId + "/" + fileObj.fieldName;
        var path =  pathPrefix + pathSuffix;
        registry.put(path, resource);
        return fileObj.fieldName;
    }
    /**
     * Get a image resource from the registry and serve it.
     * @param  file file to be added to the registry
     * @return the uuid+uploaded file name for the asset
     */
    function getFile(pathSuffix, tenantId) {
        var fetchedFile = {};
        tenantId = tenantId || carbon.server.superTenant.tenantId;
        var registry = es.server.systemRegistry(tenantId);
        var path =  pathPrefix + pathSuffix;
        fetchedFile.resource = registry.get(path);
        fetchedFile.content = registry.content(path);
        return fetchedFile;
    }
    return {
        addFile: addFile,
        getFile: getFile
    };
};