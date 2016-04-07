var messages = {};
messages.alertSuccess = function(value){
    $.notify.addStyle('happygreen', {
        html: "<div><span data-notify-html/></div>",
        classes: {
            base: {
                "white-space": "nowrap",
                "background-color": "lightgreen",
                "padding": "10px"
            },
            supergreen: {
                "color": "white",
                "background-color": "DarkGreen"
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
        html: "<div><span data-notify-html/></div>",
        classes: {
            base: {
                "white-space": "nowrap",
                "background-color": "IndianRed",
                "padding": "10px"
            },
            superred: {
                "color": "white",
                "background-color":  "Maroon"
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
    $.notify(value, {
        globalPosition: 'top center',
        className: 'info'
    });
};
messages.alertInfoLoader = function(value){
    $.notify.addStyle('happyblue', {
        html: "<div><span data-notify-html/></div>",
        classes: {
            base: {
                "white-space": "nowrap",
                "background-color": "lightblue",
                "padding": "10px"
            },
            superblue: {
                "color": "white",
                "background-color": "blue"
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
        html: "<div><span data-notify-html/></div>",
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