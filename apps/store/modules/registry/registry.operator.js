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
var registryOperator = function () {
    var log = new Log("registry.operator");
    var uuid = require("uuid");
    var utils = require("utils");
    var es = require("store");
    var ref = utils.file;
    var path = '/_system/es/';

    /**
     * Add a file resource to the registry path
     * @param  fileObj file to be added to the registry
     * @return the uuid+uploaded file name for the asset
     */
    function addFile(fileObj) {
        var tenantId =fileObj.tenantId || -1234;
        var registry = es.server.systemRegistry(tenantId); //new carbon.registry.Registry(server, options);

        var resource = {};
        resource.content = fileObj.file.getStream();
        var extension = ref.getExtension(fileObj.file);
        resource.mediaType = ref.getMimeType(extension);

        resource.uuid = uuid.generate();
        resource.name = fileObj.file.getName();
        path += resource.uuid + "/" + fileObj.file.getName();

        registry.put(path, resource);
        return resource;

    }

    /**
     * Get a image resource from the registry and serve it.
     * @param  file file to be added to the registry
     * @return the uuid+uploaded file name for the asset
     */
    function getFile(filename) {
        var fetchedFile = {};
        var tenant =es.server.tenant(request,session);
        var tenantId = tenant.tenantId || -1234;
        var registry = es.server.systemRegistry(tenantId);

        path += filename;

        fetchedFile.resource = registry.get(path);
        fetchedFile.content = registry.content(path);
        return fetchedFile;
    }


    return {
        addFile: addFile,
        getFile: getFile
    };

};