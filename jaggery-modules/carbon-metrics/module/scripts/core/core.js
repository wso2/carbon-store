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
(function(metrics){
    var log = new Log('carbon.metrics');
    var MetricManager = org.wso2.carbon.metrics.manager.MetricManager;
    var Level = org.wso2.carbon.metrics.manager.Level;
    var UUID = require('uuid');
    //var timer = carbonMetrics.timer(metricsLevel.INFO, carbonMetrics.name(this.constructor.name, "get-id:timer"));

    metrics.createMetric = function(metricType, metricName, metricLevel) {
        return MetricManager[metricType](metricName);
    };

    var generate;
    metrics.start = function(){
        WSO2_METRICSID = Packages.java.util.UUID.randomUUID().toString();
        log.info('Created ID ' + WSO2_METRICSID);
    };

    metrics.stop = function(){
        log.info("Stop method called");
        log.info('Metrics ID '+ WSO2_METRICSID);
    };

}(metrics));