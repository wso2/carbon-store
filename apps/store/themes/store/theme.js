/*
 *  Copyright (c) 2005-2014, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */
var cache = false;
var engine = caramel.engine('handlebars', (function() {
    return {
        partials: function(Handlebars) {
            var theme = caramel.theme();
            var partials = function(file) {
                (function register(prefix, file) {
                    var i, length, name, files;
                    if (file.isDirectory()) {
                        files = file.listFiles();
                        length = files.length;
                        for (i = 0; i < length; i++) {
                            file = files[i];
                            register(prefix ? prefix + '.' + file.getName() : file.getName(), file);
                        }
                    } else {
                        name = file.getName();
                        if (name.substring(name.length - 4) !== '.hbs') {
                            return;
                        }
                        file.open('r');
                        Handlebars.registerPartial(prefix.substring(0, prefix.length - 4), file.readAll());
                        file.close();
                    }
                })('', file);
            };
            //TODO : we don't need to register all partials in the themes dir.
            //Rather register only not overridden partials
            partials(new File(theme.__proto__.resolve.call(theme, 'partials')));
            var rxtAPI = require('rxt');
            var appExtensionMediator = rxtAPI.core.defaultAppExtensionMediator();
            if(appExtensionMediator){
                var defaultExtensionPartialsPath = appExtensionMediator.resolveCaramelResources(theme.__proto__.resolve.call(theme,'partials'));
                if (log.isDebugEnabled()) {
                    log.debug('Registering new partials directory from:  ' + defaultExtensionPartialsPath);
                }
                partials(new File(defaultExtensionPartialsPath));
            }
            partials(new File(theme.resolve('partials')));
            Handlebars.registerHelper('dyn', function(options) {
                var asset = options.hash.asset,
                    resolve = function(path) {
                        var p,
                            store = require('/modules/store.js');
                        if (asset) {
                            p = store.ASSETS_EXT_PATH + asset + '-customized/themes/' + theme.name + '/' + path;
                            if (!new File(p).isExists()){
                                p = store.ASSETS_EXT_PATH + asset + '/themes/' + theme.name + '/' + path;
                                if (new File(p).isExists()) {
                                    return p;
                                }
                                var rxtAPI = require('rxt');
                                var appExtensionMediator = rxtAPI.core.defaultAppExtensionMediator();
                                if(appExtensionMediator){
                                    var defaultExtensionPartialsPath = appExtensionMediator.resolveCaramelResources(theme.__proto__.resolve.call(theme,'partials'));
                                    if (new File(defaultExtensionPartialsPath).isExists()){
                                        return defaultExtensionPartialsPath;
                                    }

                                }
                            }
                        }
                        return theme.__proto__.resolve.call(theme, path);
                    };
                partials(new File(resolve('partials')));
                return options.fn(this);
            });
            Handlebars.registerHelper('renderSearchField', function(options) {
                var output = '';
                //log.info('options: '+stringify(options));
                switch (options.type) {
                    case 'text':
                        output = '<input type="text" class="search-input" name="' + options.name.fullName + '" />';
                        break;
                    case 'options':
                        output = '<select id="' + options.name.fullName + '" class="selectpicker " name="' + options.name.fullName + '">';
                        var valueObj = options.values ? options.values[0] : {};
                        var values = valueObj.value ? valueObj.value : [];
                        output += '<option value="ignore-value">-- Select ' +  options.name.label + ' --</option>';
                        for (var index in values) {
                            output += '<option value="' + Handlebars.Utils.escapeExpression(values[index].value) + '">' + Handlebars.Utils.escapeExpression(values[index].value) + '</option>';
                        }
                        output += '</select>';
                        break;
                    default:
                        log.warn('Unable to render search field: ' + options.name.name + ' as the type is not supported');
                        break;
                }
                return new Handlebars.SafeString(output);
            });
            Handlebars.registerHelper('renderUnboundTablePreview', function(table) {
                //Get the number of rows in the table
                var rowCount = getNumOfRowsUnbound(table);
                var fields = table.fields;
                var out = '';
                var ref = require('utils').reflection;
                for (var index = 0; index < rowCount; index++) {
                    out += '<tr>';
                    var columnCount = Object.keys(fields).length;
                    for (var key in fields) {
                        //Determine if the value is an array
                        if (!ref.isArray(fields[key].value)) {
                            fields[key].value = [fields[key].value];
                        }
                        var value = fields[key].value[index] ? fields[key].value[index] : ' ';
                        out += '<td style="width:'+100/columnCount+'%">' + Handlebars.Utils.escapeExpression(value) + '</td>';
                    }
                    out += '</tr>';
                }
                return new Handlebars.SafeString(out);
            });
            Handlebars.registerHelper('renderHeadingTablePreview', function(table) {
                var fieldCount = getFieldCount(table);
                var firstField = getFirstField(table);
                //Determine if there is only one field and it is an option text
                if ((fieldCount == 1) && (firstField.type == 'option-text')) {
                    return new Handlebars.SafeString(renderOptionsTextPreview(firstField));
                } else {
                    return new Handlebars.SafeString(renderHeadingFieldPreview(table));
                }
            });
            Handlebars.registerHelper('renderTablePreview', function(table) {
                var headingPtr = Handlebars.compile('{{> heading_table .}}');
                var defaultPtr = Handlebars.compile('{{> default_table .}}');
                var unboundPtr = Handlebars.compile('{{> unbound_table .}}');
                var headings = getHeadings(table);
                //Check if the table is unbounded
                if ((table.maxoccurs) && (table.maxoccurs == 'unbounded')) {
                    if (headings.length > 0) {
                        table.subheading = table.subheading[0].heading;
                    }
                    return new Handlebars.SafeString(unboundPtr(table));
                }
                //Check if the table has headings
                if (headings.length > 0) {
                    table.subheading = table.subheading[0].heading;
                    return new Handlebars.SafeString(headingPtr(table));
                }
                //Check if the table is a normal table
                return new Handlebars.SafeString(defaultPtr(table));
            });
            Handlebars.registerHelper('authentication', function(options) {
                var log = new Log();
                //Determine if security details are present
                var security = options.security;
                var output = "";
                var ptr;
                if (!security) {
                    log.debug('Unable to locate security details in order to render authentication ui elements');
                    return;
                }
                //Determine the authentication method
                switch (security.method) {
                    case 'sso':
                        output = "{{> sso-auth .}}";
                        break;
                    case 'basic':
                        output = "{{> basic-auth .}}";
                        break;
                    default:
                        break;
                }
                ptr = Handlebars.compile(output);
                return new Handlebars.SafeString(ptr(security));
            });
            Handlebars.registerHelper('signout',function(options){
                var log=new Log();
                var security=options.security;
                var output='';
                var ptr;
                if(!security){
                    log.warn('Unable to locate security details in order to render sign out ui elements');
                    return;
                }
                switch(security.method){
                    case 'sso':
                        output='{{> sso-signout .}}';
                        break;
                    case 'basic':
                        output='{{> basic-signout .}}';
                        break;
                    default:
                        break;
                }
                ptr=Handlebars.compile(output);
                return new Handlebars.SafeString(ptr(security));
            });
            Handlebars.registerHelper('assetUtilization', function(options) {
                var output = '';
                var ptr;
                var security = options.security;
                var cuser = options.cuser;
                //log.info(options);
                if (!cuser) {
                    log.warn('Unable to locate user details');
                    return output;
                }
                if (!cuser.isAnon) {
                    output = '<a href="#" class="btn btn-primary asset-add-btn">{{>process-asset-text}}</a>';
                    ptr = Handlebars.compile(output);
                    return new Handlebars.SafeString(ptr());
                }
                if (!security) {
                    log.warn('Unable to locate security block to render assset utilization');
                    return output;
                }
                switch (security.method) {
                    case 'basic':
                        output = '<a href="#" class="btn btn-primary asset-add-btn">{{>process-asset-text}}</a>';
                        break;
                    default:
                        output = '<a href="{{url "/login"}}" class="btn btn-primary asset-add-btn">{{>process-asset-text}}</a>';
                        break;
                }
                ptr = Handlebars.compile(output);
                return new Handlebars.SafeString(ptr());
            });
            Handlebars.registerHelper('getLoginUrl',function(options){
                var security=options.security;
                var output='/login';
                if(!security){
                    log.debug('Unable to determine login url as the security block was not pesent');
                    return output;
                }
                switch(security.method){
                    case 'sso':
                        output='/login';
                        break;
                    case 'basic':
                        output='#';
                        break;
                    default:
                        break;
                }
                return output;
            });
            Handlebars.registerHelper('tenantedUrl', function (path) {
                var rxtAPI  = require('rxt');
                var constants = rxtAPI.constants;
                var uriPattern = '/{context}/{+suffix}';
                var tenantedUriPattern = constants.TENANT_URL_PATTERN;// '/{context}/t/{domain}/{+any}';

                var uriOptions, output;
                var uriMatcher = new URIMatcher(request.getRequestURI());
                if (uriMatcher.match(tenantedUriPattern)) {
                    uriOptions = uriMatcher.elements();
                    output = rxtAPI.app.getContext() + '/t/' + uriOptions.domain;
                } else if (uriMatcher.match(uriPattern)) {
                    uriOptions = uriMatcher.elements();
                    output = rxtAPI.app.getContext();
                }
                return output + path;
            });

            Handlebars.registerHelper('hasAssetPermission',function(context,options){
                var rxtAPI  = require('rxt');
                var key = options.hash.key;
                var type = options.hash.type;
                var tenantId = options.hash.tenantId;
                var username = options.hash.username||rxtAPI.permissions.wso2AnonUsername();
                var isAuthorized =options.hash.auth ? options.hash.auth : false; 
                var missingParams = (!key) || (!type) || (!tenantId)||(!username);
                //If the user is forcing the view to render 
                if(isAuthorized){
                    return options.fn(context);
                }
                if(missingParams){
                    log.error('[hasAssetPermission] Helper not executed since insufficient number of parameters were provided (required parameters: key,type,tenantId,username)');
                    return ;
                }
                isAuthorized = rxtAPI.permissions.hasAssetPermission(key,type,tenantId,username);
                if(isAuthorized){
                    return options.fn(context);
                }else{
                    if(log.isDebugEnabled()){
                        log.debug('[hasAssetPermission] User '+username+' does not have permission: '+key+' to see ui area');                        
                    }
                    return options.inverse(context);
                }
            });

            Handlebars.registerHelper('hasAppPermission',function(context,options){
                var rxtAPI  = require('rxt');
                var key = options.hash.key;
                var type = options.hash.type;
                var tenantId = options.hash.tenantId;
                var username = options.hash.username||rxtAPI.permissions.wso2AnonUsername();
                var isAuthorized =options.hash.auth ? options.hash.auth : false; 
                var missingParams = (!key) || (!tenantId)||(!username);
                //If the user is forcing the view to render 
                if(isAuthorized){
                    return options.fn(context);
                }
                if(missingParams){
                    log.error('[hasAppPermission] Helper not executed since insufficient number of parameters were provided (required parameters: key,type,tenantId,username)');
                    return ;
                }
                isAuthorized = rxtAPI.permissions.hasAppPermission(key,tenantId,username);
                if(isAuthorized){
                    return options.fn(context);
                }
                if(log.isDebugEnabled()){
                    log.debug('[hasAppPermission] User '+username+' does not have permission: '+key+' to see ui area');                    
                }
                return ;
            });
            Handlebars.registerHelper('eachField', function(context, options) {
                var ret = '';
                for (var key in context) {
                    context[key].label = context[key].name.label ? context[key].name.label : context[key].name.name;
                    if(!context[key].hidden){
                        ret += options.fn(context[key]);
                    }
                }
                return ret;
            });
            Handlebars.registerHelper('if_equal', function(lvalue, rvalue, options) {
                if (arguments.length < 3)
                    throw new Error("Handlebars Helper equal needs 2 parameters");
                if( lvalue!=rvalue ) {
                    return options.inverse(this);
                } else {
                    return options.fn(this);
                }
            });
            Handlebars.registerHelper('renderCheckbox', function(value) {
                var out = '';
                if( value === "true") {
                    out += '<div class="col-sm-4"><input type="checkbox" checked disabled="disabled"/></div>';
                } else {
                    out += '<div class="col-sm-4 "><input type="checkbox" disabled="disabled"/></div>';
                }
                return new Handlebars.SafeString(out);
            });
            var getHeadings = function(table) {
                return (table.subheading) ? table.subheading[0].heading : [];
            };
            var getNumOfRowsUnbound = function(table) {
                var ref = require('utils').reflection;
                for (var key in table.fields) {
                    //If there is only a single entry it will be returned as a string as opposed to an array
                    //We must convert it to an array to mainatain consistency
                    if (!ref.isArray(table.fields[key].value)) {
                        table.fields[key].value = [table.fields[key].value];
                    }
                    return (table.fields[key].value) ? table.fields[key].value.length : 0;
                }
                return 0;
            };

            var renderOptionsTextPreview = function(field) {
                var value;
                var values = field.value;
                var output = '';
                var ref = require('utils').reflection;
                //If there is only a single entry then the registry API will send a string
                //In order to uniformly handle these scenarios we must make it an array
                if (values) {
                    if (!ref.isArray(values)) {
                        values = [values];
                    }
                    for (var index in values) {
                        value = values[index];
                        var delimter = value.indexOf(':')
                        var option = value.substring(0, delimter);
                        var text = value.substring(delimter + 1, value.length);
                        if ((field.url == 'true'|| field.url == true) && text && text.lastIndexOf('http', 0) === 0){
                            output += '<tr><td>' + option + '</td><td><a href="'+text+'">' + text + '</a></td></tr>';
                        } else {
                            output += '<tr><td>' + option + '</td><td>' + text + '</td></tr>';
                        }
                    }
                }
                return output;
            };
            var getNumOfRows = function(table) {
                for (var key in table.fields) {
                    return table.fields[key].value.length;
                }
                return 0;
            };

            var getFieldCount = function(table) {
                var count = 0;
                for (var key in table.fields) {
                    count++;
                }
                return count;
            };
            var getFirstField = function(table) {
                for (var key in table.fields) {
                    return table.fields[key];
                }
                return null;
            };
            var renderHeadingFieldPreview = function(table) {
                var fields = table.fields;
                var columns = table.columns;
                var index = 0;
                var out = '<tr>';
                //The table should only be drawn if it is not empty
                if(table.renderingMetaData && table.renderingMetaData.emptyTable){
                    return '';
                }
                for (var key in fields) {
                    if ((index % 3) == 0) {
                        index = 0;
                        out += '</tr><tr>';
                    }
                    if (fields[key].url == 'true' && fields[key].value && fields[key].value.lastIndexOf('http', 0) === 0){
                        out += '<td><a href="'+fields[key].value+'">' + (fields[key].value || ' ') + '</a></td>';
                    } else if(fields[key].value) {
                        out += '<td>' + (fields[key].value || ' ') + '</td>';
                    } else {
                        out+='';
                    }
                    index++;
                }
                return out;
            };
        },
        render: function(data, meta) {
            this.__proto__.render.call(this, data, meta);
        },
        globals: function(data, meta) {
            var store = require('/modules/store.js'),
                user = require('store').server.current(meta.session);
            return 'var store = ' + stringify({
                user: user ? user.username : null
            });
        }
    };
}()));
var resolve = function(path) {
    var themeResolver = this.__proto__.resolve;
    var asset = require('rxt').asset;
    var app = require('rxt').app;
    var appPath = app.resolve(request, path, this.name, this, themeResolver, session);
    if (!appPath) {
        path = asset.resolve(request, path, this.name, this, themeResolver);
    } else {
        path = appPath;
    }
    return path;
};