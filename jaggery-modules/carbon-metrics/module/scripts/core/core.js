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
(function(metrics) {
    var log = new Log('carbon.metrics');
    var MetricManager = org.wso2.carbon.metrics.manager.MetricManager;
    var WSO2_CONSTANT_METRIC_ENABLED = 'wso2.metrics.enabled';
    var UUID = Packages.java.util.UUID;
    /**
     * Checks whether metrics has been enabled by first checking for a global
     * variable and if not present tries to obtain the enable state from the application
     * context
     * @return {Boolean} [description]
     */
    var isEnabled = function() {
        if (typeof WSO2_METRICS_ENABLED === 'undefined') {
            WSO2_METRICS_ENABLED = application.get(WSO2_CONSTANT_METRIC_ENABLED);
        }
        return WSO2_METRICS_ENABLED;
    };
    var uuid = function() {
        return UUID.randomUUID().toString();
    };
    var getTransactionID = function() {
        if (typeof WSO2_METRICSID === 'undefined') {
            WSO2_METRICSID = uuid();
        }
        return WSO2_METRICSID;
    };
    metrics.start = function() {
        if (!isEnabled()) {
            return;
        }
        //log.info('metrics:start TID ' + getTransactionID() + ']');
        //log.info('DEBUG: metrics start arguments = ' + stringify(arguments));
        var args = Array.prototype.slice.call(arguments);
        this.startTimer.call(this,getTransactionID(),args);
    };
    metrics.stop = function() {
        if (!isEnabled()) {
            return;
        }
        //log.info('metrics:stop [TID ' + getTransactionID() + ']');
        this.stopTimer();
    };
    metrics.init = function(options) {
        var metricsConfiguration = options.metrics || {};
        application.put(WSO2_CONSTANT_METRIC_ENABLED, metricsConfiguration.enabled || false);
    };
}(metrics));