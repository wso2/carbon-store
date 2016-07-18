$(document).ready(function () {
    var image = $('.image-display');
    image.click(function () {
        var noImage = $(this).data().error;
        if (noImage) {
            $(this).attr('src','').off('click').css({cursor: 'default'});
            return false;
        }
        messages.modal_pop({content: '<img class="img-responsive" src="' + $(this).attr('src') + '" />'});
    });
});