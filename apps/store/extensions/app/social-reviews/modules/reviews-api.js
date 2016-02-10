var api;
(function() {
    var SOCIAL_OSGI_SERVICE = 'org.wso2.carbon.social.core.service.SocialActivityService';
    var getSocialSvc = function() {
        var carbon = require('carbon');
        return carbon.server.osgiService(OSGI_SERVICE);
    };
    var cleanUsername = function(username) {
        return username.replace("@carbon.super", "");
    }
    var formatUsername = function(user) {
        return String(user.username) + '@' + user.tenantDomain;
    };
    var processUserReviews = function(socialSvc, user, reviews) {
        var review;
        var formattedUsername = formattedUsername(user);
        var usernameOnReview;
        for (var index = 0; index < reviews.length; index++) {
            review = reviews[index];
            usernameOnReview = formatUsername(review.actor.id);
            review.actor.id = cleanUsername(review.actor.id);
            //Only populate review details if there is a logged in
            //user
            if (user) {
                review.iLike = socialSvc.isUserliked(usernameOnReview, review.object.id, 1);;
                review.iDislike = socialSvc.isUserliked(usernameOnReview, review.object.id, 0);;
                review.isMyComment = (usernameOnReview === formatUsername(user)) ? true : false;
            }
        }
    };
    api.getUserReviews = function(assetId, user, pagination) {
    	var socialSvc = getSocialSvc();
        var obj = JSON.parse(String(socialSvc.getSocialObjectJson(target, sortBy.toUpperCase(), offset, limit)));
    };
    api.createUserReview = function(assetId, review) {};
    api.deleteUserReview = function(assetId) {};
}(api));