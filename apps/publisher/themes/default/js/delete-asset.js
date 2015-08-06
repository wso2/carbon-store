$(document).ready(function() {
    $('#Delete').addClass('not-active');
    if(store.publisher.lifecycle && store.publisher.lifecycle.deletableStates){
        var assetState = store.publisher.lifecycle.currentState;
        var deletableStates = store.publisher.lifecycle.deletableStates.split(',');
        var astState = assetState ? assetState.toLowerCase() : assetState;
        for (var index in deletableStates) {
            if (deletableStates[index].toLowerCase() == astState) {
                $('#Delete').removeClass('not-active');
            }
        }
    }else{
        $('#Delete').addClass('not-active');
    }

    $('#btn-delete').on('click', function(e) {
        var assetId = $('#asset-id').val();
        var assetType = $('#asset-type').val();
        var path = caramel.url('/apis/assets/' + assetId + '?type=' + assetType);
        var landingPage = $('#landing-page').val();
        var landingPageUrl = caramel.url(landingPage);
        $('#btn-delete').addClass('disabled');
        $('#delete-loading').removeClass('hide');

        $.ajax({
            url : path,
            type : 'DELETE',
            success : function(response) {
                $('.alert-success').html('Asset deleted successfully! <a href="'+landingPageUrl+'"> Home </a>');
                $('.alert-success').removeClass('hide');
                $('#btn-delete').addClass('disabled');
                $('#delete-loading').addClass('hide');
            },
            error : function() {
                $('.alert-success').text('Error while deleting asset!');
                $('.alert-success').removeClass('hide');
                $('#delete-loading').removeClass('hide');
                $('#delete-loading').addClass('hide');

            }
        });
    });

});