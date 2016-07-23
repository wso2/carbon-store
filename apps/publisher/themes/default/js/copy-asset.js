$(document).ready(function() {
    // Create version when the Enter key is pressed
    $("#new-version").keyup(function(event){
        if(event.keyCode == 13){
            $("#btn-create-version").click();
        }
    });

    $('#btn-create-version').on('click', function(e) {
        e.preventDefault();
        var newVersion = $('#new-version').val();
        if (newVersion) {
            var assetId = $('#asset-id').val();
            var assetType = $('#asset-type').val();
            var path = caramel.url('/apis/asset/' + assetId + '/create-version?type=' + assetType);
            var assetPath = caramel.url('/assets/' + assetType + '/details/');
            $('#btn-create-version').addClass('disabled');
            $('#new-version-loading').removeClass('hide');
            var alertMessage = $("#alertSection");
            $.ajax({
                url: path,
                data: JSON.stringify({
                    "attributes": {
                        "overview_version": newVersion
                    }
                }),
                type: 'POST',
                success: function(response) {
                    messages.alertSuccess('Asset version created successfully!,You will be redirected to new asset details page in few seconds...');
                    setTimeout(function() {
                        var path = caramel.url('assets/' + assetType + '/details/' + response.data);
                        window.location = path;
                    }, 3000);
                },
                error: function(error) {
                    var errorText = JSON.parse(error.responseText).error;
                    messages.alertError(errorText);
                    $('#btn-create-version').removeClass('disabled');
                    $('#new-version-loading').addClass('hide');
                }
            });
        }
    });
    $('#btn-cancel-version').on('click', function(e) {
        var assetId = $('#asset-id').val();
        var assetType = $('#asset-type').val();
        var path = caramel.url('/assets/' + assetType + '/details/' + assetId);
        $.ajax({
            success: function(response) {
                window.location = path;
            }
        });
    });
});
