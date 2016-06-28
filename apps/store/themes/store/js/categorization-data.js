(function(history){
    //This function detects history.pushState() event
    var pushState = history.pushState;
    history.pushState = function(state, title, url) {
        if (typeof history.onpushstate == "function") {
            history.onpushstate({state: state});
        }
        loadCategorizationEntries(url);
        return pushState.apply(history, arguments);
    };

    /**
     * This method loads the categorization-entry partial data when selection query changes.
     *
     * @param url   url to load the data from
     */
    function loadCategorizationEntries(url) {
        caramel.data({
            title : null,
            body : ['assets']
        }, {
            url: url,
            success: function(data, status, xhr) {
                caramel.partials(data._.partials, function() {
                    caramel.render('categorization-entry', data.body.assets.context, function(info, content) {
                        $('#categorization-div').html(content);
                        categorization();
                        $('.refine > .panel > div').first().collapse('show');
                    });
                });
            }
        });
    }
})(window.history);

$(document).ready(function() {
    $('.refine > .panel > div').first().collapse('show');
});
