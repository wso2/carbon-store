var confRetriever = function (username , tenantId , filepath){

    var carbon = require('carbon');
    var server = new carbon.server.Server();
    var options = {username: username, tenantId: tenantId};
    var registry = new carbon.registry.Registry(server, options);
    var path =filepath;

    return registry.get(path).content;

}

var confUpdater = function (username , tenantId , filepath, contentName){

    var carbon = require('carbon');
    var url = 'https://10.100.0.49:9443/admin/services/';
    var server = new carbon.server.Server(url);
    var options = {username: username, tenantId: tenantId};
    var registry = new carbon.registry.Registry(server, options);
    var path =filepath;


    var content = request.getParameter(contentName);

    if (content) {

        var regResource = registry.get(path);
        regResource.content = content;
        registry.put(path,regResource);

    }

}

