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
                        $('.selected-taxonomy-content').append(
                            '<div style="padding: 12px"><span>'
                            + appliedTaxonomy[key].split('/').join(' > ') + '</span></div>');
                    }
                }
            }
        }
    });
});
