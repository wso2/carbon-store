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
                var isRequired=(field.required == 'true' || field.required)? true : false; //field.required is not boolean
                var isReadOnly=false;
                var placeHolder = (field.placeholder)?field.placeholder:false;
                var meta=' name="' + (name?name:field.name.tableQualifiedName) + '" '+
                         ' id="' + (name?name:field.name.tableQualifiedName) + '" '+
                         ' class="input-large"';
                var isUpdatable = true;
                var mode = options?(options.hash.mode?options.hash.mode:'create'):'create';
                if(mode == "edit"){
                    isReadOnly = field.readonly || field.auto;
                }else{
                    isReadOnly = (field.auto)?field.auto:false;
                }
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
                    if (field.required == 'true' || field.required){ //field.required is not boolean
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
            var renderOptionsTextField = function(field) {
                var value;
                var values = field.value;
                var output = '';
                var ref = require('utils').reflection;
                var buttonName = field.name?field.name.label:'Cannot locate name';
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
                        output += '<td valign="top">' + renderOptionsForOptionsText(option, field.values[0].value, field) + '</td>';
                        output += '<td valign="top"><input type="text" class="form-control" value="' + Handlebars.Utils.escapeExpression(text) + '" ' + renderFieldMetaData(field,field.name.tableQualifiedName+'_text') + ' /></td>';
                        output += '<td><a class="js-remove-row"><i class="fa fa-trash"></i></a> </td>';
                        output += '</tr>';
                    }
                } else {
                    output += '<tr id="table_reference_'+field.name.name+'">';
                    var index='0';
                    output += '<td valign="top">' + renderOptionsForOptionsText(option, field.values[0].value, field) + '</td>';
                    output += '<td valign="top"><input type="text" class="form-control"' + renderFieldMetaData(field,field.name.tableQualifiedName+'_text') + ' /></td>';
                    output += '<td><a class="js-remove-row"><i class="fa fa-trash"></i></a> </td>'
                    output += '</tr>';
                }
                return output;
            };
            var renderFileField = function(field, value) {
                var out = '<td><input type="hidden" name="old_' + field.name.tableQualifiedName + '" value="' + Handlebars.Utils.escapeExpression(value) + '" >';
                out += '<input type="file" value="' + Handlebars.Utils.escapeExpression(value) + '" ' + renderFieldMetaData(field) + '></td>';
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
                        out = '<div class="custom-form-right col-lg-5 col-md-8 col-sm-8 col-xs-12"><input type="text" class="form-control"  value="' + Handlebars.Utils.escapeExpression(value) + '"" ' + renderFieldMetaData(field, null, options) + ' class="span8" ></div>';
                        break;
                    case 'text-area':
                        out = '<div class="custom-form-right col-lg-5 col-md-8 col-sm-8 col-xs-12"><textarea row="3" style="width:100%; height:70px"' + renderFieldMetaData(field, null, options) + ' class="width-full">' + Handlebars.Utils.escapeExpression(value) + '</textarea></div>';
                        break;
                    case 'file':
                        out = '<div class="custom-form-right col-lg-5 col-md-8 col-sm-8 col-xs-12"><input type="file"  value="' + Handlebars.Utils.escapeExpression(value) + '" ' + renderFieldMetaData(field, null, options) + ' ></div>';
                        break;
                    case 'date':
                        out = '<div class="custom-form-right col-lg-5 col-md-8 col-sm-8 col-xs-12"><input type="text" data-render-options="date-time"  value="' + Handlebars.Utils.escapeExpression(value) + '" ' + renderFieldMetaData(field, null, options) + ' ></div>';
                        break;
                    case 'checkbox':
                        var checkboxString = "";
                        if(options.hash.mode == "edit"){
                            if(value == "on"){
                                checkboxString = 'checked="checked"';
                            }else{
                                checkboxString = '';
                            }
                        }else{
                            value="on";
                        }
                        out = '<div class="custom-form-right col-lg-5 col-md-8 col-sm-8 col-xs-12"><input type="checkbox" ' + renderFieldMetaData(field, null, options) + ' '+checkboxString+' ></div>';
                        break;
                    case 'password':
                        out = '<div class="custom-form-right col-lg-5 col-md-8 col-sm-8 col-xs-12"><input type="password" value="' + Handlebars.Utils.escapeExpression(value) + '" ' + renderFieldMetaData(field, null, options) + ' ></div>';
                        break;
                    case 'option-text':
                        if(field.maxoccurs && field.maxoccurs == "unbounded"){
                            out = '<div class="col-lg-2 col-md-2 col-sm-12 col-xs-12" style="padding:0">&nbsp;</div>' +
                                  '<div style="border:0px solid #ff0000; padding:0" class="col-lg-10 col-md-10 col-sm-12 col-xs-12">'+
//                                      '<div class="add-unbounded-row"><a class="js-add-unbounded-row" data-name="'+field.name.name+'"><i class="fa fa-plus-circle"></i> Add '+field.name.name+'</a></div>' +
                                      '<table class="tablex cu-data-table js-unbounded-table" id="table_'+field.name.name+'">'+
                                      '<thead><tr style="display: none"><th></th><th></th><th></th></tr></thead>'+
                                      '<tbody>'+
                                       renderOptionsTextField(field)+
                                      '</tbody>'+
                                      '</table>'+
                                  '</div>';

                            /*out+= '<table style="display: none;" class="tmp_refernceTableForOptionText">'+
                                    renderOptionsTextField({name:field.name,values:field.values,label:field.label})+
                                  '</table>';*/
                        }

                        break;
                    default:
                        out = '<div class="custom-form-right col-lg-5 col-md-8 col-sm-8 col-xs-12">Normal Field' + field.type + '</div>';
                        break;
                }
                return out;
            };
            var renderTableField = function(field,mode) {
                var out = '';
                var value = field.value || '';

                switch (field.type) {
                    case 'options':
                        out = '<td valign="top">' + renderOptions(field.value, field.values[0].value, field) + '</td>';
                        break;
                    case 'text':
                        out = '<td valign="top"><input type="text" class="form-control" value="' + Handlebars.Utils.escapeExpression(value) + '"" ' + renderFieldMetaData(field) + ' class="span8" ></td>';
                        break;
                    case 'text-area':
                        out = '<td valign="top"><textarea row="3" style="width:100%; height:70px"' + renderFieldMetaData(field) + ' class="span8">' + Handlebars.Utils.escapeExpression(value) + '</textarea></td>';
                        break;
                    case 'file':
                        out = '<td valign="top"><input type="file" class="form-control" value="' + Handlebars.Utils.escapeExpression(value) + '" ' + renderFieldMetaData(field) + ' ></td>';
                        break;
                    case 'date':
                        out = '<td valign="top"><input type="text" data-render-options="date-time"  value="' + Handlebars.Utils.escapeExpression(value) + '" ' + renderFieldMetaData(field, null, {"hash" : {"mode" : null}}) + ' ></td>';
                        break;
                    case 'checkbox':
                        var checkboxString = "";
                        if(mode == "edit"){
                            if(value == "on"){
                                checkboxString = 'checked="checked"';
                            }else{
                                checkboxString = '';
                            }
                        }else{
                            value="on";
                        }
                        out = '<td valign="top"><input type="checkbox" ' + renderFieldMetaData(field, null, {"hash" : {"mode" : null}}) + ' ' + Handlebars.Utils.escapeExpression(checkboxString) + ' ></td>';
                        break;
                    case 'password':
                        out = '<td valign="top"><input type="password" value="' + Handlebars.Utils.escapeExpression(value) + '" ' + renderFieldMetaData(field, null, {"hash" : {"mode" : null}}) + ' ></td>';
                        break;
                    default:
                        out = '<td valign="top">Normal Field' + field.type + '</td>';
                        break;
                }
                return out;
            };
            var renderFieldValue = function(field, value, mode) {
                var out = '';
                switch (field.type) {
                    case 'options':
                        out = '<td valign="top">' + renderOptions(value, field.values[0].value, field) + '</td>';
                        break;
                    case 'text':
                        out = '<td valign="top"><input type="text" value="' + Handlebars.Utils.escapeExpression(value) + '"' + renderFieldMetaData(field) + ' ></td>';
                        break;
                    case 'text-area':
                        out = '<td valign="top"><textarea row="3" style="width:100%; height:70px" ' + renderFieldMetaData(field) + '>' + Handlebars.Utils.escapeExpression(value) + '</textarea></td>';
                        break;
                    case 'file':
                        out = '<td valign="top"><input type="text" value="' + Handlebars.Utils.escapeExpression(value) + '"' + renderFieldMetaData(field) + ' ></td>';
                        break;
                    case 'date':
                        out = '<td valign="top"><input type="text" data-render-options="date-time"  value="' + Handlebars.Utils.escapeExpression(value) + '" ' + renderFieldMetaData(field, null, {"hash" : {"mode" : null}}) + ' ></td>';
                        break;
                    case 'checkbox':
                        var checkboxString = "";
                        if(mode == "edit"){
                            if(value == "on"){
                                checkboxString = 'checked="checked"';
                            }else{
                                checkboxString = '';
                            }
                        }else{
                            value="on";
                        }
                        out = '<td valign="top"><input type="checkbox" ' + renderFieldMetaData(field, null, {"hash" : {"mode" : null}}) + ' ' + Handlebars.Utils.escapeExpression(checkboxString) + ' ></td>';
                        break;
                    case 'password':
                        out = '<td valign="top"><input type="password" value="' + Handlebars.Utils.escapeExpression(value) + '" ' + renderFieldMetaData(field, null, {"hash" : {"mode" : null}}) + ' ></td>';
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
            Handlebars.registerHelper('renderEditableUnboundTableRow', function(table) {
                var field = getFirstField(table);
                var fieldValue = '';
                if(field.values && typeof field.values === "object"){
                    fieldValue = field.values[0].value;
                }
                var output = '';
                output += '<tr id="table_reference_'+table.name+'">';
                output += '<td valign="top">' + renderOptionsForOptionsText('', fieldValue, field) + '</td>';
                output += '<td valign="top"><input type="text" class="form-control"' + renderFieldMetaData(field,field.name.tableQualifiedName+'_text') + ' /></td>';
                output += '<td><a class="js-remove-row"><i class="fa fa-trash"></i></a> </td>';
                output += '</tr>';
                return new Handlebars.SafeString(output);
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
            //If there is no rows then a single empty row with the fields should be rendererd
            /*Handlebars.registerHelper('renderEditableUnboundTableRow', function(table) {
                //Get the number of rows in the table

                var fields = table.fields;
                var out = '';
                out += '<tr id="table_reference_'+table.name+'">';
                for (var key in fields) {
                    fields[key].value = "";
                    out += renderTableField(fields[key]);
                }
                out += '<td><a class="js-remove-row"><i class="fa fa-trash"></i></a> </td>';
                out += '</tr>';

                return new Handlebars.SafeString(out);

            });*/
            Handlebars.registerHelper('renderEditableUnboundTable', function(table) {
                //Get the number of rows in the table
                var rowCount = getNumOfRowsUnbound(table);
                var fields = table.fields;
                var out = '';
                var mode=table.mode;
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
                            out += renderFieldValue(field, value, mode);
                        }
                        out += '<td><a class="js-remove-row"><i class="fa fa-trash"></i></a> </td>';
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
                if(table.subheading && table.subheading.length > 0){
                    table.subheading = table.subheading[0].heading;
                }
                //Check if the table is unbounded
                if ( table.fields.asset && table.fields.asset.maxoccurs && (table.fields.asset.maxoccurs == 'unbounded' )) {
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
