var api = {};
(function(api) {
    var rxtModule = require('rxt');
    var utilsModule = require('utils');
    var ReviewUtils = require('/extensions/app/social-reviews/modules/reviews-utils.js').ReviewUtils;
    var ReqUtils = utilsModule.request;
    var constants = rxtModule.constants;
    var store = require('store');
    var log = new Log('review-api');
    var HTTP_GET_METHOD = 'GET';
    var HTTP_POST_METHOD = 'POST';
    var HTTP_DELETE_METHOD = 'DELETE';
    var REMOVE_URL_PATTERN = '/{context}/apis/user-review/{id}';
    var resolveDefaultCase = function(req, res, session) {
        req.sendError(405); //Method Not Allowed
    };
    var resolveDELETE = function(req,res,session){
        var user = store.server.current(session);
        var uriMatcher = new URIMatcher(req.getRequestURI());
        var uriParams = uriMatcher.match(REMOVE_URL_PATTERN);
        log.info('## DELETE API ##');
        log.info(uriParams);
        if(!user){
            //TODO: send back error
            print('Cannot delete without logging in');
            return;
        }
        if(!uriParams.id){
            print('review Id must be provided');
            return;
        }
        username = ReviewUtils.formatUsername(user);
        var result = ReviewUtils.removeUserReview(uriParams.id,username);
        res.addHeader("Content-Type", "application/json");
        print(result);
    };
    api.resolve = function(ctx) {
        var req = ctx.request;
        var res = ctx.response;
        var session = ctx.session;
        switch (request.getMethod()) {
            case HTTP_DELETE_METHOD:
                resolveDELETE(req, res, session);
            default:
                break;
        }
    };
}(api));