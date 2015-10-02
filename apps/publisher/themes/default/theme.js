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
var log = new Log();
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
                log.debug('Registering new partials directory from:  '+defaultExtensionPartialsPath);
                partials(new File(defaultExtensionPartialsPath));
            }
            partials(new File(theme.resolve('partials')));
            Handlebars.registerHelper('dyn', function(options) {
                var asset = options.hash.asset,
                    resolve = function(path) {
                        var p,
                            publisher = require('/modules/publisher.js');
                        if (asset) {
                            p = publisher.ASSETS_EXT_PATH + asset + '/themes/' + theme.name + '/' + path;
                            if (new File(p).isExists()) {
                                return p;
                            }
                        }
                        return theme.__proto__.resolve.call(theme, path);
                    };
                partials(new File(resolve('partials')));
                return options.fn(this);
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
                        if (field.url == 'true' && text && text.lastIndexOf('http', 0) === 0){
                            output += '<tr><td>' + option + '</td><td><a href="'+text+'">' + text + '</a></td></tr>';
                        } else {
                            output += '<tr><td>' + option + '</td><td>' + text + '</td></tr>';
                        }
                    }
                }
                return output;
            };
            var getHeadings = function(table) {
                return (table.subheading) ? table.subheading[0].heading : [];
            };
            var getNumOfRows = function(table) {
                for (var key in table.fields) {
                    return table.fields[key].value.length;
                }
                return 0;
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
                for (var key in fields) {
                    if ((index % 3) == 0) {
                        index = 0;
                        out += '</tr><tr>';
                    }
                    if (fields[key].url == 'true' && fields[key].value && fields[key].value.lastIndexOf('http', 0) === 0){
                        out += '<td><a href="'+fields[key].value+'">' + (fields[key].value || ' ') + '</a></td>';
                    } else {
                        out += '<td>' + (fields[key].value || ' ') + '</td>';
                    }
                    index++;
                }
                return out;
            };
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
            var renderFieldMetaData = function(field,name,options) {
                var isReadOnly=false;
                var placeHolder = (field.placeholder)?field.placeholder:false;
                var meta=' name="' + (name?name:field.name.tableQualifiedName) + '" '+
                         ' id="' + (name?name:field.name.tableQualifiedName) + '" '+
                         ' class="input-large"';
                var isUpdatable = true;

                var mode = 'create';
                if(options && options.hash && options.hash.mode && options.hash.mode == "edit"){
                    mode = "edit";
                }

                //Readonly attribute setting
                if(mode == "edit"){
                    isReadOnly = ( field.readonly && field.readonly != 'false' ) || field.auto;
                }else{
                    isReadOnly = (field.auto)?field.auto:false;
                }
                if(isReadOnly){
                    meta+=' readonly';
                } else if(!isUpdatable && mode == 'edit'){
                    meta+=' readonly';
                }

                //File required checking
                var isRequired = false;
                if( (typeof(field.required) == "boolean" && field.required) || (typeof(field.required) == "string" && field.required == "true" )){
                    isRequired = true;
                }
//                var isRequired=(field.required == 'true' || ( field.required && field.required != "false"))? true : false; //field.required is not boolean

                if(isRequired && field.type != 'file'){
                    meta+=' required';
                } else if (isRequired && field.type == 'file' && mode == 'create') {
                    meta+=' required';
                }

                if(placeHolder){
                    meta += ' placeholder="'+ placeHolder +'"';
                }
                if(field.tooltip){
                    meta += ' data-toggle="tooltip" data-placement="left" title="'+field.tooltip+'" ';
                }
                return meta;
            };
            var renderFieldLabel = function(field) {
                var output = '';
                var isHidden= (field.hidden)?field.hidden:false;

                if (!isHidden && field.type != "option-text"){
                    output = '<label class="custom-form-label col-lg-2 col-md-2 col-sm-12 col-xs-12">' + (field.name.label || field.name.name);
                    if( (typeof(field.required) == "boolean" && field.required) || (typeof(field.required) == "string" && field.required == "true" )){
                        output += '<sup class="required-field">*</sup>';
                    }
                    output += '</label>';
                }
                return output;
            };
            var renderOptions = function(value, values, field,count) {
                var id=(count)?field.name.tableQualifiedName+'_option_'+count:undefined;
                var out = '<select ' + renderFieldMetaData(field,id) + '>';

                for (var index in values) {
                    if (value && values[index].value == value) {
                        out += '<option selected="selected">' + Handlebars.Utils.escapeExpression(value) + '</option>';
                    }else{
                        out += '<option>' + Handlebars.Utils.escapeExpression(values[index].value) + '</option>';
                    }
                }
                //Filter out the selected
                out += '</select>';
                return out;
            };


            var renderOptionsForOptionsText = function(value, values, field) {
                var id=field.name.tableQualifiedName+'_option';
                var out = '<select ' + renderFieldMetaData(field,id) + '>';

                for (var index in values) {
                    if (value && values[index].value == value) {
                        out += '<option selected="selected">' + Handlebars.Utils.escapeExpression(value) + '</option>';
                    }else{
                        out += '<option>' + Handlebars.Utils.escapeExpression(values[index].value) + '</option>';
                    }
                }
                //Filter out the selected
                out += '</select>';
                return out;
            };

            var renderTableField = function(field,mode) {
                var out = '';
                var value = field.valueActive || field.value || '';
                var elementPrefix;
                var elementSuffix;
                if(field.renderInTable){
                    elementPrefix = '<td valign="top">';
                    elementSuffix = '</td>';
                } else {
                    elementPrefix = '<div class="custom-form-right col-lg-5 col-md-8 col-sm-8 col-xs-12">';
                    elementSuffix = '</div>';
                }
                if(mode && mode.hash && mode.hash.mode == null && field.default){
                    value = field.default;
                }
                var modeValue = 'create';
                if(mode && mode.hash && mode.hash.mode && mode.hash.mode == "edit"){
                    modeValue = "edit";
                }
                switch (field.type) {
                    case 'options':
                        out = elementPrefix + renderOptions(field.value, field.values[0].value, field) + elementSuffix;
                        break;
                    case 'option-text':
                        var values = value.split(":");
                        out = elementPrefix + renderOptionsForOptionsText(values[0], field.values[0].value, field) + elementSuffix;
                        out += elementPrefix + '<input type="text" value="' + Handlebars.Utils.escapeExpression(values[1]) + '" class="form-control"' + renderFieldMetaData(field, field.name.tableQualifiedName+'_text', mode) + ' />' + elementSuffix;
                        break;
                    case 'text':
                        out = elementPrefix + '<input type="text" class="form-control" value="' + Handlebars.Utils.escapeExpression(value) + '"" ' + renderFieldMetaData(field, null, mode) + ' >' + elementSuffix;
                        break;
                    case 'text-area':
                        out = elementPrefix + '<textarea row="3" style="width:100%; height:70px"' + renderFieldMetaData(field, null, mode) + '>' + Handlebars.Utils.escapeExpression(value) + '</textarea>' + elementSuffix;
                        break;
                    case 'file':
                        out = elementPrefix + '<input type="file" class="form-control" value="' + Handlebars.Utils.escapeExpression(value) + '" ' + renderFieldMetaData(field, null, mode) + ' >' + elementSuffix;
                        break;
                    case 'date':
                        out = elementPrefix + '<input type="text" data-render-options="date-time"  value="' + Handlebars.Utils.escapeExpression(value) + '" ' + renderFieldMetaData(field, null, mode) + ' >' + elementSuffix;
                        break;
                    case 'checkbox':
                        var checkboxString = "";
                        if(modeValue == "edit"){
                            if( (typeof(value) == "boolean" && value) || (typeof(value) == "string" && value == "true" )){
                                checkboxString = 'checked="checked"';
                            }else{
                                checkboxString = '';
                            }
                        }else{
                            value="true";
                        }
                        out = elementPrefix + '<input type="checkbox" ' + renderFieldMetaData(field, null, mode) + ' ' + Handlebars.Utils.escapeExpression(checkboxString) + ' >' + elementSuffix;
                        break;
                    case 'password':
                        out = elementPrefix + '<input type="password" value="' + Handlebars.Utils.escapeExpression(value) + '" ' + renderFieldMetaData(field, null, mode) + ' >' + elementSuffix;
                        break;
                    default:
                        out = elementPrefix + 'Normal Field' + field.type + elementSuffix;
                        break;
                }
                return out;
            };

            var renderEditableHeadingField = function(table) {
                var fields = table.fields;
                var columns = table.columns;
                var index = 0;
                var out = '<tr>';
                for (var key in fields) {
                    if ((index % 3) == 0) {
                        index = 0;
                        out += '</tr><tr>';
                    }
                    fields[key].renderInTable = true;
                    out += renderTableField(fields[key]);
                    index++;
                }
                return out;
            };
            Handlebars.registerHelper('renderEditableFields', function(fields) {
                var out = '';
                var field;
                for (var key in fields) {
                    field = fields[key];
                    out += renderTableField(field,'edit');
                }
                return new Handlebars.SafeString(out);
            });
            Handlebars.registerHelper('renderEditableField', function(field, mode) {
                var label = renderFieldLabel(field);
                field.renderInTable = false;
                return new Handlebars.SafeString(label + renderTableField(field, mode));
            });
            Handlebars.registerHelper('renderEditableUnboundTableRow_optionText', function(table) {
                var field = getFirstField(table);
                var mode = {"hash" : {"mode" : table.mode}};
                var fieldValue = '';
                if(field.values && typeof field.values === "object"){
                    fieldValue = field.values[0].value;
                }
                var output = '';
                output += '<tr id="table_reference_'+table.name+'">';
                output += '<td valign="top">' + renderOptionsForOptionsText('', fieldValue, field) + '</td>';
                output += '<td valign="top"><input type="text" class="form-control"' + renderFieldMetaData(field,field.name.tableQualifiedName+'_text',mode) + ' /></td>';
                output += '<td><a class="js-remove-row"><i class="fa fa-trash"></i></a> </td>';
                output += '</tr>';
                return new Handlebars.SafeString(output);
            });
            Handlebars.registerHelper('renderEditableHeadingTable', function(table) {
                return new Handlebars.SafeString(renderEditableHeadingField(table));
            });
            //If there is no rows then a single empty row with the fields should be rendererd
            Handlebars.registerHelper('renderEditableUnboundTableRow', function(table) {
                //Get the number of rows in the table

                var fields = table.fields;
                var out = '';
                out += '<tr id="table_reference_'+table.name+'">';
                for (var key in fields) {
                    fields[key].value = "";
                    fields[key].renderInTable = true;
                    out += renderTableField(fields[key]);
                }
                out += '<td><a class="js-remove-row"><i class="fa fa-trash"></i></a> </td>';
                out += '</tr>';

                return new Handlebars.SafeString(out);

            });
            Handlebars.registerHelper('renderEditableUnboundTable', function(table, renderType) {
                //Get the number of rows in the table
                var rowCount = getNumOfRowsUnbound(table);
                var fields = table.fields;
                var out = '';
                var mode=table.mode;
                var ref = require('utils').reflection;
                //If there is no rows then a single empty row with the fields should be rendererd

                //Go through each row
                for (var index = 0; index < rowCount; index++) {
                    out += '<tr>';
                    for (var key in fields) {
                        //Determine if the value is an array
                        if (!ref.isArray(fields[key].value)) {
                            fields[key].value = [fields[key].value];
                        }
                        var value = fields[key].value[index] ? fields[key].value[index] : ' ';
                        var field = fields[key];
                        field.renderInTable = true;
                        field.valueActive = value;
                        out += renderTableField(field, mode);
                    }
                    out += '<td><a class="js-remove-row"><i class="fa fa-trash"></i></a> </td>';
                    out += '</tr>';
                }

                return new Handlebars.SafeString(out);
            });
            Handlebars.registerHelper('renderTable', function(table, options) {
                table.mode = options.hash.mode;
                var headingPtr = Handlebars.compile('{{> editable_heading_table .}}');
                var defaultPtr = Handlebars.compile('{{> editable_default_table .}}');
                var unboundPtr = Handlebars.compile('{{> editable_unbound_table .}}');
                if(table.subheading && table.subheading.length > 0){
                    table.subheading = table.subheading[0].heading;
                }
                //Check if the table is option-text unbounded
                var unboundedOptionText = false;
                var withValues = false;
                for(var index in table.fields){
                    if(table.fields.hasOwnProperty(index)){
                        var field = table.fields[index];
                        if(field.maxoccurs && field.maxoccurs == "unbounded"){
                            unboundedOptionText = true;
                        }
                        if(field.value){
                            withValues = true;
                        }
                    }
                }
                table.withValues = withValues;

                if ( unboundedOptionText) {
                    table.optionText = true;
                    return new Handlebars.SafeString(unboundPtr(table));
                }
                //Check if the table is unbounded
                if ( table.maxoccurs && (table.maxoccurs == 'unbounded' )) {
                    table.optionText = false;
                    return new Handlebars.SafeString(unboundPtr(table));
                }
                //Check if the table has headings
                if (table.subheading && table.subheading.length > 0) {
                    return new Handlebars.SafeString(headingPtr(table));
                }
                //Check if the table is a normal table
                return new Handlebars.SafeString(defaultPtr(table));
            });
            Handlebars.registerHelper('hasAssetPermission',function(context,options){
                var rxtAPI  = require('rxt');
                var key = options.hash.key;
                var type = options.hash.type;
                var tenantId = options.hash.tenantId;
                var username = options.hash.username;
                var isAuthorized =options.hash.auth ? options.hash.auth : false; 
                var missingParams = (!key) || (!type) || (!tenantId) || (!username);
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
                }
                log.error('[hasAssetPermission] User '+username+' does not have permission: '+key+' to see ui area');
                return ;
            });
            Handlebars.registerHelper('hasAppPermission',function(context,options){
                var rxtAPI  = require('rxt');
                var key = options.hash.key;
                var type = options.hash.type;
                var tenantId = options.hash.tenantId;
                var username = options.hash.username;
                var isAuthorized =options.hash.auth ? options.hash.auth : false; 
                var missingParams = (!key) || (!tenantId) || (!username);
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
                log.error('[hasAppPermission] User ' + username + ' does not have permission: ' + key + ' to see ui area');
                return ;
            });
        },
        render: function(data, meta) {
            this.__proto__.render.call(this, data, meta);
        },
        globals: function(data, meta) {
            var publisher = require('/modules/publisher.js'),
                user = require('store').server.current(meta.session);
            return 'var store = ' + stringify({
                user: user ? user.username : null
            });
        }
    };
}()));
var resolve = function(path) {
    /*var themeResolver = this.__proto__.resolve;
    var asset = require('rxt').asset;
    path = asset.resolve(request, path, this.name, this, themeResolver);
    return path;*/
    var themeResolver = this.__proto__.resolve;
    var asset = require('rxt').asset;
    var app = require('rxt').app;
    for(var key in this.engine.partials){
    }
    var appPath = app.resolve(request, path, this.name, this, themeResolver, session);
    if (!appPath) {
        path = asset.resolve(request, path, this.name, this, themeResolver);
    } else {
        path = appPath;
    }
    return path;
};
