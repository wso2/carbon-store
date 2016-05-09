$(document).ready(function(){
    $('.image-display').click(function(){
        messages.modal_pop({content:'<img src="'+$(this).attr('src')+'" />'});
    });
});
