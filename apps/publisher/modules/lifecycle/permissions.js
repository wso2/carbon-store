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
        var isAuthorized =   permissionAPI.hasActionPermissionforPath(resourcePath, 'write', session);
        return isAuthorized;
    };

    /**
     * The function checks whether a user has lifecycle permission for a given asset type
     * @param  {[type]}  assetType    RXT short name
     * @param  {[type]}  session
     * @return {Boolean}              True if the user can has life-cycle permission           
     */
    var isLCPermitted = function(assetType, session) {
        var permissionAPI = require('rxt').permissions;
        var isAuthorized = permissionAPI.hasAssetPermission(permissionAPI.ASSET_LIFECYCLE, assetType, session)
        return isAuthorized;
    };

    permissions.isLCActionsPermitted = isLCActionsPermitted;
    permissions.isLCPermitted = isLCPermitted;
}());
