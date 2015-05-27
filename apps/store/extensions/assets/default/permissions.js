var tenantLoad = function(ctx) {
    var log = new Log();
    var Utils = ctx.utils;
    var Permissions = ctx.permissions;
    var rxtManager = ctx.rxtManager;
    var DEFAULT_ROLE = 'Internal/store';
    var tenantId = ctx.tenantId;
    var listPermission = function(type) {
        return '/permission/admin/manage/resources/govern/' + type + '/list';
    };
    var assignAllPermissionsToDefaultRole = function() {
        var types = rxtManager.listRxtTypes();
        var type;
        var permissions;
        //Type specific permissions
        for (var index = 0; index < types.length; index++) {
            type = types[index];
            permissions = {};

            permissions.ASSET_LIST = listPermission(type);
            Utils.addPermissionsToRole(permissions, DEFAULT_ROLE, tenantId);
        }
    };
    log.info('### Populating default permissions ###');
    Permissions.ASSET_LIST = function(ctx) {
        if (!ctx.type) {
            throw 'Unable to resolve type to determine the ASSET_LIST permission';
        }
        return '/permission/admin/manage/resources/govern/' + ctx.type + '/list';
    };
    log.info('### Populating permissions to ' + DEFAULT_ROLE + ' ###');
    assignAllPermissionsToDefaultRole();
    log.info('### Done ###');
};