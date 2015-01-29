/*
 * Copyright (c) 2014, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
package org.wso2.store.client;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonParser;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpStatus;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.conn.ssl.SSLContextBuilder;
import org.apache.http.conn.ssl.TrustSelfSignedStrategy;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.util.EntityUtils;
import org.apache.log4j.Logger;
import org.wso2.store.client.common.StoreAssetClientException;
import org.wso2.store.client.data.Asset;
import org.wso2.store.client.data.AuthenticationData;
import org.wso2.store.client.util.ArtifactUploadClientConstants;

import java.io.*;
import java.security.GeneralSecurityException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

/**
 * Upload assets store in a file system to ES.
 * The asset details should be map to rxt type fields and read as JSON format.
 */
public class ArtifactPublisher {

    private static final Logger log = Logger.getLogger(ArtifactPublisher.class);
    private HashMap<String, List<String>> rxtFileAttributesMap;
    private String hostUrl;
    private String sessionId;
    private SSLConnectionSocketFactory sslConnectionSocketFactory;
    private BasicHttpContext httpContext;
    private Gson gson;
    private HttpClientBuilder clientBuilder;

    /**
     * Publish asset details to given ES host.
     * @param host ES Host Name
     * @param context Context
     * @param port ES Port
     * @param userName ES User name
     * @param pwd ES pwd
     * @param location Directory of asset details stored
     * @throws StoreAssetClientException
     */
    public void publishArtifacts(String host, String context, String port, String userName, String pwd, String location)
            throws StoreAssetClientException {

        if (location == null || location.length() == 0) {
            String errorMsg = "The resource location should not be empty";
            log.error(errorMsg);
            throw new StoreAssetClientException(errorMsg);
        }
        init();
        hostUrl = "https://" + host + ":" + port + "/" + context;
        sessionId = getSession(userName, pwd);
        String[] rxtArr = getRxtTypes();
        List<String> fileTypeAttributesList;

        for (String rxtType : rxtArr) {
            fileTypeAttributesList = getAttributesForType(rxtType, "file");
            if (fileTypeAttributesList != null && !fileTypeAttributesList.isEmpty()) {
                rxtFileAttributesMap.put(rxtType, getAttributesForType(rxtType, "file"));
            }
        }
        File samplesDirectory = new File(location);
        readAssets(samplesDirectory);
    }

    /**
     * Initialize resources
     * @throws StoreAssetClientException
     */
    private void init() throws StoreAssetClientException {

        httpContext = new BasicHttpContext();
        rxtFileAttributesMap = new HashMap<String, List<String>>();
        SSLContextBuilder builder = new SSLContextBuilder();
        try {
            builder.loadTrustMaterial(null, new TrustSelfSignedStrategy());
            sslConnectionSocketFactory = new SSLConnectionSocketFactory(builder.build());
        } catch (GeneralSecurityException genSecEx) {
            String errorMsg = "SSL initiation fail.general security exception";
            throw new StoreAssetClientException(errorMsg, genSecEx);
        }
        clientBuilder = HttpClients.custom().setSSLSocketFactory(sslConnectionSocketFactory);
        gson = new Gson();
    }

    /**
     * Authenticate user name with password and fetch a valid session.
     * @param userName ES User name
     * @param pwd    ES password
     * @return Session id
     * @throws StoreAssetClientException
     */
    private String getSession(String userName, String pwd) throws StoreAssetClientException {

        String authUrl = hostUrl + ArtifactUploadClientConstants.PUBLISHER_AUTHORIZATION_URL + "?username=" +
                userName + "&password=" + pwd;
        if (log.isDebugEnabled()) {
            log.debug("Log in url:" + authUrl);
        }

        HttpPost httpPost = new HttpPost(authUrl);
        CloseableHttpClient httpClient = clientBuilder.build();
        CloseableHttpResponse response;
        String responseJson;
        try {
            response = httpClient.execute(httpPost, httpContext);
        } catch (IOException ioException) {
            String errorMsg = "IO error in session fetch: " + authUrl;
            log.error(errorMsg, ioException);
            throw new StoreAssetClientException(errorMsg, ioException);
        }

        try {
            responseJson = EntityUtils.toString(response.getEntity());
        } catch (IOException ioException) {
            String msg = "IO error in decode response of login";
            log.error(msg, ioException);
            throw new StoreAssetClientException(msg, ioException);
        } finally {
            IOUtils.closeQuietly(response);
            IOUtils.closeQuietly(httpClient);
        }
        if (log.isDebugEnabled()) {
            log.debug("Log in response:" + responseJson);
        }
        AuthenticationData authorizeObj = gson.fromJson(responseJson, AuthenticationData.class);
        if (authorizeObj.getData() != null) {
            sessionId = authorizeObj.getData().getSessionId();
            if (log.isDebugEnabled()) {
                log.debug("Logged:" + sessionId);
            }
        } else {
            log.info("Login failure!!!" + responseJson);
        }
        return sessionId;
    }

    /**
     * Fetch all rxt types supported by ES.
     * ex -: ebook, gadgets.
     * @return String array
     * @throws StoreAssetClientException
     */
    private String[] getRxtTypes() throws StoreAssetClientException {

        String apiUrl = hostUrl + ArtifactUploadClientConstants.RXT_URL;
        if (log.isDebugEnabled()) {
            log.debug("Fetch RXT Types Url:" + apiUrl);
        }

        HttpGet httpGet = new HttpGet(apiUrl);
        CloseableHttpClient httpClient = clientBuilder.build();
        CloseableHttpResponse response = null;
        String responseJson;
        String[] arrRxt;

        try {
            response = httpClient.execute(httpGet, httpContext);
            responseJson = EntityUtils.toString(response.getEntity());
        } catch (IOException ioException) {
            String errorMsg = "Error in getting RXT types allow for ES";
            log.error(errorMsg, ioException);
            throw new StoreAssetClientException(errorMsg, ioException);
        } finally {
            IOUtils.closeQuietly(response);
            IOUtils.closeQuietly(httpClient);
        }
        if (log.isDebugEnabled()) {
            log.debug("RXT types:" + responseJson);
        }
        arrRxt = gson.fromJson(responseJson, String[].class);
        return arrRxt;
    }

    /**
     * Fetch attributes of given type for given rxt type.
     * ex -: rxt type is gadget and type is "file"
     *       returns thumbnail_image and banner_image.
     * @param rxtType RXT Type
     * @param type Type need to check ex -: file, text
     * @return List of rxt attributes which related to passed type
     * @throws StoreAssetClientException
     */
    private List<String> getAttributesForType(String rxtType, String type) throws StoreAssetClientException {

        String apiUrl = hostUrl + ArtifactUploadClientConstants.RXT_ATTRIBUTES_FOR_GIVEN_TYPE + "/" + rxtType
                + "/" + type;

        if (log.isDebugEnabled()) {
            log.debug("RXT Type:" + rxtType);
            log.debug("Type:" + type);
            log.debug("Type attributes for RXT API Url:" + apiUrl);
        }

        HttpGet httpGet = new HttpGet(apiUrl);
        CloseableHttpClient httpClient = clientBuilder.build();
        CloseableHttpResponse response = null;
        String responseJson;
        String[] attrArr;

        try {
            response = httpClient.execute(httpGet, httpContext);
            responseJson = EntityUtils.toString(response.getEntity());
        } catch (IOException ioException) {
            String errorMsg = "Error in get RXT attributes for rxt type";
            log.error(errorMsg, ioException);
            throw new StoreAssetClientException(errorMsg, ioException);
        } finally {
            IOUtils.closeQuietly(response);
            IOUtils.closeQuietly(httpClient);
        }
        attrArr = gson.fromJson(responseJson, String[].class);
        if (log.isDebugEnabled()) {
            log.debug("Attributes for RXT type:" + responseJson);
        }
        return Arrays.asList(attrArr);
    }

    /**
     * Reads the folder structure under the resources directory.
     * If json file found, read and unmarshalling asset details into array.
     * File can contains multiple asset details as an array.
     * Call upload asset method.
     * @param dir resources directory
     */
    private void readAssets(File dir) {

        Asset[] assetArr;
        BufferedReader br;
        JsonParser parser;
        JsonArray jsonArray;

        for (final File file : dir.listFiles()) {
            if (file.isFile()) {
                //check files exists with .asset extension in the directory
                if (file.getName().endsWith(ArtifactUploadClientConstants.RESOURCE_FILE_TYPE)){
                    try {
                        br = new BufferedReader(new FileReader(file));
                        parser = new JsonParser();
                        jsonArray = (JsonArray) parser.parse(br).getAsJsonObject().get("assets");
                        assetArr = gson.fromJson(jsonArray, Asset[].class);
                        uploadAssets(assetArr, dir);
                    } catch (FileNotFoundException ex) {
                        log.error("File not found " + file.getName());
                    }
                }
            }
            if (file.list() != null && file.list().length > 0) {
                readAssets(file);
            }
        }
    }

    /**
     * Upload assets to ES
     * POST asset details to asset upload REST API
     * If attribute is a physical file seek a file in a resources directory and upload as multipart attachment.
     * @param assetArr Array of assets
     * @param dir resource files directory
     */
    private void uploadAssets(Asset[] assetArr, File dir) {

        HashMap<String, String> attrMap;
        MultipartEntityBuilder multiPartBuilder;
        List<String> fileAttributes;

        File imageFile;
        String responseJson;
        StringBuilder publisherUrlBuilder;

        String uploadUrl = hostUrl + ArtifactUploadClientConstants.PUBLISHER_URL + "/";
        HttpPost httpPost;
        CloseableHttpClient httpClient = clientBuilder.build();
        CloseableHttpResponse response = null;

        for (Asset asset : assetArr) {
            publisherUrlBuilder = new StringBuilder();
            if (asset.getId() != null) {
                publisherUrlBuilder.append(uploadUrl).append(asset.getId()).append("?type=").append(asset.getType());
            } else {
                publisherUrlBuilder.append(uploadUrl).append("?type=").append(asset.getType());
            }
            multiPartBuilder = MultipartEntityBuilder.create();
            multiPartBuilder.addTextBody("sessionId", sessionId);
            multiPartBuilder.addTextBody("asset", gson.toJson(asset));

            attrMap = asset.getAttributes();
            httpPost = new HttpPost(publisherUrlBuilder.toString());

            //get file type attributes list for asset type
            fileAttributes = rxtFileAttributesMap.get(asset.getType());
            for (String attrKey : attrMap.keySet()) {
                //check attribute one by one whether is it a file type
                if (fileAttributes != null && fileAttributes.contains(attrKey)) {
                    imageFile = new File(dir + File.separator + ArtifactUploadClientConstants.RESOURCE_DIR_NAME +
                            File.separator + attrMap.get(attrKey));
                    multiPartBuilder.addBinaryBody(attrKey, imageFile);
                }
            }
            httpPost.setEntity(multiPartBuilder.build());
            try {
                response = httpClient.execute(httpPost, httpContext);
                if (response.getStatusLine().getStatusCode() == HttpStatus.SC_CREATED) {
                    log.info("Asset " + asset.getName() + " uploaded successfully");
                } else if (response.getStatusLine().getStatusCode() == HttpStatus.SC_ACCEPTED) {
                    log.info("Asset " + asset.getName() + " updated successfully");
                } else {
                    responseJson = EntityUtils.toString(response.getEntity());
                    log.info("Asset " + asset.getName() + " not uploaded successfully " + responseJson);
                }
            } catch (IOException ex) {
                log.error("Asset Id:"+asset.getId()+" Name;"+asset.getName());
                log.error("Error in asset Upload", ex);
                log.debug("Asset upload fail:"+asset);
            } finally {
                IOUtils.closeQuietly(response);
            }
        }
        IOUtils.closeQuietly(response);
        IOUtils.closeQuietly(httpClient);
    }
}
