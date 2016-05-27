$(document).ready(function () {
    var image = $('.image-display');
    image.click(function () {
        messages.modal_pop({content: '<img class="img-responsive" src="' + $(this).attr('src') + '" />'});
    });
    image.error(
        function () {
            $(this).unbind("click").css("cursor", "default")
        });
});
