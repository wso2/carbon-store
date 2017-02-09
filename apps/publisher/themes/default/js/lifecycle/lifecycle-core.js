/*
 *  Copyright (c) 2005-2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
    var currentLifecycle;
    var constants = LifecycleAPI.constants = {}; //Sgort hand reference
    constants.API_ENDPOINT = 'lifecycle-api';
    constants.API_LC_DEFINITION = 'lifecycle-definition-api';
    constants.API_BASE = 'apiLCBase';
    constants.API_CHANGE_STATE = 'apiChangeState';
    constants.API_FETCH_STATE = 'apiFetchState';
    constants.API_FETCH_HISTORY = 'apiFetchHistory';
    constants.API_UPDATE_CHECKLIST = 'apiUpdateChecklist';
    constants.API_UPDATE_VOTE = 'apiUpdateVote';
    constants.UI_LIFECYCLE_SELECT_ID = '#lifecycle-selector';
    constants.UI_LIFECYCLE_SELECT_BOX = 'ul.lifecycle-dropdown-menu li a';
    constants.UI_LIFECYCLE_COMMENT_CONTAINER = 'lifecycleCommentContainer';
    constants.CONTAINER_SVG = 'svgContainer';
    constants.CONTAINER_GRAPH = 'graphContainer';
    constants.CONTAINER_LC_ACTION_AREA = 'lifecycleActionArea';
    constants.CONTAINER_RENDERING_AREA = 'lifecycleRenderingArea';
    constants.CONTAINER_CHECKLIST_AREA = 'lifecycleChecklistArea';
    constants.CONTAINER_CHECKLIST_OVERLAY = 'lifecycleChecklistBlock';
    constants.CONTAINER_VOTE_AREA = 'lifecycleVoteArea';
    constants.CONTAINER_VOTE_OVERLAY = 'lifecycleVoteBlock';
    constants.CONTAINER_LC_ACTION_OVERLAY = 'lifecycleActionOverlay';
    constants.CONTAINER_HISTORY_AREA = 'lifecycleHistoryArea';
    constants.CONTAINER_INFORMATION_AREA = 'lifecycleInformationArea';
    constants.CONTAINER_TRANSITION_UI_AREA = 'lifecycleTransitionUIArea';
    constants.CONTAINER_LC_NOTIFICATIONS_AREA = 'lifecycleNotificationsArea';
    constants.CONTAINER_LC_GLOBAL_NOTIFICATIONS_AREA = 'lifecycleGlobalNotificationsArea';
    constants.CONTAINER_LC_TRANSITION_INPUTS_FIELDS_AREA = 'lifecycleTransitionInputsFieldsArea';
    constants.CONTAINER_LC_TRANSITION_INPUTS_ACTIONS_AREA = 'lifecycleTransitionInputsActionsArea';
    constants.CONTAINER_LC_TRANSITION_INPUTS_FIELDS_FORM = 'lifecycleTRansitionInputsFieldsForm';
    constants.CONTAINER_LC_TRANSITION_INPUTS_UI="lifecycleTransitionInputUI";
    constants.CONTAINER_LC_TRANSITION_INPUTS_UI_CANCEL = "lifecycleTransitionInputUICancelBtn";
    constants.CONTAINER_WARN_MESSAGE = 'serverWarningMessage';
    constants.TEMPLATE_NOTIFICATION_ERROR = 'lifecycleTemplateNotficationError';
    constants.TEMPLATE_NOTIFICATION_INFO = 'lifecycleTemplateNotificationInfo';
    constants.TEMPLATE_NOTIFICATION_WARN = 'lifecycleTemplateNotificationWarn';
    constants.TEMPLATE_NOTIFICATION_SUCCESS = 'lifecycleTemplateNotificationSuccess';
    constants.INPUT_TEXTAREA_LC_COMMENT = 'lifecycleCommentTextArea';
    constants.EVENT_LC_LOAD = 'event.lc.loaded';
    constants.EVENT_LC_UNLOAD = 'event.lc.unload';
    constants.EVENT_FETCH_STATE_START = 'event.fetch.state.start';
    constants.EVENT_FETCH_STATE_SUCCESS = 'event.fetch.state.success';
    constants.EVENT_FETCH_STATE_FAILED = 'event.fetch.state.failed';
    constants.EVENT_STATE_CHANGE = 'event.state.change';
    constants.EVENT_ACTION_START = 'event.action.invoked';
    constants.EVENT_ACTION_FAILED = 'event.action.failed';
    constants.EVENT_ACTION_SUCCESS = 'event.action.success';
    constants.EVENT_UPDATE_CHECKLIST_START = 'event.update.checklist.start';
    constants.EVENT_UPDATE_CHECKLIST_SUCCESS = 'event.update.checklist.success';
    constants.EVENT_UPDATE_CHECKLIST_FAILED = 'event.update.checklist.failed';
    constants.EVENT_UPDATE_VOTE_START = 'event.update.vote.start';
    constants.EVENT_UPDATE_VOTE_SUCCESS = 'event.update.vote.success';
    constants.EVENT_UPDATE_VOTE_FAILED = 'event.update.vote.failed';
    constants.EVENT_FETCH_HISTORY_START = 'event.fetch.history.start';
    constants.EVENT_FETCH_HISTORY_SUCCESS = 'event.fetch.history.success';
    constants.EVENT_FETCH_HISTORY_FAILED = 'event.fetch.history.failed';
    constants.HISTORY_ACTION_TRANSITION = 'transition';
    constants.HISTORY_ACTION_CHECKITEM = 'check.item';
    constants.NOTIFICATION_INFO = 'info';
    constants.NOTIFICATION_ERROR = 'error';
    constants.NOTIFICATION_WARN = 'warn';
    constants.NOTIFICATION_SUCCESS = 'success';
    constants.MSG_WARN_CANNOT_CHANGE_STATE = 'msgCannotChangeState';
    constants.MSG_WARN_NO_TRAVERSABLE_STATE = 'msgNoTraversableStates';
    constants.MSG_SUCCESS_STATE_CHANGE = 'msgStateChangedSuccess';
    constants.MSG_ERROR_STATE_CHANGE = 'msgStateChangeError';
    constants.MSG_SUCCESS_CHECKLIST_UPDATE = 'msgChecklistUpdateSuccess';
    constants.MSG_ERROR_CHECKLIST_UPDATE = 'msgChecklistUpdateError';
    constants.MSG_SUCCESS_VOTE_UPDATE = 'msgVoteUpdateSuccess';
    constants.MSG_ERROR_VOTE_UPDATE = 'msgVoteUpdateError';
    constants.MSG_ERROR_LC_DETACH = 'msgDetachLcError';
    constants.MSG_ERROR_LC_ATTACH = 'msgAttachLcError';
    constants.CONTAINER_DELETE_ACTION_AREA = 'deleteActionArea';
    constants.LIFECYCLE_HISTORY_LOADMORE_BUTTON = "#load-more-btn";
    constants.LIFECYCLE_HISTORY_PAGING_SIZE = 8;
    var id = function(name) {
        return '#' + name;
    };
    var config = function(key) {
        return LifecycleAPI.configs(key);
    };
    var partial = function(name) {
        return '/themes/' + caramel.themer + '/partials/' + name + '.hbs';
    };
    var renderPartial = function(partialKey, containerKey, data, fn) {
        fn = fn || function() {};
        var partialName = config(partialKey);
        var containerName = config(containerKey);
        if (!partialName) {
            throw 'A template name has not been specified for template key ' + partialKey;
        }
        if (!containerName) {
            throw 'A container name has not been specified for container key ' + containerKey;
        }
        var obj = {};
        obj[partialName] = partial(partialName);
        caramel.partials(obj, function() {
            var template = Handlebars.partials[partialName](data);
            $(id(containerName)).html(template);
            fn(containerName);
        });
    };
    var processCheckItems = function(stateDetails, datamodel) {
        if (!stateDetails.hasOwnProperty('datamodel')) {
            stateDetails.datamodel = {};
        }
        stateDetails.datamodel.checkItems = datamodel.item;
        for (var index = 0; index < datamodel.item.length; index++) {
            datamodel.item[index].checked = false;
            datamodel.item[index].index = index;
        }
    };
    var processTransitionUI = function(stateDetails, datamodel) {
        if (!stateDetails.hasOwnProperty('datamodel')) {
            stateDetails.datamodel = {};
        }
        var ui = datamodel.ui || [];
        var transitions;
        stateDetails.datamodel.transitionUIs = [];
        if (ui.length >= 0) {
            stateDetails.datamodel.transitionUIs = ui;
        }
        transitions = stateDetails.datamodel.transitionUIs;
        for (var index = 0; index < transitions.length; index++) {
            transition = transitions[index];
            transition.action = transition.forEvent;
            delete transition.forEvent;
        }
    };
    var processTransitionInputs = function(stateDetails, datamodel) {
        if (!stateDetails.hasOwnProperty('datamodel')) {
            stateDetails.datamodel = {};
        }
        var transitions;
        var transition;
        var entry;
        var executions;
        var execution;
        var form;
        var forms;
        var map;
        forms = stateDetails.datamodel.transitionInputs = {};
        executions = datamodel.execution || [];
        for (var index = 0; index < executions.length; index++) {
            execution = executions[index];
            if (execution.transitionInputs) {
                form = execution.transitionInputs[0];
                map = forms[execution.forEvent.toLowerCase()] = {};
                map.action = execution.forEvent;
                map.inputs = form.input;
            }
        }
    };
    var processInput = function(stateDetails,datamodel){
        debugger;
        var inputs =  datamodel.inputs || [];
        var input;
        var mapping = {};
        var forEvent;
        stateDetails.transitionInputs = [];
        for(var index = 0 ; index < inputs.length; index++ ){
            input = inputs[index];
            mapping = {};
            forEvent = input.forEvent || '';
            mapping.forAction = forEvent.toLowerCase();
            mapping.inputs = input.input;
            stateDetails.transitionInputs.push(mapping);
        }
    }
    var processDataModel = function(stateDetails, datamodel) {
        switch (datamodel.name) {
            case 'checkItems':
                processCheckItems(stateDetails, datamodel);
                break;
            case 'transitionUI':
                processTransitionUI(stateDetails, datamodel);
                break;
            case 'transitionExecution':
                processTransitionInputs(stateDetails, datamodel);
                break;
            case 'transitionInput':
                processInput(stateDetails,datamodel);
                break;
            default:
                break;
        }
    };
    var triggerEvent = function(eventName, eventCb) {
        if (eventMap.hasOwnProperty(eventName)) {
            eventCb = eventCb || {};
            eventCallbacks = eventMap[eventName];
            //console.log('emiting event::' + eventName + ' [active lifecycle: ' + LifecycleAPI.currentLifecycle() + ' ]');
            for (var index = 0; index < eventCallbacks.length; index++) {
                eventCallbacks[index](eventCb);
            }
        } else {
            //console.log('no event listeners for event :: ' + eventName);
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
    LifecycleUtils.config = function(key) {
        return LifecycleAPI.configs(key);
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
        if (arguments.length == 0) {
            var currentLC = LifecycleAPI.currentLifecycle();
            return LifecycleAPI.lifecycle(currentLC);
        } else if ((arguments.length === 1) && (typeof name === 'string')) {
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
    LifecycleAPI.currentLifecycle = function() {
        if (arguments.length === 1) {
            currentLifecycle = arguments[0];
        } else {
            return currentLifecycle;
        }
    };
    LifecycleAPI.notify = function(msg, options) {
        options = options || {};
        var global = options.global ? options.global : false;
        var container = constants.CONTAINER_LC_NOTIFICATIONS_AREA;
        var notificationType = options.type ? options.type : constants.NOTIFICATION_INFO;
        var partial = constants.TEMPLATE_NOTIFICATION_INFO;
        if (global) {
            container = constants.CONTAINER_LC_GLOBAL_NOTIFICATIONS_AREA;
        }
        switch (notificationType) {
            case constants.NOTIFICATION_WARN:
                messages.alertWarn(msg);
                break;
            case constants.NOTIFICATION_ERROR:
                messages.alertError(msg);
                break;
            case constants.NOTIFICATION_SUCCESS:
                messages.alertSuccess(msg);
            default:
                break;
        }
    };

    function LifecycleImpl(options) {
        options = options || {};
        this.lifecycleName = options.name ? options.name : null;
        this.currentState = null;
        this.previousState = null;
        this.rawAPIDefinition = null;
        this.stateMap = null;
        this.dagreD3GraphObject = null;
        this.renderingSite;
        this.history = [];
        this.currentLCStateDuration;
        this.currentLCStateDurationColour;
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
                    LifecycleAPI.currentLifecycle(that.lifecycleName);
                    //Obtain the asset current state from the code block,if not set it to the initial state
                    LifecycleAPI.event(constants.EVENT_LC_LOAD, {
                        lifecycle: that.lifecycleName
                    });
                    that.fetchState();
                },
                error: function() {
                    alert('Failed to load definition');
                }
            });
        } else {
            LifecycleAPI.currentLifecycle(this.lifecycleName);
            //If the definition is present then the lifecycle has already been loaded
            LifecycleAPI.event(constants.EVENT_LC_LOAD, {
                lifecycle: this.lifecycleName
            });
            this.fetchState();
        }
    };
    LifecycleAPI.unloadActiveLifecycle = function() {
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
        var initialScale = 1.2;
        zoom.translate([($(svgContainer).width() - g.graph().width * initialScale) / 2, 20]).scale(initialScale).event(svg);
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
                label: state.id.toUpperCase(),
                shape: 'rect',
                labelStyle: 'font-size: 12px;font-weight: lighter;fill: rgb(51, 51, 51);'
            });
        }
        //Add the edges
        for (key in stateMap.states) {
            state = stateMap.states[key];
            source = key;
            for (var index = 0; index < state.transitions.length; index++) {
                transition = state.transitions[index];
                g.setEdge(source, transition.target, {
                    label: transition.event.toUpperCase(),
                    lineInterpolate: 'basis',
                    labelStyle: 'font-size: 12px;font-weight: lighter;fill: rgb(255, 255, 255);'
                });
            }
        }
    };
    LifecycleImpl.prototype.style = function() {
        var g = this.dagreD3GraphObject;
        // Set some general styles
        g.nodes().forEach(function(v) {
            var node = g.node(v);
            node.rx = node.ry = 0;
        });
    };
    LifecycleImpl.prototype.queryDefinition = function() {
        var baseURL = LifecycleAPI.configs(constants.API_LC_DEFINITION);
        return caramel.context + baseURL + '/' + this.lifecycleName;
    };
    LifecycleImpl.prototype.urlChangeState = function(data) {
        var apiBase = LifecycleUtils.config(constants.API_BASE);
        var apiChangeState = LifecycleUtils.config(constants.API_CHANGE_STATE);
        var asset = LifecycleUtils.currentAsset();
        if ((!asset) || (!asset.id)) {
            throw 'Unable to locate details about asset';
        }
        return caramel.url(apiBase + '/' + asset.id + apiChangeState + '?type=' + asset.type + '&lifecycle=' + this.lifecycleName + '&nextAction=' + data.nextAction);
    };
    LifecycleImpl.prototype.urlFetchState = function() {
        var apiBase = LifecycleUtils.config(constants.API_BASE);
        var apiChangeState = LifecycleUtils.config(constants.API_FETCH_STATE);
        var asset = LifecycleUtils.currentAsset();
        if ((!asset) || (!asset.id)) {
            throw 'Unable to locate details about asset';
        }
        return caramel.url(apiBase + '/' + asset.id + apiChangeState + '?type=' + asset.type + '&lifecycle=' + this.lifecycleName);
    };
    LifecycleImpl.prototype.urlUpdateChecklist = function() {
        var apiBase = LifecycleUtils.config(constants.API_BASE);
        var apiUpdateChecklist = LifecycleUtils.config(constants.API_UPDATE_CHECKLIST);
        var asset = LifecycleUtils.currentAsset();
        if ((!asset) || (!asset.id)) {
            throw 'Unable to locate details about asset';
        }
        return caramel.url(apiBase + '/' + asset.id + apiUpdateChecklist + '?type=' + asset.type + '&lifecycle=' + this.lifecycleName);
    };
    LifecycleImpl.prototype.urlUpdateVote = function() {
        var apiBase = LifecycleUtils.config(constants.API_BASE);
        var apiUpdateVote = LifecycleUtils.config(constants.API_UPDATE_VOTE);
        var asset = LifecycleUtils.currentAsset();
        if ((!asset) || (!asset.id)) {
            throw 'Unable to locate details about asset';
        }
        return caramel.url(apiBase + '/' + asset.id + apiUpdateVote + '?type=' + asset.type + '&lifecycle=' + this.lifecycleName);
    };
    LifecycleImpl.prototype.urlFetchHistory = function() {
        var apiBase = LifecycleUtils.config(constants.API_BASE);
        var apiFetchHistory = LifecycleUtils.config(constants.API_FETCH_HISTORY);
        var asset = LifecycleUtils.currentAsset();
        if ((!asset) || (!asset.id)) {
            throw 'Unable to locate details about asset';
        }
        return caramel.url(apiBase + '/' + asset.id + apiFetchHistory + '?type=' + asset.type + '&lifecycle=' + this.lifecycleName);
    };
    LifecycleImpl.prototype.checklist = function() {
        var state = this.state(this.currentState);
        var datamodel;
        if (arguments.length === 1) {
            //console.log('changing checklist state');
            datamodel = (state.datamodel) ? state.datamodel : (state.datamodel = {});
            datamodel.checkItems = arguments[0];
        } else {
            datamodel = state.datamodel || {};
            return datamodel.checkItems ? datamodel.checkItems : [];
        }
    };
    LifecycleImpl.prototype.getCurrentLCStateDuration = function () {
        return this.currentLCStateDuration;
    };
    LifecycleImpl.prototype.getCurrentLCStateDurationColour = function () {
        return this.currentLCStateDurationColour;
    };
    /**
     * This method returns the available actions of a given lifecycle state
     * if required state is not provided it is assumed to be current state
     * Note : as this method only returns pre-set allowed actions for the current state,
     * allowed actions should be set calling setAllowedActions(actions)
     */
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
            if (currentState == this.currentState) {
                if (state.allowedActions && state.allowedActions[transition.event]){
                    actions.push(transition.event);
                }
            }
            else {
                    actions.push(transition.event);
            }
        }
        return actions;
    };
    LifecycleImpl.prototype.setAllowedActions = function(actions) {
        var currentState = this.currentState;
        var state = this.stateMap.states[currentState] || {};

        state.allowedActions = actions;

        return state.allowedActions;
    };

    LifecycleImpl.prototype.setVoteActions = function(actions) {
        var currentState = this.currentState;
        var state = this.stateMap.states[currentState] || {};
        var datamodel;
        if (actions) {
            //console.log('changing vote state');
            datamodel = (state.datamodel) ? state.datamodel : (state.datamodel = {});
            datamodel.voteActions = actions;
            state.voteActions = actions;
            return state.voteActions;
            
        } else {
            datamodel = state.datamodel || {};
            return datamodel.voteActions ? datamodel.voteActions : [];
        }
    };
    LifecycleImpl.prototype.nextStateByAction = function(action, state) {
        //Get tinformation about the state
        var stateDetails = this.state(state);
        var transitions = stateDetails.transitions || [];
        var transition;
        var nextState;
        for (var index = 0; index < transitions.length; index++) {
            transition = transitions[index];
            if (transition.event.toLowerCase() === action.toLowerCase()) {
                nextState = transition.target;
                return nextState;
            }
        }
        return nextState;
    };
    LifecycleImpl.prototype.invokeAction = function() {
        var action = arguments[0];
        var comment = arguments[1];
        var optionalArguments = arguments[2];
        var nextState;
        var data = {};
        if (!action) {
            throw 'Attempt to invoke an action without providing the action';
            return;
        }
        nextState = this.nextStateByAction(action, this.currentState);
        if (!nextState) {
            throw 'Unable to locate the next state for the given action::' + action;
        }
        data.nextState = nextState;
        //Check if the action is one of the available actions for the current state
        var availableActions = this.actions(this.currentState);
        if ((availableActions.indexOf(action, 0) <= -1)) {
            throw 'Attempt to invoke an action (' + action + ') which is not available for the current state : ' + this.currentState;
        }
        if (comment) {
            data.comment = comment;
        }
        if (optionalArguments) {
            data.arguments = optionalArguments;
        }
        if (arguments[0]){
            data.nextAction = arguments[0];
        }
        //Determine the next state
        LifecycleAPI.event(constants.EVENT_ACTION_START);
        var that = this;
        $.ajax({
            url: this.urlChangeState(data),
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function(data) {
                that.previousState = that.currentState;
                that.currentState = data.data.newState;
                var traversableStates = data.data.traversableStates || [];
                //If next states are not returned then lifecycle
                //actions are not permitted
                if (traversableStates.length === 0) {
                    that.isLCActionsPermitted = false;
                }
                LifecycleAPI.event(constants.EVENT_ACTION_SUCCESS);
                LifecycleAPI.event(constants.EVENT_STATE_CHANGE);
                that.fetchState();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                LifecycleAPI.event(constants.EVENT_ACTION_FAILED, jqXHR.responseJSON);
            }
        });
    };
    LifecycleImpl.prototype.updateChecklist = function(checklistItemIndex, checked) {
        var data = {};
        var entry = {};
        entry.index = checklistItemIndex;
        entry.checked = checked;
        data.checklist = [];
        data.checklist.push(entry);
        LifecycleAPI.event(constants.EVENT_UPDATE_CHECKLIST_START);
        var that = this;
        $.ajax({
            type: 'POST',
            url: this.urlUpdateChecklist(),
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function() {
                //Update the internal check list items
                LifecycleAPI.event(constants.EVENT_UPDATE_CHECKLIST_SUCCESS);
                that.fetchState();
            },
            error: function() {
                LifecycleAPI.event(constants.EVENT_UPDATE_CHECKLIST_FAILED);
            }
        });
    };

    LifecycleImpl.prototype.updateVote = function(voteIndex, checked) {
        var data = {};
        var entry = {};
        entry.index = voteIndex;
        entry.checked = checked;
        data.votes = [];
        data.votes.push(entry);
        LifecycleAPI.event(constants.EVENT_UPDATE_VOTE_START);
        var that = this;
        $.ajax({
                   type: 'POST',
                   url: this.urlUpdateVote(),
                   data: JSON.stringify(data),
                   contentType: 'application/json',
                   success: function() {
                       //Update the internal vote items
                       LifecycleAPI.event(constants.EVENT_UPDATE_VOTE_SUCCESS);
                       that.fetchState();
                   },
                   error: function() {
                       LifecycleAPI.event(constants.EVENT_UPDATE_VOTE_FAILED);
                   }
               });
    };
    LifecycleImpl.prototype.fetchState = function() {
        LifecycleAPI.event(constants.EVENT_FETCH_STATE_START);
        var that = this;
        $.ajax({
            url: this.urlFetchState(),
            success: function(data) {
                var data = data.data;
                that.previousState = that.currentState;
                if (!data.id) {
                    LifecycleAPI.event(constants.EVENT_FETCH_STATE_FAILED);
                    return;
                }
                that.currentState = data.id.toLowerCase();
                that.isLCActionsPermitted = data.isLCActionsPermitted;
                that.isDeletable = data.isDeletable;
                for (var index = 0; index < data.checkItems.length; index++) {
                    data.checkItems[index].index = index;
                }
                that.checklist(data.checkItems);
                that.setAllowedActions(data.approvedActions);
                that.setVoteActions(data.lifecycleVote);
                that.currentLCStateDurationColour = data.currentLCStateDurationColour;
                that.currentLCStateDuration = data.currentLCStateDuration;
                LifecycleAPI.event(constants.EVENT_FETCH_STATE_SUCCESS);
            },
            error: function() {
                LifecycleAPI.event(constants.EVENT_FETCH_STATE_FAILED);
            }
        })
    };
    LifecycleImpl.prototype.userPermited = function() {
        return this.isLCActionsPermitted;
    };
    LifecycleImpl.prototype.processHistory = function(data) {
        //console.log('### Processing history ###');
        var entry;
        var historyEntry;
        this.history = [];
        for (var index = 0; index < data.length; index++) {
            entry = data[index];
            historyEntry = {};
            historyEntry.aspect = entry.aspect;
            historyEntry.state = entry.state;
            historyEntry.timestamp = entry.timestamp;
            historyEntry.user = entry.user;
            historyEntry.actionType = constants.HISTORY_ACTION_CHECKITEM;
            historyEntry.comment = entry.comment;
            historyEntry.hasComment = false;
            if (historyEntry.comment) {
                historyEntry.hasComment = true;
            }
            historyEntry.dateOfTransition = entry.dateofTransition;
            //Check if it is a state change
            if (entry.targetState) {
                historyEntry.targetState = entry.targetState;
                historyEntry.actionType = constants.HISTORY_ACTION_TRANSITION;
            }
            this.history.push(historyEntry);
        }
    };
    LifecycleImpl.prototype.fetchHistory = function() {
        LifecycleAPI.event(constants.EVENT_FETCH_HISTORY_START);
        var that = this;
        $.ajax({
            url: this.urlFetchHistory(),
            success: function(data) {
                var data = data.data || [];
                // that.history = []; //Reset the history
                // for (var index = 0; index < data.length; index++) {
                //     that.history.push(data[index]);
                // }
                that.processHistory(data);
                LifecycleAPI.event(constants.EVENT_FETCH_HISTORY_SUCCESS);
            },
            error: function() {
                LifecycleAPI.event(constants.EVENT_FETCH_HISTORY_FAILED);
            }
        })
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
    LifecycleImpl.prototype.stateNode = function(name) {
        return this.dagreD3GraphObject.node(name);
    };
    LifecycleImpl.prototype.changeState = function(nextState) {
        this.currentState = nextState;
        LifecycleAPI.event(constants.EVENT_STATE_CHANGE);
    };
    LifecycleImpl.prototype.transitionUIs = function() {
        var state = this.currentState;
        var action;
        var stateDetails;
        var transition;
        var transitionMappedToAction;
        var transitionUI;
        if (arguments.length === 1) {
            state = arguments[0];
        }
        if (arguments.length === 2) {
            action = arguments[1];
        }
        stateDetails = this.state(state) || {};
        transitionUIs = (stateDetails.datamodel) ? stateDetails.datamodel.transitionUIs : [];
        if (!action) {
            return transitionUIs;
        }
        if (!transitionUIs) {
            return [];
        }
        //Find the transition UI for the provided action
        for (var index = 0; index < transitionUIs.length; index++) {
            transition = transitionUIs[index];
            if (transition.action.toLowerCase() === action.toLowerCase()) {
                transitionMappedToAction = transition;
            }
        }
        return transitionMappedToAction;
    };
    LifecycleImpl.prototype.transitionInputs = function(action) {
        var currentState = this.currentState;
        var state = this.state(currentState);
        var transitionInputs = state.transitionInputs || {};
        var targetAction = action.toLowerCase();
        var transitionInput;
        debugger;
        for(var index = 0; index < transitionInputs.length; index++){
            transitionInput = transitionInputs[index];
            if(transitionInput.forAction === targetAction){
                return  transitionInput;
            }
        }
        return {};
    };
    LifecycleImpl.prototype.highlightCurrentState = function() {
        var currentStateNode = this.stateNode(this.currentState);
        var previousStateNode;
        selectNode(currentStateNode.elem);
        if ((this.previousState) && (this.previousState !== this.currentState)) {
            previousStateNode = this.stateNode(this.previousState);
            unselectNode(previousStateNode.elem);
        }
    };
    var selectNode = function(elem) {
        var rect = $(elem).find('rect');
        rect.css('fill', '#3a9ecf');
        rect.css('stroke', '#3a9ecf');
    };
    var unselectNode = function(elem) {
        var rect = $(elem).find('rect');
        rect.css('fill', '#f9f9f9');
        rect.css('stroke', '#f9f9f9');
    };
}());
