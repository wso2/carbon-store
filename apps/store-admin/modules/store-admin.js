
var PUBLISHER_CONFIG_PATH = '/_system/config/store-admin/configs/store-admin.json';
var ASSETS_EXT_PATH = '/extensions/assets/';
var TENANT_PUBLISHER = 'tenant.store-admin';
var log = new Log('modules.store-admin');
var SUPER_TENANT = -1234;

var init = function (options) {
    var event = require('event');

    event.on('tenantCreate', function (tenantId) {
        var role, roles,
            carbon = require('carbon'),
            mod = require('store'),
            server = mod.server,
            config = require('/config/store-admin-tenant.json'),
            system = server.systemRegistry(tenantId),
            um = server.userManager(tenantId),
            CommonUtil = Packages.org.wso2.carbon.governance.registry.extensions.utils.CommonUtil,
            GovernanceConstants = org.wso2.carbon.governance.api.util.GovernanceConstants;

        system.put(options.tenantConfigs, {
            content: JSON.stringify(config),
            mediaType: 'application/json'
        });
        roles = config.roles;
        for (role in roles) {
            if (roles.hasOwnProperty(role)) {
                if (um.roleExists(role)) {
                    um.authorizeRole(role, roles[role]);
                } else {
                    um.addRole(role, [], roles[role]);
                }
            }
        }

        CommonUtil.addRxtConfigs(system.registry.getChrootedRegistry("/_system/governance"), tenantId);
        um.authorizeRole(carbon.user.anonRole, GovernanceConstants.RXT_CONFIGS_PATH, carbon.registry.actions.GET);
        log.debug('TENANT CREATED');
    });

    event.on('tenantLoad', function (tenantId) {
        var store = require('store'),
            server = store.server,
            carbon = require('carbon'),
            config = server.configs(tenantId);
        var reg = server.systemRegistry(tenantId);
        var CommonUtil = Packages.org.wso2.carbon.governance.registry.extensions.utils.CommonUtil;
        var GovernanceConstants = org.wso2.carbon.governance.api.util.GovernanceConstants;
        var um = server.userManager(tenantId);
        var publisherConfig = require('/config/store-admin-tenant.json');

        //Check if the tenant is the super tenant
        if (tenantId == SUPER_TENANT) {

            log.debug('executing default asset deployment logic since super tenant has been loaded.');

            log.debug('attempting to load rxt templates to the registry.');

            //Try to deploy the rxts
            CommonUtil.addRxtConfigs(reg.registry.getChrootedRegistry("/_system/governance"), reg.tenantId);
            um.authorizeRole(carbon.user.anonRole, GovernanceConstants.RXT_CONFIGS_PATH, carbon.registry.actions.GET);

            log.debug('finished loading rxt templates to the registry.');

        }


    });

    event.on('login', function (tenantId, user, session) {
    });
};

