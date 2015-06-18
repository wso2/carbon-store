$(document).ready(function() {

	$('#btn-create-version').on('click', function(e) {
		e.preventDefault();
		var newVersion = $('#new-version').val();
		if(newVersion){
			var assetId = $('#asset-id').val();
			var assetType = $('#asset-type').val();
			var path = caramel.url('/apis/asset/' + assetId + '/create-version?type=' + assetType);

			$.ajax({
				url : path,
				//data : JSON.stringify({"attributes":{"overview_name": "sample gadget","overview_version": newVersion,"overview_url": "wso2.org","overview_provider": "wso2","images_banner": "images_banner","overview_createdtime": "00000001434449823135","overview_category": "wso2","images_thumbnail": "images_thumbnail"}}),
				data : JSON.stringify({"attributes":{"overview_version": newVersion }}),
				type : 'POST',
				success : function(response) {
					$('.alert-success').text('Asset version created successfully!');
					$('.alert-success').removeClass('hide');
				},
				error : function() {
					$('.alert-success').text('Error while cretaing the version!');
					$('.alert-success').removeClass('hide');
				}
			});
			//$("#newVersionModal").modal('hide');
			}
	});

});
