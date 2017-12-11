var caramel = require('caramel'),
    config = require('/config/store-admin.json'),
    carbon = require('carbon'),
    conf = carbon.server.loadConfig('carbon.xml'),
    offset = conf.*::['Ports'].*::['Offset'].text(),
    hostName = conf.*::['HostName'].text().toString();

if (hostName === null || hostName === '') {
    hostName = 'localhost';
}

var httpPort = 9763 + parseInt(offset, 10);
var httpsPort = 9443 + parseInt(offset, 10);

var process = require('process');
process.setProperty('server.host', hostName);
process.setProperty('http.port', httpPort.toString());
process.setProperty('https.port', httpsPort.toString());

var storeAdminConfig = require('/config/store-admin.js').config();

var mod = require('store');

caramel.configs({
    context: '/store-admin'
});

mod.server.init(storeAdminConfig);
mod.user.init(storeAdminConfig);

var storeAdmin = require('/modules/store-admin.js');
storeAdmin.init(storeAdminConfig);

//startup log for url
var logStoreAdminUrl = function () {
	var log = new Log();
    log.info("store-admin URL : " + config.server.http + caramel.configs().context);
};

setTimeout(logStoreAdminUrl, 7000);

