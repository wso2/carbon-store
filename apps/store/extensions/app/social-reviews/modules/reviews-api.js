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
        if (!opts.id) {
            errors.push('Id of the asset must be provided');
        }
        if (!opts.type) {
            errors.push('Type of the asset must be provided');
        }
        if (errors.length > 0) {
            print(errors);
            return;
        }
        var target = ReviewUtils.createTargetFromAssetId(opts.id, opts.type);
        var reviews = ReviewUtils.listReviews(target, user);
        print(reviews);
    };
    var resolvePOST = function(req, res, session) {
    	log.info('### CREATE REVIEW ###');
    	log.info(req.getHeader('Content-Type'));
    	if(req.getHeader('Content-Type') === 'application/json'){
    		log.info(req.getContent());
    		//log.info(req.getAllParameters('UTF-8'));
    	}
        print('post');
    };
    var resolveDefaultCase = function(req, res, session) {
        req.sendError(405); //Method Not Allowed
    };
    api.resolve = function(ctx) {
        var req = ctx.request;
        var res = ctx.respose;
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