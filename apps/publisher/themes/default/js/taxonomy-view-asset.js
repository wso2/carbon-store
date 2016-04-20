$(function() {
    var programmatically = false;
    var URL = caramel.context + '/apis/asset/' + store.publisher.assetId + '/taxonomies?type=' + store.publisher.type;

    var selectedTaxa = [];
    var originalPath = "";
    var originalPathAry = [];
    $.ajax({
        url: URL,
        type: 'GET',
        async: false,
        headers: {
            Accept: "application/json"
        },
        success: function (response) {

            selectedTaxa = response.data;

            for (var i = 0; i < selectedTaxa.length; i++) {
                var pathList = selectedTaxa[i].split("/");
                for (var j = 0; j < pathList.length - 1; j++) {
                    try {
                        if (j == 0) {
                            originalPath = pathList[0];
                            if (originalPathAry.length == 0) {
                                originalPathAry.push(originalPath);
                            }
                        } else {
                            originalPath += "/" + pathList[j];
                            originalPathAry.push(originalPath);
                        }
                    } catch (e) {

                    }
                }
            }
            originalPathAry = unique(originalPathAry);
            originalPathAry = originalPathAry.reverse();
        },
        error: function () {
        }
    });


    function unique(list) {
        var result = [];
        $.each(list, function(i, e) {
            if ($.inArray(e, result) == -1) result.push(e);
        });
        return result;
    }

    var currentNode;
    var jsTreeView = $('#jstree-taxonomy');

    jsTreeView.jstree({
        conditionalselect : function (node, event) {
            var tree = $('#jstree-taxonomy').jstree(true);
            if (tree.is_leaf(node) || event.toElement.className == "jstree-icon jstree-checkbox" || event.toElement.className == "jstree-icon jstree-checkbox jstree-undetermined") {
                if (!tree.is_leaf(node)) {
                    tree.open_all(node);
                }
                return true;

            } else {
                //tree.open_node(node);
                if (tree.is_open(node)) {
                    tree.close_node(node);
                }else {
                    tree.open_node(node);
                }
                return false;
            }

        },
        plugins: ["checkbox", "conditionalselect"],
        core: {
            data: {
                animation: 0,
                check_callback: true,
                url: function (node) {
                    // modify url when clicking on tree nodes to load children
                    if (node.id === '#') {
                        return caramel.context + '/apis/taxonomies';
                    } else {
                        return caramel.context + '/apis/taxonomies?terms=' + node.id + '/children';
                    }
                },
                data: function (node) {
                    currentNode = node;
                },
                success: function (data) {

                    var children;
                    try {
                        children = Array.isArray(data[0].children);
                    } catch (e) {

                    }

                    if (children) {
                        data[0].id = data[0].elementName;
                        if (data[0].text == "") {
                            data[0].text = data[0].elementName;
                        }
                        for (var i = 0; i < data[0].children.length; i++) {
                            data[0].children[i].id = data[0].elementName + "/" + data[0].children[i].elementName;
                            if (data[0].children[i].text == "") {
                                data[0].children[i].text = data[0].children[i].elementName;
                            }
                        }
                    } else {
                        for (var i = 0; i < (data.length); i++) {
                            data[i].id = currentNode.original.id + "/" + data[i].elementName;
                            if (data[i].text == "") {
                                data[i].text = data[i].elementName;
                            }

                        }
                    }

                }

            },
            themes: {
                dots: true,
                icons: false
            }

        }

    });

    $("#jstree-taxonomy").on("click.jstree", function (e, datax) {
        programmatically = false;

    });
    /**
     * recursively open nodes. finally required nodes are opened, we will check required leaf nodes
     */
    $("#jstree-taxonomy").on("after_open.jstree", function (e, datax) {
        if (programmatically) {
            datax.instance.open_node(originalPathAry.pop());
            if (originalPathAry.length == 0) {
                for (var i = 0; i < selectedTaxa.length; i++) {
                    datax.instance.check_node(selectedTaxa[i]);
                }
            }
        }

    });

    function disable(node_id) {
        var node = $("#jstree-taxonomy").jstree().get_node( node_id );

        $("#jstree-taxonomy").jstree().disable_node(node);

        node.children.forEach( function(child_id) {
            disable( child_id );
        })
    };

    /**
     * This method will open root node by default
     */
    $("#jstree-taxonomy").on("ready.jstree", function (e, data) {
        // try to improve using data parameter
        var tree = $('#jstree-taxonomy').jstree(true);
        tree.open_node(tree.get_node("#").children);
        $("#" + tree.get_node("#").children[0]).find('.jstree-ocl').first().remove();
        $("#" + tree.get_node("#").children[0]).find('> a > .jstree-checkbox').remove();

        $('#jstree-taxonomy >ul > li').each( function() {
            disable( this.id );
        });
    });



    /**
     * This method will invoked on first load of (root) jstree
     */
    $("#jstree-taxonomy").on("loaded.jstree", function (e, datax) {
        programmatically = true;
        datax.instance.open_node(originalPathAry.pop());


    });




});
