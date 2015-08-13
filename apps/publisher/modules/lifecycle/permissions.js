var permissions={};
(function() {
	var log=new Log();
    /**
     * The function checks whether a user can perform life-cycle actionss
     * @param  {[type]}  username     The name of the user for which the check must be performed
     * @param  {[type]}  resourcePath The registry resource path
     * @param  {[type]}  userManager  
     * @return {Boolean}			  True if the user can perform life-cycle actions           
     */
    var isLCActionsPermitted = function(resourcePath, session) {
    	//log.info('###Checking permissions ###');
        var permissionAPI = require('rxt').permissions;
        var isAuthorized =   permissionAPI.hasActionPermissionforPath(resourcePath, 'authorize', session);
        return isAuthorized;
    };
    permissions.isLCActionsPermitted = isLCActionsPermitted;
}());