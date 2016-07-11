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
var $container = $(".com-container");
var getTextArea = function () {
    return $('.com-container #com-body');
};
var getMyReviewElement = function () {
    return $('.com-container .my-review');
};
var $stream = $('#stream');
var $firstReview = $('.com-first-review');
var getLoadingElement = function () {
    return $('.com-container .row.com-add div[class^="loading-"]');
};
var getAlertElement = function () {
    return $container.find('.com-alert');
};
var $sort = $('.com-sort');
var $lastReview = $('.load-more');
var $more = $('#more');
var $empty_list = $('#empty_list');
var windowProxy;
var publish = function (activity, onSuccess, onError) {
    if (activity.target) {
        activity.context = {
            "id": target
        };
    } else {
        activity.target = {
            "id": target
        };
    }
    var url = caramel.url('/apis/user-reviews');
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(activity),
        success: onSuccess,
        error: onError
    });
};
var showAlert = function (msg) {
    getAlertElement().html(msg).fadeIn("fast");
};
var showLoading = function (status) {
    if (status) {
        getAlertElement().html('').css('display', 'inline-block').addClass('com-alert-wait');
        getLoadingElement().fadeIn();
    } else {
        getAlertElement().hide().removeClass('com-alert-wait');
        getLoadingElement().fadeOut();
    }
};
$container.on('click', '#btn-post', function (e) {
    e.preventDefault();
    var disabled = $(this).hasClass('disabled');
    if (disabled) {
        showAlert("Rating required");
        return false;
    }
    var rating = $('.user-rating > .selected-rating').data();
    var review = getTextArea().val().trim();
    if (!rating) {
        showAlert("Rating required");
    } else {
        rating = rating.rating;
        var activity = {
            "verb": "post",
            "isMyComment": true,
            "object": {
                "objectType": "review",
                "content": review,
                rating: rating,
                "likes": {
                    "totalItems": 0
                },
                "dislikes": {
                    "totalItems": 0
                }
            }
        };
        $container.find('#btn-post').attr('disabled', 'disabled');
        showLoading(true);
        var pos = target.indexOf(':');
        var aid = target.substring(pos + 1);
        var type = target.substring(0, pos);
        var addAndRenderNew = function (successCallback, onError) {
            publish(activity, function (published) {
                myReview = published.myReview;
                if ($firstReview.length) {
                    $firstReview.hide();
                }
                if (published.success) {
                    showLoading(false);
                    activity.id = published.id;
                    activity.object.id = published.id;
                    //Remove carbon.super tenant domain from username
                    var pieces = user.split(/[\s@]+/);
                    if (pieces[pieces.length - 1] == 'carbon.super') {
                        user = pieces[pieces.length - 2];
                    }
                    activity.actor = {
                        id: user
                    };
                    usingTemplate(function (template) {
                        var newComment = template(activity);
                        getMyReviewElement().html('').html(newComment);
                        var sortBy = 'popular';
                        successCallback && successCallback(sortBy);
                    });
                }
            }, onError);
        };
        addAndRenderNew(function (sortBy) {
            redrawReviews(sortBy);
        }, function (error) {
            var errorMessage = JSON.parse(error.responseText).error;
            $('#btn-post[disabled]').removeAttr('disabled');
            $('.user-rating > .selected-rating').removeClass('selected-rating');
            notifyError(errorMessage);
        });
    }
});
$stream.on('click', '.thumbs-down-button', function (e) {
    if (!store.user) {
        return false;
    }
    e.preventDefault();
    var $review = $(e.target).parents(".com-review");
    var $tDownBtn = $review.find(".thumbs-down-button > .icon-thumbs-down");
    var id = $review.attr('data-target-id');
    var $tDownCount = $review.find('.com-dislike-count');
    var activity = {
        target: {
            id: id
        },
        object: {}
    };
    var $opposite = $review.find('.icon-thumbs-up');
    if ($opposite.hasClass('selected')) {
        var ulikeActivity = {
            target: {
                id: id
            },
            object: {}
        };
        var $likeCount = $review.find('.com-like-count');
        ulikeActivity.verb = 'unlike';
        publish(ulikeActivity, function () {
            $likeCount.text((Number($likeCount.text()) - 1) || '');
        });
        $opposite.removeClass('selected');
    }
    if ($tDownBtn.hasClass('selected')) {
        activity.verb = 'undislike';
        publish(activity, function () {
            $tDownCount.text((Number($tDownCount.text()) - 1) || '');
        });
        $tDownBtn.removeClass('selected');
    } else {
        activity.verb = 'dislike';
        publish(activity, function () {
            $tDownCount.text(Number($tDownCount.text()) + 1);
        });
        $tDownBtn.addClass('selected');
    }
});
$stream.on('click', '.thumbs-up-button', function (e) {
    if (!store.user) {
        return false;
    }
    e.preventDefault();
    var $review = $(e.target).parents(".com-review");
    var $tUpBtn = $review.find(".thumbs-up-button > .icon-thumbs-up");
    var id = $review.attr('data-target-id');
    var $likeCount = $review.find('.com-like-count');
    var activity = {
        target: {
            id: id
        },
        object: {}
    };
    var $opposite = $review.find('.icon-thumbs-down');
    if ($opposite.hasClass('selected')) {
        var uDislikeActivity = {
            target: {
                id: id
            },
            object: {}
        };
        var $uDislikeCount = $review.find('.com-dislike-count');
        uDislikeActivity.verb = 'undislike';
        publish(uDislikeActivity, function () {
            $uDislikeCount.text((Number($uDislikeCount.text()) - 1) || '');
        });
        $opposite.removeClass('selected');
    }
    if ($tUpBtn.hasClass('selected')) {
        activity.verb = 'unlike';
        publish(activity, function () {
            $likeCount.text((Number($likeCount.text()) - 1) || '');
        });
        $tUpBtn.removeClass('selected');
    } else {
        activity.verb = 'like';
        publish(activity, function () {
            $likeCount.text(Number($likeCount.text()) + 1);
        });
        $tUpBtn.addClass('selected');
    }
});
$more.on('click', '.load-more', function (e) {
    e.preventDefault();
    var offset = parseInt($('.load-more').attr("value"));
    var url = caramel.url('/apis/user-reviews');
    $.get(url, {
        target: target,
        sortBy: $('.com-sort .selected').attr('id'),
        offset: offset,
        limit: 10
    }, function (obj) {
        var reviews = obj || [];
        if (jQuery.isEmptyObject(reviews) || reviews.length < 10) {
            $more.hide();
            $empty_list.text("No more activities to retrieve.");
        }
        usingTemplate(function (template) {
            var str = "";
            for (var i = 0; i < reviews.length; i++) {
                var review = reviews[i];
                str += template(review);
            }
            $stream.append(str);
            //callback && callback();
            adjustHeight();
            $('.load-more').attr("value", parseInt(offset) + 10);
        });
    });
});
$container.on('click', '#btn-delete', function (e) {
    showLoading(true);
    e.preventDefault();
    var $deleteBtn = $(e.target);
    var $review = $deleteBtn.parents('.com-review');
    var id = $review.attr('data-target-id');
    var url = caramel.url('/apis/user-review/' + id);
    $.ajax({
        url: url,
        type: 'DELETE',
        success: function () {
            $('.com-review[data-target-id="' + id + '"]').fadeOut();
            $('.row.com-sort ').hide();
            caramel.partials({
                comment: '/extensions/app/social-reviews/themes/' + caramel.themer + '/partials/comment-input.hbs'
            }, function () {
                var template = Handlebars.partials['comment'];
                var commentInput = template({myReview: null, type: target.split(':')[0], ratings: [5, 4, 3, 2, 1]});
                $(".row.com-add").replaceWith(commentInput);
                if (!$stream.find('.row.com-review').length) {
                    $firstReview.show().removeClass('message-success').addClass('message-info');
                    var assetType = target.split(':')[0];
                    var msg = " Be the first one to review! ";
                    var icon = $("<i/>", {
                        class: "fw fw-info"
                    });
                    $firstReview.find('h4').empty().append(icon).append(msg);
                    msg = "Tell others what you think about this " + assetType;
                    $firstReview.find('p').html(msg);
                }
            });
        }
    });
});
$container.on('click', '#btn-update', function (e) {
    showLoading(true);
    e.preventDefault();
    var rating = $('.user-rating > .selected-rating').data().rating;
    var review = getTextArea().val().trim();
    var id = $(this).data('id');
    var url = caramel.url('/apis/user-review/' + id);
    var activityData = {
        verb: 'review',
        isMyComment: true,
        object: {
            objectType: 'review',
            id: id,
            rating: rating,
            content: review
        },
        target: {
            id: target
        }
    };
    $.ajax({
        url: url,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(activityData),
        success: function (updatedActivity) {
            myReview = updatedActivity;
            usingTemplate(function (template) {
                var newComment = template(updatedActivity);
                getMyReviewElement().html('').html(newComment);
            });
            showLoading(false);
        }
    });
});
$container.on('click', '#btn-edit', function (e) {
    showLoading(true);
    var myComment = getMyReviewElement();
    var rating = myComment.find('.com-rating').data('rating');
    var review = myComment.find('.com-content').html().trim();
    var id = myComment.find('.com-review').data('target-id');
    var editable = {
        rating: rating,
        review: review,
        id: id
    };
    e.preventDefault();
    $('.com-review[data-target-id="' + id + '"]').fadeOut();
    caramel.partials({
        comment: '/extensions/app/social-reviews/themes/' + caramel.themer + '/partials/comment-input.hbs'
    }, function () {
        var template = Handlebars.partials['comment'];
        var commentInput = template(
            {myReview: null, type: target.split(':')[0], ratings: [5, 4, 3, 2, 1], editable: editable});
        $(".row.com-add").replaceWith(commentInput);
    });
});
$container.on('click', '#btn-cancel', function (e) {
    showLoading(true);
    usingTemplate(function (template) {
        var newComment = template(myReview);
        getMyReviewElement().html('').html(newComment);
    });
    showLoading(false);
});
$container.on('click', '.rating-star', function () {
    getAlertElement().html('').fadeOut("fast");
    $('#btn-post.disabled').removeClass('disabled');
    $(this).siblings().removeClass("selected-rating");
    $(this).addClass("selected-rating");
});
$stream.niceScroll();
