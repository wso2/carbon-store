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
                        output += '<tr><td>' + option + '</td><td>' + text + '</td></tr>';
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
                    out += '<td>' + (fields[key].value || ' ') + '</td>';
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
                    for (var key in fields) {
                        //Determine if the value is an array
                        if (!ref.isArray(fields[key].value)) {
                            fields[key].value = [fields[key].value];
                        }
                        var value = fields[key].value[index] ? fields[key].value[index] : ' ';
                        out += '<td>' + value + '</td>';
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
                var isRequired=(field.required)?field.required:false;
                var isReadOnly=(field.readonly)?field.readonly:false;
                var meta=' name="' + (name?name:field.name.tableQualifiedName) + '" class="input-large"';
                var isUpdatable = true;
                if(field.updatable == false){
                    isUpdatable = false;
                }
                var mode = options?(options.hash.mode?options.hash.mode:'create'):'create';
                if(isRequired && field.type != 'file'){
                    meta+=' required';
                } else if (isRequired && field.type == 'file' && mode == 'create') {
                    meta+=' required';
                }
                if(isReadOnly){
                    meta+=' readonly';
                } else if(!isUpdatable && mode == 'edit'){
                    meta+=' readonly';
                }
                return meta;
            };
            var renderFieldLabel = function(field) {
                var output = '';
                var isHidden= (field.hidden)?field.hidden:false;
                if (!isHidden){
                    output = '<label class="custom-form-label col-lg-2 col-md-2 col-sm-12 col-xs-12">' + (field.name.label || field.name.name) + '</label>';
                }
                return output;
            };
            var renderOptions = function(value, values, field,count) {
                var id=(count)?field.name.tableQualifiedName+'_option_'+count:undefined;
                var out = '<select ' + renderFieldMetaData(field,id) + '>';
                if (value) {
                    out += '<option selected>' + value + '</option>';
                }
                for (var index in values) {
                    out += '<option>' + values[index].value + '</option>';
                }
                //Filter out the selected
                out += '</select>';
                return out;
            };
            var renderOptionsTextField = function(field) {
                var value;
                var values = field.value;
                var output = '';
                var ref = require('utils').reflection;
                var buttonName=field.name?field.name.label:'Cannot locate name';
                output+='<tr><td colspan="3"><a class="btn-inline-form btn-add-dark" onClick="addOptionTextRow(this)">Add '+buttonName+'</a></td></tr>';
                if (values) {
                    //If there is only a single entry then the registry API will send a string
                    //In order to uniformly handle these scenarios we must make it an array
                    if (!ref.isArray(values)) {
                        values = [values];
                    }
                    for (var index in values) {
                        value = values[index];
                        var delimter = value.indexOf(':')
                        var option = value.substring(0, delimter);
                        var text = value.substring(delimter + 1, value.length);
                        output += '<tr>';
                        output += '<td valign="top">' + renderOptions(option, field.values[0].value, field,index) + '</td>';
                        output += '<td valign="top"><input type="text" class="form-control" value="' + text + '" ' + renderFieldMetaData(field,field.name.tableQualifiedName+'_text_'+index) + ' /></td>';
                        output+='<td valign="top"><a class="btn-inline-tr btn-delete-dark" onClick="removeOptionTextRow(this)" >Delete</a>';
                        output += '</tr>';
                    }
                } else {
                    output += '<tr>';
                    var index='0';
                    output += '<td valign="top">' + renderOptions(option, field.values[0].value, field,index) + '</td>';
                    output += '<td valign="top"><input type="text" class="form-control"' + renderFieldMetaData(field,field.name.tableQualifiedName+'_text_'+index) + ' /></td>';
                    output+='<td valign="top"><a class="btn-inline-tr btn-delete-dark" onClick="removeOptionTextRow(this)" >Delete</a>';
                    output += '</tr>';
                }
                return output;
            };
            var renderFileField = function(field, value) {
                var out = '<td><input type="hidden" name="old_' + field.name.tableQualifiedName + '" value="' + value + '" >';
                out += '<input type="file" value="' + value + '" ' + renderFieldMetaData(field) + '></td>';
                return out;
            };
            var renderField = function(field, options) {
                var out = '';
                var value = field.value || '';
                switch (field.type) {
                    case 'options':
                        out = '<div class="custom-form-right col-lg-5 col-md-8 col-sm-8 col-xs-12">' + renderOptions(field.value, field.values[0].value, field) + '</div>';
                        break;
                    case 'text':
                        out = '<div class="custom-form-right col-lg-5 col-md-8 col-sm-8 col-xs-12"><input type="text" class="form-control"  value="' + value + '"" ' + renderFieldMetaData(field, null, options) + ' class="span8" ></div>';
                        break;
                    case 'text-area':
                        out = '<div class="custom-form-right col-lg-5 col-md-8 col-sm-8 col-xs-12"><textarea row="3" style="width:100%; height:70px"' + renderFieldMetaData(field, null, options) + ' class="width-full">'+value+'</textarea></div>';
                        break;
                    case 'file':
                        out = '<div class="custom-form-right col-lg-5 col-md-8 col-sm-8 col-xs-12"><input type="file"  value="' + value + '" ' + renderFieldMetaData(field, null, options) + ' ></div>';
                        break;
                    default:
                        out = '<div class="custom-form-right col-lg-5 col-md-8 col-sm-8 col-xs-12">Normal Field' + field.type + '</div>';
                        break;
                }
                return out;
            };
            var renderTableField = function(field) {
                var out = '';
                var value = field.value || '';
                switch (field.type) {
                    case 'options':
                        out = '<td valign="top">' + renderOptions(field.value, field.values[0].value, field) + '</td>';
                        break;
                    case 'text':
                        out = '<td valign="top"><input type="text" class="form-control" value="' + value + '"" ' + renderFieldMetaData(field) + ' class="span8" ></td>';
                        break;
                    case 'text-area':
                        out = '<td valign="top"><textarea row="3" style="width:100%; height:70px"' + renderFieldMetaData(field) + ' class="span8">'+value+'</textarea></td>';
                        break;
                    case 'file':
                        out = '<td> valign="top"<input type="file" class="form-control" value="' + value + '" ' + renderFieldMetaData(field) + ' ></td>';
                        break;
                    default:
                        out = '<td valign="top">Normal Field' + field.type + '</td>';
                        break;
                }
                return out;
            };
            var renderFieldValue = function(field, value) {
                var out = '';
                switch (field.type) {
                    case 'options':
                        out = '<td valign="top">' + renderOptions(value, field.values[0].value, field) + '</td>';
                        break;
                    case 'text':
                        out = '<td valign="top"><input type="text" value="' + value + '"' + renderFieldMetaData(field) + ' ></td>';
                        break;
                    case 'text-area':
                        out = '<td valign="top"><input type="text-area" value="' + value + '"' + renderFieldMetaData(field) + '></td>';
                        break;
                    case 'file':
                        out = '<td valign="top"><input type="text" value="' + value + '"' + renderFieldMetaData(field) + ' ></td>';
                        break;
                    default:
                        out = '<td valign="top">Normal Field' + field.type + '</td>';
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
                    out += renderField(field);
                }
                return new Handlebars.SafeString(out);
            });
            Handlebars.registerHelper('renderEditableField', function(field, options) {
                var label = renderFieldLabel(field);
                return new Handlebars.SafeString(label + renderField(field, options));
            });
            Handlebars.registerHelper('renderEditableHeadingTable', function(table) {
                var fieldCount = getFieldCount(table);
                var firstField = getFirstField(table);
                //Determine if there is only one field and it is an option text
                if ((fieldCount == 1) && (firstField.type == 'option-text')) {
                    return new Handlebars.SafeString(renderOptionsTextField(firstField));
                } else {
                    return new Handlebars.SafeString(renderEditableHeadingField(table));
                }
            });
            Handlebars.registerHelper('renderEditableUnboundTable', function(table) {
                //Get the number of rows in the table
                var rowCount = getNumOfRowsUnbound(table);
                var fields = table.fields;
                var out = '';
                var ref = require('utils').reflection;
                //If there is no rows then a single empty row with the fields should be rendererd
                if (rowCount == 0) {
                    out += '<tr>';
                    for (var key in fields) {
                        out += renderField(fields[key]);
                    }
                    out += '</tr>';
                } else {
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
                            out += renderFieldValue(field, value);
                        }
                        out += '</tr>';
                    }
                }
                return new Handlebars.SafeString(out);
            });
            Handlebars.registerHelper('renderTable', function(table, options) {
                table.mode = options.hash.mode;
                var headingPtr = Handlebars.compile('{{> editable_heading_table .}}');
                var defaultPtr = Handlebars.compile('{{> editable_default_table .}}');
                var unboundPtr = Handlebars.compile('{{> editable_unbound_table .}}');
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
        },
        render: function(data, meta) {
            if (request.getParameter('debug') == '1') {
                response.addHeader("Content-Type", "application/json");
                print(stringify(data));
            } else {
                this.__proto__.render.call(this, data, meta);
            }
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
    var appPath = app.resolve(request, path, this.name, this, themeResolver, session);
    if (!appPath) {
        path = asset.resolve(request, path, this.name, this, themeResolver);
    } else {
        path = appPath;
    }
    return path;
};