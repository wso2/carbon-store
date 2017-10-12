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

var tenantId = -1234;

describe('Registry - Osgi API', function () {

    /*
     * method: registry.get(path);
     * input: constants.ASSET_TYPES_PATH
     * Response: resources collection
     * test: check for length of the collection returned (rxt definitions)
     */
    it('Test registry.get(path) returns all the resources at a path without slice', function () {

        try {
            var server = require('store').server;
            var systemRegistry = server.systemRegistry(tenantId);
            var constants = require('rxt').constants;
            var collection = systemRegistry.get(constants.ASSET_TYPES_PATH)||[];
            var typeCollection = collection.content ||[];
        } catch (e) {
            log.error(e);
        } finally {
            expect(typeCollection.length).toBeGreaterThan(10);
        }
    });

});



