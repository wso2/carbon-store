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
(function(metrics) {
    var MetricManager = org.wso2.carbon.metrics.manager.MetricManager;
    var Level = org.wso2.carbon.metrics.manager.Level;
    var pushContext = function(timer) {
        if (typeof WSO2_METRICS_TIMERS === 'undefined') {
            WSO2_METRICS_TIMERS = [];
        }
        WSO2_METRICS_TIMERS.push(timer);
    };
    var popContext = function() {
        if (typeof WSO2_METRICS_TIMERS === 'undefined') {
            return null; //Do nothing since there are no timers
        }
        return WSO2_METRICS_TIMERS.pop();
    };
    var getlastInvocation = function() {
        if (typeof(WSO2_METRICS_LAST_INVOCATION) === 'undefined') {
            return '';
        }
        return WSO2_METRICS_LAST_INVOCATION.pop();
    };
    var setLastInvocation = function(name) {
        if (typeof(WSO2_METRICS_LAST_INVOCATION) === 'undefined') {
            WSO2_METRICS_LAST_INVOCATION = [];
        }
        WSO2_METRICS_LAST_INVOCATION.push(name);
    };
    var lastInvocation = function(name) {
        if (name) {
            setLastInvocation(name);
        } else {
            return getlastInvocation();
        }
    };
    var name = function(names) {
        return names.join('.');
    };
    metrics.startTimer = function(names) {
        try {
            var timerName = name(names);
            var timer = MetricManager.timer(Level.INFO, timerName);
            var context = timer.start();
            var entry = {};
            entry.context = context;
            entry.name = timerName;
            pushContext(entry);
        } catch (e) {
            log.error('carbon-metrics failed when creating timer ', e);
        }
    };
    metrics.stopTimer = function() {
        try {
            var entry = popContext();
            var time;
            if (entry) {
                time = entry.context.stop();
                metrics.trace(entry.name,time/1000000.0, 'ms');
            }
        } catch (e) {
            log.error('carbon-metrics framework has failed when stopping timer', e);
        }
    };
}(metrics));