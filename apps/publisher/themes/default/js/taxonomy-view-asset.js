$(function () {
    var URL = caramel.context + '/apis/asset/' + store.publisher.assetId + '/taxonomies?type=' + store.publisher.type;

    $.ajax({
        url: URL,
        type: 'GET',
        async: false,
        headers: {
            Accept: "application/json"
        },
        success: function (response) {
            var appliedTaxonomy = response.data;
            if (appliedTaxonomy.length > 0) {
                for (var key in appliedTaxonomy) {
                    if (appliedTaxonomy.hasOwnProperty(key)) {
                        var element = appliedTaxonomy[key];
                        getTaxonomyDisplayName(element);
                        if (displayValue.length == 0) {
                            continue;
                        }
                        $('.selected-taxonomy-content').append(
                            '<div class="selected-item" style="padding: 12px"><span>'
                            + displayValue.join(' > ') + '</span></div>');
                    }
                    displayValue.length = 0;
                }
                $('#taxonomy').collapse('show');
            } else {
                $('.selected-taxonomy-container').hide();
                $('#taxonomy').append('<div id="no-table-data"><b>No taxonomy data available</b></div>');
            }
        }
    });
});
