var api = {};
(function(api) {
    var rxtModule = require('rxt');
    var utilsModule = require('utils');
    var ReviewUtils = require('/extensions/app/social-reviews/modules/reviews-utils.js').ReviewUtils;
    var ReqUtils = utilsModule.request;
    var constants = rxtModule.constants;
    var store = require('store');
    var log = new Log('reviews-api');
    var HTTP_GET_METHOD = 'GET';
    var HTTP_POST_METHOD = 'POST';
    var HTTP_DELETE_METHOD = 'DELETE';
    var resolveGET = function(req, res, session) {
        var opts = ReqUtils.getQueryOptions(req.getQueryString());
        var errors = [];
        var server = store.server;
        var user = server.current(session);
        log.info('### RETRIEVE REVIEWS CALLED ###');
        log.info(opts);
        if (!opts.target) {
            errors.push('traget of the reviews must be provided');
        }
        if (errors.length > 0) {
            print(errors);
            return;
        }
        var target =  opts.target; //ReviewUtils.createTargetFromAssetId(opts.id, opts.type);
        var reviews = ReviewUtils.listReviews(target, user,opts);
        res.addHeader("Content-Type", "application/json");
        print(reviews);
    };
    var resolvePOST = function(req, res, session) {
        log.info('### CREATE REVIEW ###');
        var review;
        var tenantApi = require('/modules/tenant-api.js').api;
        var tenantContext = tenantApi.tenantContext(session);
        if (req.getHeader('Content-Type') === 'application/json') {
            review = req.getContent();
        }
        if (!review) {
            //TODO: Send back correct error
            print('send a review object to create');
            return;
        }
        log.info('user in tenant context ' + tenantContext.user);
        var user = store.server.current(session);
        if (!user) {
            //TODO: Send back error for attempting to create a review without logging in
            print('log in before creating a review');
            return;
        }
        var actor = review.actor = {};
        actor.id = ReviewUtils.formatUsername(user);
        actor.objectType = 'person';
        log.info('## USING REVIEW OBJECT ##');
        log.info(review);
        log.info('### DONE ###');
        var result = ReviewUtils.createUserReview(review);
        res.addHeader("Content-Type", "application/json");
        print(result);
    };
    var resolveDefaultCase = function(req, res, session) {
        req.sendError(405); //Method Not Allowed
    };
    api.resolve = function(ctx) {
        var req = ctx.request;
        var res = ctx.response;
        var session = ctx.session;
        log.info('Resolving api ');
        switch (request.getMethod()) {
            case HTTP_GET_METHOD:
                resolveGET(req, res, session);
                break;
            case HTTP_POST_METHOD:
                resolvePOST(req, res, session);
                break;
            default:
                break;
        }
    };
}(api));