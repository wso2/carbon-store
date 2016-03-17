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
    var pushTimer = function(timer) {
        if (WSO2_METRICS_TIMERS === undefined) {
            WSO2_METRICS_TIMERS = [];
        }
        WSO2_METRICS_TIMERS.push(timer);
        return;
    };
    var popTimer = function() {
        if (WSO2_METRICS_TIMERS === undefined) {
            return null; //Do nothing since there are no timers
        }
        return WSO2_METRICS_TIMERS.pop();
    };
    var name = function(args) {
        return args.join('.');
    };
    metrics.startTimer = function() {
        try {
            var timerName = name(arguments);
            var timer = MetricManager.timer(timerName);
            log.info('[wso2 metrics] created timer ' + timerName);
            timer.start();
            log.info('[wso2 metrics] started timer ' + timerName);
            pushTimer(timer);
        } catch (e) {
            log.error('wso2 metrics failed when creating timer ', e);
        }
    };
    metrics.stopTimer = function() {
        try {
            var timer = popTimer();
            if (timer) {
                timer.stop();
            }
        } catch (e) {
            log.error('wso2 metrics framework has failed when stopping timer', e);
        }
    };
}(metrics));