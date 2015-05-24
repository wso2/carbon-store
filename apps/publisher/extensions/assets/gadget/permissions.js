var tenantLoad = function(ctx){
	ctx.permissions.ASSET_CREATE = '/permissions/gadget/management';
	ctx.permissions.ASSET_UPDATE = '/permissions/gadget/update';
	ctx.permissions.ASSET_SEARCH = function(){
		return '/permissions/mycustom/search';
	}
};