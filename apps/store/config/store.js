var config;
(function () {
    config = function () {
        var log = new Log(),
            pinch = require('/modules/pinch.min.js').pinch,
            config = require('/config/store.json'),
            process = require('process'),
            CarbonUtils = Packages.org.wso2.carbon.utils.CarbonUtils,
            localIP = CarbonUtils.getServerConfiguration().getFirstProperty("HostName") || process.getProperty('server.host'),
            carbon = require('carbon'),
            ccs = carbon.server.osgiService('org.wso2.carbon.utils.ConfigurationContextService'),
            httpPort = CarbonUtils.getTransportProxyPort(ccs.getServerConfigContext(), 'http'),
            httpsPort = CarbonUtils.getTransportProxyPort(ccs.getServerConfigContext(), 'https'),
            carbonLocalIP = process.getProperty('carbon.local.ip'),
            httpPortPart, httpsPortPart,
            proxyServer = config.server.proxyServer,
            proxyServerDefined = false;

        if(proxyServer && proxyServer.length > 0){
            proxyServerDefined = true;
        }

        var resolveContext = function (value) {
            var rxt = require('rxt');
            var context = rxt.app.getContext();
            return value.replace('/%context%', context);
        };

        if (httpPort == -1) {
            httpPort = process.getProperty('http.port');
        }
        if (httpPort == 80) {
            httpPortPart = '';
        } else {
            httpPortPart = ':' + httpPort;
        }

        if (httpsPort == -1) {
            httpsPort = process.getProperty('https.port');
        }
        if (httpsPort == 443) {
            httpsPortPart = '';
        } else {
            httpsPortPart = ':' + httpsPort;
        }

        pinch(config, /^/, function (path, key, value) {
            if ((typeof value === 'string') && value.indexOf('%https.host%') > -1) {
                if(proxyServerDefined) {
                    return resolveContext(value.replace('%https.host%', proxyServer));
                } else {
                    return resolveContext(value.replace('%https.host%', 'https://' + localIP + httpsPortPart));
                }
            } else if ((typeof value === 'string') && value.indexOf('%http.host%') > -1) {
                return resolveContext(value.replace('%http.host%', 'http://' + localIP + httpPortPart));
            } else if ((typeof value === 'string') && value.indexOf('%https.carbon.local.ip%') > -1) {
                return resolveContext(value.replace('%https.carbon.local.ip%', 'https://' + carbonLocalIP + ':' + httpsPort));
            } else if ((typeof value === 'string') && value.indexOf('%http.carbon.local.ip%') > -1) {
                return resolveContext(value.replace('%http.carbon.local.ip%', 'http://' + carbonLocalIP + ':' + httpPort));
            }
            return  value;
        });
        return config;
    };
})();