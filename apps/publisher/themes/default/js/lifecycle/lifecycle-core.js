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
var LifecycleAPI = {};
var LifecycleUtils = {};
(function() {
    var configMap = {};
    var eventMap = {};
    var dataMap = {};
    var lifecycleImpl = {};
    var processCheckItems = function(stateDetails, datamodel) {
        if (!stateDetails.hasOwnProperty('datamodel')) {
            stateDetails.datamodel = {};
        }
        stateDetails.datamodel.checkItems = datamodel.item;
    }
    var processDataModel = function(stateDetails, datamodel) {
        switch (datamodel.name) {
            case 'checkItems':
                processCheckItems(stateDetails, datamodel);
                break;
            default:
                break;
        }
    };
    /**
     * Converts the JSON definition returned by the lifecycles API
     * into a well structured JSOn object
     * @param  {[type]} data [description]
     * @return {[type]}      [description]
     */
    LifecycleUtils.buildStateMapFromDefinition = function(data) {
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
            stateDetails.datamodel = stateDetails.datamodel ? stateDetails.datamodel : [];
            datamodels = stateDetails.datamodel.data || [];
            //Convert the target states to lower case
            for (var index = 0; index < state.transitions.length; index++) {
                transition = state.transitions[index];
                transition.target = transition.target.toLowerCase();
            }
            //Process the data model
            for (var dIndex = 0; dIndex < datamodels.length; dIndex++) {
                datamodel = datamodels[dIndex];
                processDataModel(state, datamodel);
            }
            nodeCount++;
        }
        return stateMap;
    };
    /**
     * Returns meta information on the current asset
     * @return {[type]} [description]
     */
    LifecycleUtils.currentAsset = function() {
        return store.publisher.lifecycle;
    };
    LifecycleAPI.configs = function() {
        if ((arguments.length == 1) && (typeof arguments[0] == 'object')) {
            configMap = arguments[0]
        } else if ((arguments.length = 1) && (typeof arguments[0] == 'string')) {
            return configMap[arguments[0]];
        } else {
            return configMap;
        }
    };
    var constants = LifecycleAPI.constants = {}; //Sgort hand reference
    constants.API_ENDPOINT = 'lifecycle-api';
    constants.API_LC_DEFINITION = 'lifecycle-definition-api';
    constants.UI_LIFECYCLE_SELECT_ID = '#lifecycle-selector';
    constants.CONTAINER_SVG = 'svgContainer';
    constants.CONTAINER_GRAPH = 'graphContainer';
    constants.EVENT_LC_LOAD = 'event.lc.loaded';
    constants.CONTAINER_RENDERING_AREA = 'lifecycleRenderingArea';
    constants.EVENT_LC_UNLOAD = 'event.lc.unload';
    var triggerEvent = function(eventName, eventCb) {
        if (eventMap.hasOwnProperty(eventName)) {
            eventCb = eventCb || {};
            eventCallbacks = eventMap[eventName];
            console.log('emiting event::' + eventName);
            for (var index = 0; index < eventCallbacks.length; index++) {
                eventCallbacks[index](eventCb);
            }
        } else {
            console.log('no event listeners for event :: ' + eventName);
        }
    };
    LifecycleAPI.event = function() {
        var eventName = arguments[0];
        var eventCb = arguments[1];
        var eventCallbacks;
        if (arguments.length === 1) {
            triggerEvent(eventName, eventCb);
        } else if ((arguments.length === 2) && (typeof eventCb === 'object')) {
            triggerEvent(eventName, eventCb);
        } else if ((arguments.length === 2) && (typeof eventCb === 'function')) {
            if (!eventMap.hasOwnProperty(eventName)) {
                eventMap[eventName] = [];
            }
            eventMap[eventName].push(eventCb);
        }
    };
    LifecycleAPI.data = function() {
        var dataKey = arguments[0];
        var data = arguments[1];
        if (arguments.length == 1) {
            return dataMap[dataKey];
        } else if (arguments.length == 2) {
            dataMap[dataKey] = data;
        }
    };
    LifecycleAPI.lifecycle = function() {
        var name = arguments[0];
        var impl = arguments[1];
        if ((arguments.length === 1) && (typeof name === 'string')) {
            var impl = LifecycleAPI.data(name);
            if (!impl) {
                impl = new LifecycleImpl({
                    name: name
                });
                LifecycleAPI.data(name, impl);
            }
            return impl;
        } else if ((arguments.length === 2) && (typeof impl === 'object')) {
            //Allow method overiding
        } else {
            throw 'Invalid lifecycle name provided';
        }
    };

    function LifecycleImpl(options) {
        options = options || {};
        this.lifecycleName = options.name ? options.name : null;
        this.currentState = null;
        this.rawAPIDefinition = null;
        this.stateMap = null;
        this.dagreD3GraphObject = null;
        this.renderingSite;
    }
    LifecycleImpl.prototype.load = function() {
        var promise;
        if (!this.rawAPIDefinition) {
            var that = this;
            //Fetch the lifecycle definition
            promise = $.ajax({
                url: this.queryDefinition(),
                success: function(data) {
                    that.rawAPIDefinition = data;
                    that.processDefinition();
                    that.currentState = that.stateMap.initialState;
                    //Obtain the asset current state from the code block,if not set it to the initial state
                    LifecycleAPI.event(constants.EVENT_LC_LOAD, {
                        lifecycle: that.lifecycleName
                    });
                },
                error: function() {
                    alert('Failed to load definition');
                }
            });
        } else {
            //If the definition is present then the lifecycle has already been loaded
            LifecycleAPI.event(constants.EVENT_LC_LOAD, {
                lifecycle: this.lifecycleName
            });
        }
    };
    LifecycleAPI.unloadActiveLifecycle = function(){
        LifecycleAPI.event(constants.EVENT_LC_UNLOAD);
    };
    LifecycleImpl.prototype.resolveRenderingSite = function() {
        this.renderingSite = {};
        this.renderingSite.svgContainer = LifecycleAPI.configs(constants.CONTAINER_SVG);
        this.renderingSite.graphContainer = LifecycleAPI.configs(constants.CONTAINER_GRAPH);
    };
    LifecycleImpl.prototype.processDefinition = function() {
        this.stateMap = LifecycleUtils.buildStateMapFromDefinition(this.rawAPIDefinition);
    };
    LifecycleImpl.prototype.render = function() {
        this.resolveRenderingSite();
        this.renderInit();
        this.fillGraphData();
        this.style();
        this.renderFinish();
    };
    LifecycleImpl.prototype.renderInit = function() {
        this.dagreD3GraphObject = new dagreD3.graphlib.Graph().setGraph({});
        if (!this.renderingSite) {
            throw 'Unable to render lifecycle as renderingSite details has not been provided';
        }
    };
    LifecycleImpl.prototype.renderFinish = function() {
        var g = this.dagreD3GraphObject;
        var svgContainer = this.renderingSite.svgContainer;
        var graphContainer = this.renderingSite.graphContainer;
        d3.select(svgContainer).append(graphContainer);
        var svg = d3.select(svgContainer),
            inner = svg.select(graphContainer);
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
        svg.attr('height', g.graph().height * initialScale + 40);
    };
    LifecycleImpl.prototype.fillGraphData = function() {
        var state;
        var transition;
        var source;
        var stateMap = this.stateMap;
        var g = this.dagreD3GraphObject;
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
    };
    LifecycleImpl.prototype.style = function() {
        var g = this.dagreD3GraphObject;
        // Set some general styles
        g.nodes().forEach(function(v) {
            var node = g.node(v);
            node.rx = node.ry = 5;
        });
    };
    LifecycleImpl.prototype.queryDefinition = function() {
        var baseURL = LifecycleAPI.configs(constants.API_LC_DEFINITION);
        return caramel.context + baseURL + '/' + this.lifecycleName;
    };
    LifecycleImpl.prototype.queryHistory = function() {};
    LifecycleImpl.prototype.checkItems = function() {
        if (arguments.length === 0) {
            //Return all of the check list items
        }
    };
    LifecycleImpl.prototype.actions = function() {
        //Assume that a state has not been provided
        var currentState = this.currentState;
        if ((arguments.length === 1) && (typeof arguments[0] === 'string')) {
            currentState = arguments[0];
        }
        var state = this.stateMap.states[currentState] || {};
        var transitions = state.transitions || [];
        var actions = [];
        var transition;
        for (var index = 0; index < transitions.length; index++) {
            transition = transitions[index];
            actions.push(transition.event);
        }
        return actions;
    };
    LifecycleImpl.prototype.nextStates = function() {
        //Assume that a state has not been provided
        var currentState = this.currentState;
        if ((arguments.length === 1) && (typeof arguments[0] === 'string')) {
            currentState = arguments[0];
        }
        var state = this.stateMap.states[currentState] || {};
        var transitions = state.transitions || [];
        var transition;
        var states = [];
        for (var index = 0; index < transitions.length; index++) {
            transition = transitions[index];
            states.push(transition.target);
        }
        return states;
    };
    LifecycleImpl.prototype.state = function(name) {
        return this.stateMap.states[name];
    };
    LifecycleImpl.prototype.currentState = function() {};
    LifecycleImpl.prototype.uncheckItems = function() {};
    LifecycleImpl.prototype.changeState = function(nextState) {};
}());