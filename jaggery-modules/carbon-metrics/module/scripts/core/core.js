/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
var metrics = {};
(function (metrics) {
    var log = new Log('carbon.metrics');
    var MetricManager = org.wso2.carbon.metrics.manager.MetricManager;
    var WSO2_CONSTANT_METRIC_ENABLED = 'wso2.metrics.enabled';
    var WSO2_CONSTANT_METRIC_TRACE_LOGS_ENABLED = 'wso2.metrics.trace.logs.enabled';
    var WSO2_CONSTANT_METRIC_APP_NAME = 'wso2.metrics.app.name';
    var UUID = Packages.java.util.UUID;

    metrics.init = function (app,options) {
        var metricsConfiguration = options.metrics || {};
        application.put(WSO2_CONSTANT_METRIC_ENABLED, metricsConfiguration.enabled || false);
        application.put(WSO2_CONSTANT_METRIC_TRACE_LOGS_ENABLED, metricsConfiguration.enableTraceLogs || false);
        application.put(WSO2_CONSTANT_METRIC_APP_NAME,app.toUpperCase() || 'UNKNOWN');
    };
    /**
     * Checks whether metrics has been enabled by first checking for a global
     * variable and if not present tries to obtain the enable state from the application
     * context
     * @return {Boolean} [description]
     */
    var isEnabled = function () {
        if (typeof WSO2_METRICS_ENABLED === 'undefined') {
            WSO2_METRICS_ENABLED = application.get(WSO2_CONSTANT_METRIC_ENABLED);
        }
        return WSO2_METRICS_ENABLED;
    };
    var isTraceLogsEnabled = function(){
        if(typeof WSO2_METRIC_TRACE_LOGS_ENABLED === 'undefined'){
            WSO2_METRIC_TRACE_LOGS_ENABLED = application.get(WSO2_CONSTANT_METRIC_TRACE_LOGS_ENABLED);
        }
        return WSO2_METRIC_TRACE_LOGS_ENABLED;
    };
    var uuid = function () {
        return UUID.randomUUID().toString();
    };

    /**
     * :Depricated No need to add unique ID for every request, since we do not consider taking measurements on
     * individual request.
     * @returns {String} WSO2_METRICSID
     */
    var getTransactionID = function () {
        if (typeof WSO2_METRICSID === 'undefined') {
            WSO2_METRICSID = uuid();
        }
        return WSO2_METRICSID;
    };
    var getAppName = function(){
        if (typeof WSO2_METRICS_APP_NAME === 'undefined') {
            WSO2_METRICS_APP_NAME =  application.get(WSO2_CONSTANT_METRIC_APP_NAME);
        }
        return WSO2_METRICS_APP_NAME;
    };
    metrics.start = function () {
        if (!isEnabled()) {
            return;
        }
        var args = Array.prototype.slice.call(arguments);
        //log.info('metrics:start');
        this.startTimer.call(this, args);
    };
    metrics.stop = function () {
        if (!isEnabled()) {
            return;
        }
        //log.info('metrics:stop');
        this.stopTimer();
    };
    metrics.isTraceLogsEnabled = function(){
        return isTraceLogsEnabled();
    };
    metrics.trace = function(){
        if(!isTraceLogsEnabled()){
            return;
        }
        var template = [getAppName(),'[TID:',getTransactionID(),']'].join(' ');
        var userArgs = Array.prototype.slice.call(arguments);
        log.info(template+userArgs.join(' '));
    };
}(metrics));