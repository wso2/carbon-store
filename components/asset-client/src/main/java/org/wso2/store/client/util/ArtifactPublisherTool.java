package org.wso2.store.client.util;
/*
 * Copyright (c) 2015, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import org.apache.commons.cli.BasicParser;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;
import org.apache.log4j.Logger;
import org.wso2.store.client.ArtifactPublisher;
import org.wso2.store.client.common.StoreAssetClientException;

public class ArtifactPublisherTool {

    private static final Logger log = Logger.getLogger(ArtifactPublisherTool.class);
    private static final String HOST_NAME = "host";
    private static final String PORT = "port";
    private static final String USER_NAME = "user";
    private static final String PASSWORD = "pwd";
    private static final String CONTEXT = "context";
    private static final String LOCATION = "location";

    /**
     * Parse the command line arguments and get ES host settings.
     * host, port, user, pwd and context are optional. set default values if not.
     * location is mandatory.
     * Call Artifact Publisher to publish assets.
     * Ex -: host=ipaddress
     *       port=9448
     *       user=test
     *       password=test
     *       context=mypublisher
     * @param args Command Line arguments parameter.
     * @throws org.wso2.store.client.common.StoreAssetClientException
     */
    public static void main(String args[]) throws StoreAssetClientException {

        Options options = new Options();
        options.addOption(HOST_NAME, false, "Host Name");
        options.addOption(PORT, false, "port");
        options.addOption(USER_NAME, false, "user name");
        options.addOption(PASSWORD, false, "password");
        options.addOption(CONTEXT, false, "Context");
        options.addOption(LOCATION, true, "location");

        BasicParser parser = new BasicParser();
        CommandLine commandLine;
        try {
            commandLine = parser.parse(options, args);
        } catch (ParseException e) {
            String errorMsg = "Command line pass exception:";
            log.error(errorMsg, e);
            throw new StoreAssetClientException(e);
        }
        String host = commandLine.getOptionValue(HOST_NAME, ArtifactUploadClientConstants.DEFAULT_HOST_NAME);
        String context = commandLine.getOptionValue(CONTEXT, ArtifactUploadClientConstants.DEFAULT_CONTEXT);
        String port = commandLine.getOptionValue(PORT, ArtifactUploadClientConstants.DEFAULT_PORT);
        String userName = commandLine.getOptionValue(USER_NAME, ArtifactUploadClientConstants.DEFAULT_USER);
        String pwd = commandLine.getOptionValue(PASSWORD, ArtifactUploadClientConstants.DEFAULT_PWD);
        String location = commandLine.getOptionValue(LOCATION);

        if (log.isDebugEnabled()) {
            log.debug("Host:" + host + " port:" + port + " User Name:" + userName + " Password:" + pwd + " Context:"
                    + context + " " + "Location:" + location);
        }
        ArtifactPublisher artifactPublisher = new ArtifactPublisher();
        artifactPublisher.publishArtifacts(host, context, port, userName, pwd, location);
    }
}
