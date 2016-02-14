var ReviewUtils={};
(function(ReviewUtils) {
    var SOCIAL_OSGI_SERVICE = 'org.wso2.carbon.social.core.service.SocialActivityService';
    var REVIEW_PAGE_LIMIT = 10;
    var REVIEW_PAGE_OFFSET = 0;
    var log = new Log('reviews-api');
    var carbon = require('carbon');
    var getSocialSvc = function() {
        var carbon = require('carbon');
        return carbon.server.osgiService(SOCIAL_OSGI_SERVICE);
    };
    var cleanUsername = function(username) {
        return username.replace("@carbon.super", "");
    }
    var formatUsername = function(user) {
        var domain = user ? carbon.server.tenantDomain({tenantId:user.tenantId}) : null;
        return (user && domain) ? (String(user.username) + '@' + domain) : 'anonymous';
    };
    var buildPagination = function(paging) {
        paging = paging || {};
        paging.sortBy = paging.sortBy ? paging.sortBy.toUpperCase() : 'NEWEST';
        paging.offset = paging.offset ? paging.offset : REVIEW_PAGE_OFFSET;
        paging.limit = paging.limit ? paging.limit : REVIEW_PAGE_LIMIT;
        return paging;
    };
    var processUserReviews = function(socialSvc, user, reviews) {
        var review;
        var formattedUsername = formatUsername(user);
        var usernameOnReview;
        for (var index = 0; index < reviews.length; index++) {
            review = reviews[index];
            usernameOnReview = review.actor.id;
            review.actor.id = cleanUsername(review.actor.id);
            //Only populate review details if there is a logged in
            //user
            if (user) {
                review.iLike = socialSvc.isUserliked(usernameOnReview, review.object.id, 1);;
                review.iDislike = socialSvc.isUserliked(usernameOnReview, review.object.id, 0);;
                review.isMyComment = (usernameOnReview === formatUsername(user)) ? true : false;
            }
        }
        return reviews;
    };
    ReviewUtils.listReviews = function(target, user, userPagination) {
        var socialSvc = getSocialSvc();
        var paging = buildPagination(userPagination || {});
        var obj = JSON.parse(String(socialSvc.getSocialObjectJson(target, paging.sortBy, paging.offset, paging.limit)));
        return processUserReviews(socialSvc,user,obj.attachments || []);
    };
    ReviewUtils.createUserReview = function(review) {
        var socialSvc = getSocialSvc();
        var reviewJSON = JSON.stringify(review);
        log.info('Review JSON '+reviewJSON);
        var id = socialSvc.publish(reviewJSON);
        var result = {};
        result.id = id;
        result.success = result.id ?  true : false;
        return result;
    };
    ReviewUtils.deleteUserReview = function(assetId) {};
    /**
     * Creates the target string which is used to retrieve social resources
     */
    ReviewUtils.createTargetFromAssetId = function(id,type){
        return type+':'+id;
    };
    ReviewUtils.hasMoreReviews = function(reviews){
        reviews = reviews || [];
        return reviews.length > REVIEW_PAGE_LIMIT;
    };
    ReviewUtils.formatUsername = function(user){
        return formatUsername(user);
    };
}(ReviewUtils));