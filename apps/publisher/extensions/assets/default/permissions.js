var tenantLoad = function(ctx){
	var log = new Log();
	log.info('Registering the default permissions');
	ctx.permissions.ASSET_CREATE = '/permissions/management';
	ctx.permissions.ASSET_ASSOCIATIONS = function(ctx){
		var userManager = ctx.userManager;
		return true;
	};
	ctx.permissions.ASSET_COMMENTS = function(ctx){
		return '/permissions/mycustom/comments';
	}
};


