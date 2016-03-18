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
(function (metrics) {
    var MetricManager = org.wso2.carbon.metrics.manager.MetricManager;
    var Level = org.wso2.carbon.metrics.manager.Level;
    var context;
    var pushTimer = function (timer) {
        if (typeof WSO2_METRICS_TIMERS === 'undefined') {
            WSO2_METRICS_TIMERS = [];
        }
        WSO2_METRICS_TIMERS.push(timer);
    };
    var popTimer = function () {
        if (typeof WSO2_METRICS_TIMERS === 'undefined') {
            return null; //Do nothing since there are no timers
        }
        return WSO2_METRICS_TIMERS.pop();
    };
    var getlastInvocation = function () {
        if (typeof(WSO2_METRICS_LAST_INVOCATION) === 'undefined') {
            return '';
        }
        return WSO2_METRICS_LAST_INVOCATION.pop();
    };
    var setLastInvocation = function (name) {
        if (typeof(WSO2_METRICS_LAST_INVOCATION) === 'undefined') {
            WSO2_METRICS_LAST_INVOCATION = [];
        }
        log.info("DEBUG: setLastInvocation : WSO2_METRICS_LAST_INVOCATION " + stringify(WSO2_METRICS_LAST_INVOCATION) + " Name :" + name);
        WSO2_METRICS_LAST_INVOCATION.push(name);
    };
    var lastInvocation = function (name) {
        if (name) {
            setLastInvocation(name);
        } else {
            return getlastInvocation();
        }
    };
    var name = function (names) {
        log.info("DEBUG: name function names: " + names);
        var last = lastInvocation();
        last = last ? last + '.' + names.join('.') : names.join('.');
        log.info("DEBUG: name function last: " + last);
        lastInvocation(last);
        return last;
    };
    metrics.startTimer = function (names) {
        try {
            var timerName = name(names);
            var timer = MetricManager.timer(Level.INFO, timerName);
            //log.info('[wso2 metrics] created timer ' + timerName);
            context = timer.start();
            //log.info('[wso2 metrics] started timer ' + timerName);
            pushTimer(context);
        } catch (e) {
            log.error('wso2 metrics failed when creating timer ', e);
        }
    };
    metrics.stopTimer = function () {
        try {
            var context = popTimer();
            if (context) {
                context.stop();
            }
        } catch (e) {
            log.error('wso2 metrics framework has failed when stopping timer', e);
        }
    };
}(metrics));