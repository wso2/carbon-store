/**
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 * <p>
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.store.sso.common.exception;

public class StoreSSOCommonException extends Exception {

    public StoreSSOCommonException(String msg) {
        super(msg);
    }

    public StoreSSOCommonException(String msg, Throwable e) {
        super(msg, e);
    }

    public StoreSSOCommonException(Throwable throwable) {
        super(throwable);
    }
}
