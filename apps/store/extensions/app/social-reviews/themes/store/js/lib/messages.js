/*
 *  Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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

var messages = {};
messages.alertSuccess = function (value) {
    $.notify.addStyle('happygreen', {
        html: "<div><i class='icon fa fa-check-circle'></i> <strong>Success! </strong><span data-notify-html/></div>",
        classes: {
            base: {
                "white-space": "nowrap",
                "background-color": "#5CB85C",
                "padding": "10px",
                "font-family": "Open Sans",
                "color": "white",
                "font-weight": 300
            },
            supergreen: {
                "color": "white",
                "background-color": "#5CB85C"
            }
        }
    });

    $.notify(value, {
        globalPosition: 'top center',
        className: 'success',
        style: 'happygreen'
    });
};
messages.alertError = function (value) {
    $.notify.addStyle('sadred', {
        html: "<div><i class='icon fw fw-error'></i> <strong>Error! </strong><span data-notify-html/></div>",
        classes: {
            base: {
                "white-space": "nowrap",
                "background-color": "#D9534F",
                "padding": "10px",
                "font-family": "Open Sans",
                "color": "white",
                "font-weight": 300
            },
            superred: {
                "color": "white",
                "background-color": "#D9534F"
            }
        }
    });

    $.notify(value, {
        globalPosition: 'top center',
        className: 'error',
        style: 'sadred'
    });
};
messages.alertInfo = function (value) {
    $.notify.addStyle('infoblue', {
        html: "<div><i class='icon fw fw-info'></i> <strong>Info! </strong><span data-notify-html/></div>",
        classes: {
            base: {
                "white-space": "nowrap",
                "background-color": "#009DA7",
                "padding": "10px",
                "font-family": "Open Sans",
                "color": "white",
                "font-weight": 300
            },
            supergreen: {
                "color": "white",
                "background-color": "#009DA7"
            }
        }
    });

    $.notify(value, {
        globalPosition: 'top center',
        className: 'info',
        style: 'infoblue'
    });
};
messages.alertInfoLoader = function (value) {
    $.notify.addStyle('happyblue', {
        html: "<div><span data-notify-html/></div>",
        classes: {
            base: {
                "white-space": "nowrap",
                "background-color": "009DA7",
                "padding": "10px"
            },
            superblue: {
                "color": "white",
                "background-color": "009DA7"
            }
        }
    });

    $.notify(value, {
        globalPosition: 'top center',
        className: 'info',
        autoHide: false,
        style: 'happyblue'
    });

};
messages.alertWarn = function (value) {
    $.notify.addStyle('happyyellow', {
        html: "<div><i class='icon fw fw-warning'></i> <strong>Warning! </strong><span data-notify-html/></div>",
        classes: {
            base: {
                "white-space": "nowrap",
                "background-color": "Gold",
                "padding": "10px"
            },
            superblue: {
                "color": "white",
                "background-color": "yellow"
            }
        }
    });

    $.notify(value, {
        globalPosition: 'top center',
        className: 'warn',
        style: 'happyyellow'
    });
};