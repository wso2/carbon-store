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
    var context ;
    var pushTimer = function(timer) {
        if (typeof WSO2_METRICS_TIMERS === 'undefined') {
            WSO2_METRICS_TIMERS = [];
        }
        WSO2_METRICS_TIMERS.push(timer);
        return;
    };
    var popTimer = function() {
        if (typeof WSO2_METRICS_TIMERS === 'undefined') {
            return null; //Do nothing since there are no timers
        }
        return WSO2_METRICS_TIMERS.pop();
    };
    var getlastInvocation = function(){
       if(typeof(WSO2_METRICS_LAST_INVOCATION) === 'undefined'){
           return '';
       }
        return WSO2_METRICS_LAST_INVOCATION.pop();
    };
    var setLastInvocation = function(name){
        if(typeof(WSO2_METRICS_LAST_INVOCATION) === 'undefined'){
            WSO2_METRICS_LAST_INVOCATION = [];
        }
        WSO2_METRICS_LAST_INVOCATION.push(name);
    };
    var lastInvocation = function(name){
        if(name){
            setLastInvocation(name);
        } else{
            return getlastInvocation();
        }
    };
    var name = function(tid,names) {
        //log.info("DEBUG: tid = "+stringify(tid));
        var last = lastInvocation();
        if(last){
            return last + '.' + names.join('.');
        }
        last = tid+'.'+names.join('.');
        lastInvocation(last);
        //log.info("DEBUG: name function in timers: "+last);
        return last;
    };
    metrics.startTimer = function(tid,names) {
        try {
            var timerName = name(tid,names);
            var timer = MetricManager.timer(Level.INFO,timerName);
            //log.info('[wso2 metrics] created timer ' + timerName);
            context = timer.start();
            //log.info('[wso2 metrics] started timer ' + timerName);
            pushTimer(context);
        } catch (e) {
            log.error('wso2 metrics failed when creating timer ', e);
        }
    };
    metrics.stopTimer = function() {
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