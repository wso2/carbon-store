/*
 *  Copyright (c) 2005-2014, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 *
 */
(function(LifecycleAPI, $) {
    'use strict';
    var constants = LifecycleAPI.constants;
    var failedToLoadLifecycle = function() {
        alert('Failed to load the lifecycle');
    };
    var doneLoadingLifecycle = function(data) {
        alert('Loaded the lifecycle');
        LifecycleAPI.event('lifecycleLoad', data);
    };
    var buildLifecycleDefinitionQuery = function(ep, name) {
        return ep + '/' + name;
    };
    var loadLifecycleDefinition = function(lifecycleName) {
        var ep = LifecycleAPI.configs(constants.API_ENDPOINT);
        var promise = $.ajax({
            url: buildLifecycleDefinitionQuery(ep, lifecycleName),
        });
        promise.done(doneLoadingLifecycle);
        promise.fail(failedToLoadLifecycle);
    };
    var recursiveBuildD3Data = function(root, stateMap, d3Map) {
        if ((!stateMap[root]) || (stateMap[root].transitions.length == 0)) {
            return d3Map;
        } else {
            d3Map.name = root;
            d3Map.children = [];
            var result;
            var transition;
            for (var index = 0; index < stateMap[root].transitions.length; index++) {
                transition = stateMap[root].transitions[index];
                result = recursiveBuildD3Data(transition.target.toLowerCase(), stateMap, d3Map)
                d3Map.children.push(result);
            }
            return d3Map;
        }
    }
    var d3DataAdapter = function(map) {
        var data = {};
        data.name = map.initialState;
        data.children = [];
        recursiveBuildD3Data(data.name, map.states, data);
        console.log(data);
    };
    var processCheckItems = function(stateDetails, datamodel) {
    	if(!stateDetails.hasOwnProperty('datamodel')){
    		stateDetails.datamodel ={};
    	}
    	stateDetails.datamodel.checkItems  = datamodel.item; 
    }
    var processDataModel = function(stateDetails, datamodel) {
        switch (datamodel.name) {
            case 'checkItems':
            	processCheckItems(stateDetails,datamodel);
            	break;
            default:
                break;
        }
    };
    LifecycleAPI.event('lifecycleLoad', function(data) {
        var definition = data.data.definition.configuration.lifecycle.scxml.state;
        var initialState = data.data.definition.configuration.lifecycle.scxml.initialstate;
        var stateMap = {};
        var state;
        var stateDetails;
        var nodeCount = 0;
        var datamodels;
        var datamodel;
        var transition;
        stateMap.states = {};
        stateMap.initialState = initialState ? initialState.toLowerCase() : initialState;
        for (var stateKey in definition) {
            stateDetails = definition[stateKey];
            state = stateMap.states[stateKey] = {};
            state.id = stateKey;
            state.label = stateDetails.id;
            state.transitions = stateDetails.transition || [];
            stateDetails.datamodel = stateDetails.datamodel? stateDetails.datamodel :[];
            datamodels = stateDetails.datamodel.data || [];
            //Convert the target states to lower case
            for (var index = 0; index < state.transitions.length; index++) {
                transition = state.transitions[index];
                transition.target = transition.target.toLowerCase();
            }
            //Process the data model
            for (var dIndex = 0; dIndex < datamodels.length; dIndex++) {
                datamodel = datamodels[dIndex];
                processDataModel(state,datamodel);
            }
            nodeCount++;
        }
        dag2Render(stateMap);
        renderCheckItems(stateMap.states);
        renderActions(stateMap.states);
    });
    loadLifecycleDefinition('ServiceLifeCycle');
    var sampleNodes = [{
        name: 'a'
    }, {
        name: 'b'
    }, {
        name: 'c'
    }];
    var sampleLinks = [{
        source: 0,
        target: 1,
        weight: 50
    }, {
        source: 1,
        target: 2,
        weight: 20
    }];
    var width = 900;
    var height = 400;
    var d3Render = function() {
        var force = d3.layout.force();
        force.nodes(sampleNodes);
        force.links(sampleLinks);
        force.size([width, height]);
        force.charge(-3000);
        force.linkDistance(50);
        //force.gravity(1);
        // force.linkStrength(function(x) {
        //     return x.weight * 10;
        // });
        force.start();
        var vis = d3.select('#lifecycle-rendering-area').append('svg').attr('width', width).attr('height', height);
        //vis.text('Hello World!');
        var node = vis.selectAll('circle.nodes').data(force.nodes()).enter().append('svg:circle').
        attr('cx', function(d) {
            console.log('x ' + d.x);
            return d.x;
        }).
        attr('cy', function(d) {
            console.log('y ' + d.y);
            return d.y;
        }).
        attr('r', '10px').
        attr('fill', 'black');
        vis.selectAll('.line').data(sampleLinks).enter().append('line').attr('x1', function(d) {
            console.log('source ' + d.source.y);
            return d.source.x;
        }).attr('y1', function(d) {
            return d.source.y;
        }).attr('x2', function(d) {
            return d.target.x;
        }).attr('y2', function(d) {
            return d.target.y;
        }).style('stroke', 'rgb(6,120,155)');
    };
    var dagRender = function() {
        // Create a new directed graph
        var g = new dagreD3.graphlib.Graph().setGraph({});
        // States and transitions from RFC 793
        var states = ["CLOSED", "LISTEN", "SYN RCVD", "SYN SENT", "ESTAB", "FINWAIT-1", "CLOSE WAIT", "FINWAIT-2", "CLOSING", "LAST-ACK", "TIME WAIT"];
        // Automatically label each of the nodes
        states.forEach(function(state) {
            g.setNode(state, {
                label: state
            });
        });
        // Set up the edges
        g.setEdge("CLOSED", "LISTEN", {
            label: "open"
        });
        g.setEdge("LISTEN", "SYN RCVD", {
            label: "rcv SYN"
        });
        g.setEdge("LISTEN", "SYN SENT", {
            label: "send"
        });
        g.setEdge("LISTEN", "CLOSED", {
            label: "close"
        });
        g.setEdge("SYN RCVD", "FINWAIT-1", {
            label: "close"
        });
        g.setEdge("SYN RCVD", "ESTAB", {
            label: "rcv ACK of SYN"
        });
        g.setEdge("SYN SENT", "SYN RCVD", {
            label: "rcv SYN"
        });
        g.setEdge("SYN SENT", "ESTAB", {
            label: "rcv SYN, ACK"
        });
        g.setEdge("SYN SENT", "CLOSED", {
            label: "close"
        });
        g.setEdge("ESTAB", "FINWAIT-1", {
            label: "close"
        });
        g.setEdge("ESTAB", "CLOSE WAIT", {
            label: "rcv FIN"
        });
        g.setEdge("FINWAIT-1", "FINWAIT-2", {
            label: "rcv ACK of FIN"
        });
        g.setEdge("FINWAIT-1", "CLOSING", {
            label: "rcv FIN"
        });
        g.setEdge("CLOSE WAIT", "LAST-ACK", {
            label: "close"
        });
        g.setEdge("FINWAIT-2", "TIME WAIT", {
            label: "rcv FIN"
        });
        g.setEdge("CLOSING", "TIME WAIT", {
            label: "rcv ACK of FIN"
        });
        g.setEdge("LAST-ACK", "CLOSED", {
            label: "rcv ACK of FIN"
        });
        g.setEdge("TIME WAIT", "CLOSED", {
            label: "timeout=2MSL"
        });
        // Set some general styles
        g.nodes().forEach(function(v) {
            var node = g.node(v);
            node.rx = node.ry = 5;
        });
        // Add some custom colors based on state
        g.node('CLOSED').style = "fill: #f77";
        g.node('ESTAB').style = "fill: #7f7";
        d3.select('svg').append('g');
        var svg = d3.select("svg"),
            inner = svg.select("g");
        // Set up zoom support
        var zoom = d3.behavior.zoom().on("zoom", function() {
            inner.attr("transform", "translate(" + d3.event.translate + ")" + "scale(" + d3.event.scale + ")");
        });
        svg.call(zoom);
        // Create the renderer
        var render = new dagreD3.render();
        // Run the renderer. This is what draws the final graph.
        render(inner, g);
        // Center the graph
        var initialScale = 0.75;
        zoom.translate([(svg.attr("width") - g.graph().width * initialScale) / 2, 20]).scale(initialScale).event(svg);
        svg.attr('height', g.graph().height * initialScale + 40);
    };
    var dag2Render = function(stateMap) {
        // Create a new directed graph
        var g = new dagreD3.graphlib.Graph().setGraph({});
        var state;
        var transition;
        var source;
        for (var key in stateMap.states) {
            state = stateMap.states[key];
            g.setNode(key, {
                label: state.id
            });
        }
        //Add the edges
        for (key in stateMap.states) {
            state = stateMap.states[key];
            source = key;
            for (var index = 0; index < state.transitions.length; index++) {
                transition = state.transitions[index];
                g.setEdge(source, transition.target, {
                    label: transition.event
                });
            }
        }
        // Set some general styles
        g.nodes().forEach(function(v) {
            var node = g.node(v);
            node.rx = node.ry = 5;
        });
        // Add some custom colors based on state
        //g.node('CLOSED').style = "fill: #f77";
        //g.node('ESTAB').style = "fill: #7f7";
        d3.select('svg').append('g');
        var svg = d3.select("svg"),
            inner = svg.select("g");
        // Set up zoom support
        var zoom = d3.behavior.zoom().on("zoom", function() {
            inner.attr("transform", "translate(" + d3.event.translate + ")" + "scale(" + d3.event.scale + ")");
        });
        svg.call(zoom);
        // Create the renderer
        var render = new dagreD3.render();
        // Run the renderer. This is what draws the final graph.
        render(inner, g);
        // Center the graph
        var initialScale = 1;
        zoom.translate([(svg.attr("width") - g.graph().width * initialScale) / 2, 20]).scale(initialScale).event(svg);
        //zoom.translate([20,(svg.attr("height") - g.graph().height * initialScale) / 2]).scale(initialScale).event(svg);
        svg.attr('height', g.graph().height * initialScale + 40);
        //svg.attr('width', g.graph().width * initialScale + 40);
    };
    var renderCheckItems = function(state){
    	var html = '<div class="checkbox"><label> <input type="checkbox"> Check me</label></div>';
    	$('#lifecycle-checklistitems').html(html);
    };
    var renderActions = function(state){
    	var html = '<a class="btn btn-default" href="#">Promote</a>'
    	$('#lifecycle-actions').html(html);
    };
    //dagRender();
    //d3Render();
}(LifecycleAPI, $));