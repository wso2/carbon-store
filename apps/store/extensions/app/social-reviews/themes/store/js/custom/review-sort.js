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
var $stream = $stream || $('#stream');
var $more = $('#more');
var $empty_list = $('#empty_list');
var usingTemplate = function(callback) {
    caramel.partials({
        activity: '/extensions/app/social-reviews/themes/' + caramel.themer + '/partials/activity.hbs'
    }, function() {
        callback(Handlebars.partials['activity']);
    });
};
var redrawReviews = function (sortBy, callback) {
    $('.com-sort .selected').removeClass('selected');
    var url = caramel.url('/apis/user-reviews');
    $.get(url, {
        target: target,
        sortBy: sortBy,
        offset: 0,
        limit: 10,
        cacheBuster: generateCacheBuster()
    }, function (obj) {
        var reviews = obj || [];
        usingTemplate(function (template) {
            var str = "";
            for (var i = 0; i < reviews.length; i++) {
                var review = reviews[i];
                if (!review.isMyComment) {
                    str += template(review);
                }
            }
            if (str) {
                $sort.removeClass('com-sort-hidden');
                $('#'+sortBy).addClass('selected');
                $stream.html(str);
                $('.load-more').attr("value", 10);
                $more.show();
                $empty_list.text("");
            } else {
                $firstReview.show().removeClass('message-info').addClass('message-success');
                var assetType = target.split(':')[0];
                var msg = "You are the first to review this " + assetType;
                var icon = $("<i/>", {
                    class: "fw fw-success"
                });
                $firstReview.find('h4').empty().append(icon).append(msg);
                $firstReview.find('p').empty();
            }
            //callback && callback();
            adjustHeight();
        });
    })
};
var notifyError = function (error) {
    messages.alertError(error);
    $('#btn-post.disabled').removeClass('disabled');
    showLoading(false)
};
/**
 * IE 11 caches AJAX requests, in order to by pass this behaviour
 * the request URIs must be unique.This is achieved by generating 
 * a random query string
 */
var generateCacheBuster = function(){
    return new Date().getTime();
};
$(document).on('click', '.com-sort a', function(e) {
    var $target = $(e.target);
    if (!$target.hasClass('selected')) {
        redrawReviews($target.text().toUpperCase());
        $target.addClass('selected');
    }
});