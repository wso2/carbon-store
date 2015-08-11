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
//FIX for registry mount scenario - check WSO2_REGISTRY_DB existence
var dataSourceName = "WSO2_CARBON_DB";
var DataSourceManager = Packages.org.wso2.carbon.ndatasource.core.DataSourceManager;
var carbonDataSource = DataSourceManager.getInstance().getDataSourceRepository().getDataSource("WSO2_REGISTRY_DB");

if(carbonDataSource){
    dataSourceName = "WSO2_REGISTRY_DB";
}
var server = require('store').server;
var log = new Log('statistics-api');
var db = server.privileged(function() {
    var localdb = new Database(dataSourceName);
    return localdb;
});
/**
 * Executes a query to obtain all of the bookmarks for a given user
 * @param  {String} loggedInUser  The user for which the bookmark details must be returned
 * @param  {Number} currentTenant The tenant Id to which the user belongs
 * @return {Array}               A query result set which represents the bookmarks of the provided user
 */
var executeBookmarkStatsQuery = function(loggedInUser, currentTenant) {
    //Temporary fix as defautls assets are deployed as wso2.system.user
    /*if (loggedInUser == 'admin') {
        loggedInUser = 'wso2.system.user';
    }*/
    var query = "SELECT RR.REG_NAME AS ASSET_ID,COUNT(RR.REG_NAME) AS NO_OF_BOOKMARKS " + "FROM REG_RESOURCE RS " + "JOIN REG_RESOURCE RR ON RS.REG_UUID=RR.REG_NAME " + "JOIN REG_PATH RP ON  RR.REG_PATH_ID = RP.REG_PATH_ID " + "WHERE RS.REG_CREATOR = '" + loggedInUser + "' AND " + "RR.REG_TENANT_ID = '" + currentTenant + "' AND " + "RP.REG_PATH_VALUE like '/_system/governance/users/%' AND " + "RR.REG_NAME IS NOT NULL GROUP BY RR.REG_NAME";
    return db.query(query);
};
/**
 * Executes a query to obtain the hot asset bookmark details for a given time frame
 * @param  {[type]} startDate     The start date to be queried (E.g. format 2015-02-17 14:50:44.701)
 * @param  {[type]} endDate       The end date to be queried (E.g. format 2015-02-17 14:50:44.701)
 * @param  {Number} currentTenant An integer tenant Id (E.g. -1234)
 * @return {Array}               A query result set which represents the hot asset bookmarks for the provided time period
 */
var executeHotAssetStatsQuery = function(currentTenant) {
    var query = "SELECT RR.REG_NAME AS ASSET_ID,COUNT(RR.REG_NAME) AS NO_OF_BOOKMARKS " + "FROM REG_RESOURCE RS " + "JOIN REG_RESOURCE RR ON RS.REG_UUID=RR.REG_NAME " + "JOIN REG_PATH RP ON  RR.REG_PATH_ID = RP.REG_PATH_ID " + "WHERE RP.REG_PATH_VALUE like '/_system/governance/users/%' AND " + "RR.REG_TENANT_ID = '" + currentTenant + "' AND " + "RR.REG_NAME IS NOT NULL " + "GROUP BY RR.REG_NAME";
    return db.query(query);
}
var filterResultsByAssetType = function(array, type, am) {
/*    return array.filter(function(el) {
        return el.ASSET_TYPE == 'application\/vnd.wso2-' + type + '+xml';
    });*/
    var filteredArry = [];
    for (var index = 0; index < array.length; index++) {
        var aid = array[index].ASSET_ID;
        try{
            var asset = am.get(aid);
            if(asset.type == type){
                filteredArry.push(array[index]);
            }
        }catch(e){
            if (log.isDebugEnabled) {
                log.debug('Unable to obtain stat details for ' + aid, e);
            }
        }
    }
    return filteredArry;
}
var normalizeDate = function(dateValue){
    var date = new Date(dateValue);
    var yyyy = date.getFullYear();
    var mm = date.getMonth()+1; //offset January been 1
    var dd = date.getDate();
    var hh = date.getHours();
    var mn = date.getMinutes();
    var ss = date.getSeconds();
    var ms = date.getMilliseconds();
    return yyyy+'-'+mm+'-'+dd+' '+hh+':'+mn+':'+ss+'.'+ms;
};
var getTodaysDate = function(){
    var today = new Date();
    return normalizeDate(today.toString());
};
/**
 * The function converts a string representation of an integer to an integer.If
 * the parsing fails due to the value been not a number a default value of 0 is returned
 * @param  {String} value A string representation of an integer
 * @return {Number}       An integer representation of the provided string
 */
var tryParseInt = function(value) {
    value = value || '0';
    try {
        return parseInt(value);
    } catch (e) {
        return 0;
    }
};
var buildAssetName = function(name, version) {
    return name + '-' + version;
};
var fillAssetDetails = function(assetStatInfo, stats, ticks, am, index) {
    var asset;
    var assetName;
    var assetVersion;
    var aid = assetStatInfo.ASSET_ID;
    var numOfBookmarks = assetStatInfo.NO_OF_BOOKMARKS;
    try {
        asset = am.get(aid);
        assetName = am.getName(asset);
        assetVersion = am.getVersion(asset);
        stats.push([index, numOfBookmarks]);
        ticks.push([index, buildAssetName(assetName, assetVersion)]);
    } catch (e) {
        if (log.isDebugEnabled) {
            log.debug('Unable to obtain stat details for ' + aid, e);
        }
    }
};
var fillAssetsDetails = function(results, am, type) {
    //The stat details contain information on all asset types so this
    //result set must be filtered by type
    var stats = filterResultsByAssetType(results, type, am);
    var ticks = [];
    var statData = [];
    var output = {};
    for (var index = 0; index < stats.length; index++) {
        fillAssetDetails(stats[index], statData, ticks, am, index);
    }
    output.stats = statData;
    output.ticks = ticks;
    return output;
};
var getBookmarkAssetStats = function(options) {
    var am = options.am;
    var loggedInUser = options.username;
    var tenantId = options.tenantId;
    var type = options.type;
    if (!am) {
        throw 'Unable to obtain Bookmark stats without an asset manager';
    }
    log.info('Retrieving bookmark stats for user:'+loggedInUser+' tenantId: '+tenantId);
    var bookmarkStats = executeBookmarkStatsQuery(loggedInUser, tenantId);
    //Stats must be enriched with asset details 
    var results = fillAssetsDetails(bookmarkStats, am, type);
    var output = {};
    output.bookmarkStats = results.stats;
    output.bookmarkTicks = results.ticks;
    return output;
};
var getHotAssetStats = function(options) {
    var am = options.am;
    var type = options.type;
    //var startDate = options.startDate;
    //var endDate = options.endDate;
    var tenantId = options.tenantId;
    var hotAssetStats;
    var results;
    /*log.info('Obtaining hot asset stats for start date: '+startDate+' end date: '+endDate);
    if(log.isDebugEnabled){
        log.debug('Obtaining hot asset stats for start date: '+startDate+' end date: '+endDate);
    }*/
    if (!am) {
        throw 'Unable to obtain Hot asste stats without an asset manager';
    }
    var hotAssetStats = executeHotAssetStatsQuery(tenantId);
    //Stats must be enriched with asset details 
    var results = fillAssetsDetails(hotAssetStats, am, type);
    var output = {};
    output.hotAssetStats = results.stats;
    output.hotAssetTicks = results.ticks;
    return output;
};