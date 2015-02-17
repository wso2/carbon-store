var editor;

// Used to beautify the textarea which shows the json file content
function beautify() {
    var source = $('#idFileContent').val();
    var output = js_beautify(source);
    if (editor) {
        editor.setValue(output);
    }
}


$(function () {
    var textArea = $('#idFileContent')[0];

    editor = CodeMirror.fromTextArea(textArea, {
        lineNumbers: true,
        mode: "application/ld+json",
        matchBrackets: true,
        lineWrapping: true
    });

    beautify();

    //Attach submit handler to the form
    $("#confForm").submit(function(event) {
        //stop form from submitting normally
        event.preventDefault();

        var formData =  $('#confForm').serialize();
        var posting = $.post('registry-updater',formData);

        //Update once the result is obtained
        posting.done(function(data) {
            var content = data.data;
            $("#idFileContent").empty().append(content);
            alert("File Updated");
        });
    });

});

