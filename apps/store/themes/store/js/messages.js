var messages = {};
messages.alertSuccess = function(value){
    $.notify.addStyle('happygreen', {
        html: "<div><i class='icon fa fa-check-circle'></i> <strong>Success! </strong><span data-notify-html/></div>",
        classes: {
            base: {
                "white-space": "nowrap",
                "background-color": "#5CB85C",
                "padding": "10px",
                "font-family":"Open Sans",
                "color":"white",
                "font-weight":300
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
messages.alertError = function(value){
    $.notify.addStyle('sadred', {
        html: "<div><i class='icon fw fw-error'></i> <strong>Error! </strong><span data-notify-html/></div>",
        classes: {
            base: {
                "white-space": "nowrap",
                "background-color": "#D9534F",
                "padding": "10px",
                "font-family":"Open Sans",
                "color":"white",
                "font-weight":300
            },
            superred: {
                "color": "white",
                "background-color":  "#D9534F"
            }
        }
    });

    $.notify(value, {
        globalPosition: 'top center',
        className: 'error',
        style: 'sadred'
    });
};
messages.alertInfo = function(value){
    $.notify.addStyle('infoblue', {
        html: "<div><i class='icon fw fw-info'></i> <strong>Info! </strong><span data-notify-html/></div>",
        classes: {
            base: {
                "white-space": "nowrap",
                "background-color": "#009DA7",
                "padding": "10px",
                "font-family":"Open Sans",
                "color":"white",
                "font-weight":300
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
        style:'infoblue'
    });
};
messages.alertInfoLoader = function(value){
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
messages.alertWarn = function(value){
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