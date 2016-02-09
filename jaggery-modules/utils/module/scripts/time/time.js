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
var time = {};
(function(time) {
    time.getCurrentTime = function(dateLength) {
    	var dateLength=dateLength||20;
        var now = new String(new Date().valueOf());
        var length = now.length;
        var prefix = dateLength;
        var onsetVal = '';
        if (length != prefix) {
            var onset = prefix - length;
            for (var i = 0; i < onset; i++) {
                onsetVal += '0';
            }
        }
        return onsetVal + now;
    };

    /***
     * This method is used to get the difference between two timestamps
     *
     * @param date
     * @returns {string}
     */
    time.formatTimeAsTimeSince = function(date) {
        var secs = Math.floor((new Date() - date) / 1000);
        var minutes = secs / 60;
        secs = Math.floor(secs % 60);
        if (minutes < 1) {
            return new FormattedTimeText(secs,(secs > 1 ? ' seconds ago' : ' second ago'));
        }
        var hours = minutes / 60;
        minutes = Math.floor(minutes % 60);
        if (hours < 1) {
            return new FormattedTimeText(minutes,(minutes > 1 ? ' minutes ago' : ' minute ago'));
        }
        var days = hours / 24;
        hours = Math.floor(hours % 24);
        if (days < 1) {
            return new FormattedTimeText(hours,(hours > 1 ? ' hours ago' : ' hour ago'));
        }
        var weeks = days / 7;
        days = Math.floor(days % 7);
        if (weeks < 1) {
            return new FormattedTimeText(days,(days > 1 ? ' days ago' : ' day ago'));
        }
        var months = weeks / 4.35;
        weeks = Math.floor(weeks % 4.35);
        if (months < 1) {
            return new FormattedTimeText(weeks,(weeks > 1 ? ' weeks ago' : ' week ago'));
        }
        var years = months / 12;
        months = Math.floor(months % 12);
        if (years < 1) {
            return new FormattedTimeText(months,(months > 1 ? ' months ago' : ' month ago'));
        }
        years = Math.floor(years);
        return new FormattedTimeText(years,(years > 1 ? ' years ago' : ' year ago'));
    };

    function FormattedTimeText(timeUnit,timeMessage) {
        this.timeUnit = timeUnit;
        this.timeMessage = timeMessage;
    }

    FormattedTimeText.prototype.toString = function FormattedTimeTextString() {
        return this.timeUnit + this.timeMessage;
    }

}(time));