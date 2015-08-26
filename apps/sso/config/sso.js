var config;
(function () {
    config = function () {
        var log = new Log(),
            pinch = require('/modules/pinch.min.js').pinch,
            config = require('/config/sso.json'),
            process = require('process'),
            CarbonUtils = Packages.org.wso2.carbon.utils.CarbonUtils,
            localIP = CarbonUtils.getServerConfiguration().getFirstProperty("HostName"),
            httpPort = process.getProperty('http.port'),
            httpsPort = process.getProperty('https.port');

        pinch(config, /^/, function (path, key, value) {
            if ((typeof value === 'string') && value.indexOf('%https.host%') > -1) {
                return value.replace('%https.host%', 'https://' + localIP + ':' + httpsPort);
            } else if ((typeof value === 'string') && value.indexOf('%http.host%') > -1) {
                return value.replace('%http.host%', 'http://' + localIP + ':' + httpPort);
            }
            return  value;
        });
        return config;
    };
})();