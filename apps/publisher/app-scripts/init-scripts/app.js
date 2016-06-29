/*
 Description: Initialization script
 Filename:app.js
 Created Date: 29/7/2013
 */

var caramel = require('caramel'),
    config = require('/config/publisher.json'),
    carbon = require('carbon'),
    process = require('process'),
    mediaType = 'application/vnd.wso2.registry-ext-type+xml',
    conf = carbon.server.loadConfig('carbon.xml'),
    offset = conf.*::['Ports'].*::['Offset'].text(),
    hostName = conf.*::['HostName'].text().toString();

// var ext_parser = require('/modules/ext/core/extension.parser.js').extension_parser();
// var ext_domain = require('/modules/ext/core/extension.domain.js').extension_domain();
// var ext_core = require('/modules/ext/core/extension.core.js').extension_core();
// var ext_mng = require('/modules/ext/core/extension.management.js').extension_management();

var configurationContextService = carbon.server.osgiService('org.wso2.carbon.utils.ConfigurationContextService');
var carbonUtils = Packages.org.wso2.carbon.utils.CarbonUtils;
var configCtx = configurationContextService.getServerConfigContext();

var httpPort = carbonUtils.getTransportPort(configCtx,"http");
var httpsPort = carbonUtils.getTransportPort(configCtx,"https");
var proxyContextPath = carbonUtils.getProxyContextPath(true);

if (hostName === null || hostName === '') {
    hostName = process.getProperty('carbon.local.ip');
}


process.setProperty('server.host', hostName);
process.setProperty('http.port', httpPort.toString());
process.setProperty('https.port', httpsPort.toString());
process.setProperty('proxy.context.path', String(proxyContextPath));

var pubConfig = require('/config/publisher.js').config();

var mod = require('store');
var rxt=require('rxt');
var lifecycle=require('lifecycle');
var metricsAPI = require('carbon-metrics').metrics;


caramel.configs({
    context: rxt.app.buildContext(pubConfig.server.context),
    cache: false,
    negotiation: true,
    themer: function () {
        //TODO: Hardcoded theme
        return 'default';
    }

});

mod.server.init(pubConfig);
mod.user.init(pubConfig);
rxt.core.init();
rxt.resources.init();
var context=caramel.configs().context;
rxt.app.init(context);
lifecycle.core.init();

var publisher = require('/modules/publisher.js');
publisher.init(pubConfig);
rxt.server.init(pubConfig);

rxt.permissions.init();
metricsAPI.init(context,pubConfig);

//get the version from publisher.json and set it.
rxt.app.version(config.version);
//get the search template from the publisher.json
rxt.app.defaultSearchTemplate(config.search.defaultSearchTemplate);


//var SUPER_TENANT_ID=-1234;
//var event = require('/modules/event.js');
//event.emit('tenantLoad', SUPER_TENANT_ID);

//Configure Caramel


//startup log for url
var logPublisherUrl = function () {
	var log = new Log();
    log.info("Publisher URL : " + config.server.http + caramel.configs().context);
};

//Cause the super tenant to be load
var SUPER_TENANT = -1234;
var event = require('event');
event.emit('tenantLoad', SUPER_TENANT);

//setTimeout(logPublisherUrl, 7000);

