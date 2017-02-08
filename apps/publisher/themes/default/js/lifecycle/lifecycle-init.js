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
$(function() {
    'use strict';
    $.ajaxSetup ({
        // Disable caching of AJAX responses STORE-711/STORE-712
        cache: false
    });
    var constants = LifecycleAPI.constants;
    var historyStart =0;
    var historyEnd = constants.LIFECYCLE_HISTORY_PAGING_SIZE;
    var id = function(name) {
        return '#' + name;
    };
    var config = function(key) {
        return LifecycleAPI.configs(key);
    };
    var partial = function(name) {
        return '/themes/' + caramel.themer + '/partials/' + name + '.hbs';
    };
    var spinnerURL = function() {
        return caramel.url('/themes/default/img/preloader-40x40.gif');
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

    var appendPartial = function(partialKey, containerKey, data, fn) {
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
            $(id(containerName)).append(template);
            fn(containerName);
        });
    };
    var wireLCActionHandlers = function(container) {
        $(id(container)).children('a').each(function() {
            $(this).on('click', function(e) {
                var action;
                e.preventDefault();
                action = $(this).data('action');
                if(renderTransitionInputs(action)){
                    //console.log('Deferred executing action till transition inputs are provided');
                    return;
                }
                //Get the comment
                var commentContainer = config(constants.INPUT_TEXTAREA_LC_COMMENT);
                var comment = $(id(commentContainer)).val() || null;
                LifecycleAPI.lifecycle().invokeAction(action, comment);
            });
        });
    };
    var obtainTransitionInputs = function(){
        var container = id(config(constants.CONTAINER_LC_TRANSITION_INPUTS_FIELDS_FORM));
        var query =container+' :input';
        var fields = $(query)||[];
        var data = {};
        var name;
        var value;
        var field;
        for(var index = 0; index< fields.length; index++){
            field = fields[index];
            name = $(field).attr('name');
            value = $(field).val();
            data[name] = value;
        }
        return data;
    };
    var hideTransitionInputsUI = function(){
        $(id(config(constants.CONTAINER_LC_TRANSITION_INPUTS_UI))).hide();
        //Show the lifecycle actions
        $(id(config(constants.CONTAINER_LC_ACTION_AREA))).show();
    };

    var wireTransitionInputCancelBtn = function(){
        $(id(config(constants.CONTAINER_LC_TRANSITION_INPUTS_UI_CANCEL))).on('click',function(e){
            e.preventDefault();
            hideTransitionInputsUI();
        });
    };

    var wireTransitionInputActions = function(container) {
        $(id(container)).children('a').each(function() {
            $(this).on('click', function(e) {
                e.preventDefault();
                var action = $(this).data('action');
                action = action || '';
                var inputs = {};
                var commentContainer = config(constants.INPUT_TEXTAREA_LC_COMMENT);
                var comment = $(id(commentContainer)).val() || null;
                //Obtain the inputs from the transition input form
                inputs = obtainTransitionInputs();
                if(validator.isValidForm(config(constants.CONTAINER_LC_TRANSITION_INPUTS_FIELDS_FORM))){
                    //throw 'Stop';
                    LifecycleAPI.lifecycle().invokeAction(action, comment,inputs);
                }

            });
        });
    };
    var wireChecklistHandlers = function(container) {
        $(id(container)).find('input:checkbox').each(function() {
            $(this).on('click', function(e) {
                var index = $(this).data('index');
                var state = $(this).is(':checked');
                LifecycleAPI.lifecycle().updateChecklist(index, state);
            });
        });
    };
    var wireVoteHandlers = function(container) {
        $(id(container)).find('input:checkbox').each(function() {
            $(this).on('click', function(e) {
                var index = $(this).data('index');
                var state = $(this).is(':checked');
                LifecycleAPI.lifecycle().updateVote(index, state);
            });
        });
    };
    var renderTransitionInputs = function(action) {
        var impl = LifecycleAPI.lifecycle();
        if (!impl) {
            throw 'Unable to obtain a reference to the current lifecycle';
        }
        //Check if the lifecycle has transition inputs for the action
        var transitionInputMap = impl.transitionInputs(action);
        //If there are no inputs do nothing
        if ((!transitionInputMap.hasOwnProperty('inputs'))||(transitionInputMap.inputs.length<=0)) {
            return false;
        }
        var actionData = {};
        actionData.label = action;
        actionData.action = action;
        actionData.style = 'btn-default';
        var inputs = transitionInputMap.inputs;
        //Hide the lifecycle actions
        $(id(config(constants.CONTAINER_LC_ACTION_AREA))).hide();
        //Render the inputs
        renderPartial(constants.CONTAINER_LC_TRANSITION_INPUTS_FIELDS_AREA, constants.CONTAINER_LC_TRANSITION_INPUTS_FIELDS_AREA, inputs,wireTransitionInputCancelBtn);
        //Render the actions
        renderPartial(constants.CONTAINER_LC_TRANSITION_INPUTS_ACTIONS_AREA,constants.CONTAINER_LC_TRANSITION_INPUTS_ACTIONS_AREA,actionData,wireTransitionInputActions);

        $(id(config(constants.CONTAINER_LC_TRANSITION_INPUTS_UI))).show();
        return true;
    };
    var renderStateInformation = function() {
        var container = config(constants.CONTAINER_INFORMATION_AREA);
        var impl = LifecycleAPI.lifecycle();
        var data = {};
        if (impl) {
            data.currentLifecycle = LifecycleAPI.currentLifecycle();
            data.currentState = impl.state(impl.currentState).label;
            data.hasMultipleLifecycles = LifecycleUtils.currentAsset().hasMultipleLifecycles;
            data.currentLCStateDuration = impl.getCurrentLCStateDuration();
            data.currentLCStateDurationColour = impl.getCurrentLCStateDurationColour();
            renderPartial(constants.CONTAINER_INFORMATION_AREA, constants.CONTAINER_INFORMATION_AREA, data);
        }
        $("#current-selected-lifecycle span:first-child").text(data.currentLifecycle);
    };
    var renderHistory = function() {
        var container = config(constants.CONTAINER_HISTORY_AREA);
        var impl = LifecycleAPI.lifecycle();
        var data = {};
        var history;
        var modifiedHistory;
        if (impl) {
            history = historyList(impl.history);
            data.history = history.slice(historyStart, historyEnd);
            data.history.isStateChangedOnce = isStateChangedOnce(data.history);

            renderPartial(constants.CONTAINER_HISTORY_AREA, constants.CONTAINER_HISTORY_AREA, data);
            incrementHistoryRenderParams(historyStart, historyEnd, history.length);
        }
    };

    var appendHistory = function(start, end) {
        var impl = LifecycleAPI.lifecycle();
        var data = {};
        var history;
        if (impl) {
            history = historyList(impl.history);
            data.history = history.slice(start, end);
            data.history.isStateChangedOnce = isStateChangedOnce(data.history);

            appendPartial(constants.CONTAINER_HISTORY_AREA, constants.CONTAINER_HISTORY_AREA, data);
            incrementHistoryRenderParams(start, end, history.length);
        }
    };

    var historyList = function (history) {
        var historyList = [];
        var count = 0;
        for (var i = 0; i < history.length; i++) {
            if (history[i].targetState != undefined) {
                historyList[count] = history[i];
                count++;
            }
        }
        return historyList;
    };

    var isStateChangedOnce = function (history) {
        var isStateChangedOnce = false;
        for (var i = 0; i < history.length; i++) {
            if (history[i].targetState != undefined) {
                return true;
            }
        }
        return isStateChangedOnce;
    };

    var incrementHistoryRenderParams = function(start, end, historyLength){
        historyStart = start + constants.LIFECYCLE_HISTORY_PAGING_SIZE;
        historyEnd = end + constants.LIFECYCLE_HISTORY_PAGING_SIZE;
        if(historyStart >= historyLength){
            $(constants.LIFECYCLE_HISTORY_LOADMORE_BUTTON).hide();
        }
        if(historyStart < historyLength){
            $(constants.LIFECYCLE_HISTORY_LOADMORE_BUTTON).show();
        }

    };

    var clearHistoryRenderParams = function(){
        historyStart = 0;
        historyEnd = constants.LIFECYCLE_HISTORY_PAGING_SIZE;
    };
    var hideCommentInputArea = function(){
        var container = config(constants.UI_LIFECYCLE_COMMENT_CONTAINER);
        $(id(container)).hide();
    };
    var showCommentInputArea = function(){
        var container = config(constants.UI_LIFECYCLE_COMMENT_CONTAINER);
        $(id(container)).show();
    };

    var renderServerWarning = function(message){
        renderPartial(constants.CONTAINER_WARN_MESSAGE,constants.CONTAINER_LC_GLOBAL_NOTIFICATIONS_AREA,message);
    };

    var renderLCActions = function() {
        var container = config(constants.CONTAINER_LC_ACTION_AREA);
        var impl = LifecycleAPI.lifecycle();
        var actions;
        var action;
        //      var action;
        if (impl) {
            actions = impl.actions();
            var data = {};
            var map = data.actions = [];
            var mapping;
            for (var index = 0; index < actions.length; index++) {
                action = actions[index];
                mapping = {};
                mapping.label = action;
                mapping.style = 'btn-default';
                map.push(mapping);
            }
            if(actions.length > 0){
                showCommentInputArea();
            }
            renderPartial(constants.CONTAINER_LC_ACTION_AREA, constants.CONTAINER_LC_ACTION_AREA, data, wireLCActionHandlers);
        }
    };
    var renderDeleteActions = function () {
        var container = config(constants.CONTAINER_DELETE_ACTION_AREA);
        var impl = LifecycleAPI.lifecycle();
        if (impl) {
            if (impl.isDeletable) {
                $(id(container)).removeClass('not-active').removeAttr("title").unbind('click');
                return;
            }
            $(id(container)).attr("title", "Asset is not in a deletable State!");
        }
    };
    var unrenderLCActions = function() {
        var container = config(constants.CONTAINER_LC_ACTION_AREA);
        $(id(container)).html('');
    };
    var renderChecklistItems = function() {
        var container = config(constants.CONTAINER_CHECKLIST_AREA);
        var impl = LifecycleAPI.lifecycle();
        if (impl) {
            var data = {};
            data.checklist = impl.checklist();
            renderPartial(constants.CONTAINER_CHECKLIST_AREA, constants.CONTAINER_CHECKLIST_AREA, data, wireChecklistHandlers);
        }
    };
    var unrenderChecklistItems = function() {
        var container = config(constants.CONTAINER_CHECKLIST_AREA);
        $(id(container)).html('');
    };

    var renderVoteItems = function() {
        var container = config(constants.CONTAINER_VOTE_AREA);
        var impl = LifecycleAPI.lifecycle();
        if (impl) {
            var data = {};
            data.voteItems = impl.setVoteActions();
            renderPartial(constants.CONTAINER_VOTE_AREA, constants.CONTAINER_VOTE_AREA , data, wireVoteHandlers);
        }
    };
    var unrenderVoteItems = function() {
        var container = config(constants.CONTAINER_VOTE_AREA);
        $(id(container)).html('');
    };
    var renderTransitionUI = function(action) {
        // var container = config(constants.CONTAINER_TRANSITION_UI_AREA);
        // var impl = LifecycleAPI.lifecycle();
        // var data = {};
        // var transitionUI;
        // if(impl) {
        //     //Get the transition UI for the provided action
        //     transitionUI = impl.transitionUIs(impl.currentState,action);
        //     if(!transitionUI){
        //         return;
        //     }
        //     data.href =transitionUI.href;
        //     renderPartial(constants.CONTAINER_TRANSITION_UI_AREA,constants.CONTAINER_TRANSITION_UI_AREA,data);
        // }
    };
    var unrenderTransitionUI = function() {
        // var container = config(constants.CONTAINER_TRANSITION_UI_AREA);
        // $(id(container)).html('');
    };
    //Blocks user interaction with the lifecycle actions
    var blockLCActions = function() {
        var lcActionContainer = config(constants.CONTAINER_LC_ACTION_OVERLAY);
        var container = $(id(lcActionContainer));
        container.html('<img src="' + spinnerURL() + '" /> Invoking action');
        container.css('position', 'absolute');
        container.css('z-index', 2);
        container.css('display', 'block');
        container.css('background-color', 'grey');
        container.css('top', 0);
        container.css('bottom', 0);
        container.css('left', 0);
        container.css('right', 0);
    };
    var unblockLCActions = function() {
        var checklistContainer = config(constants.CONTAINER_LC_ACTION_OVERLAY);
        var container = $(id(checklistContainer));
        container.html('');
        container.attr('style', '');
    };
    //Blocks user interaction with the check list
    var blockChecklist = function() {
        var checklistContainer = config(constants.CONTAINER_CHECKLIST_OVERLAY);
        var container = $(id(checklistContainer));
        container.html('<img src="' + spinnerURL() + '" /> Updating check list');
        container.css('position', 'absolute');
        container.css('z-index', 2);
        container.css('display', 'block');
        container.css('background-color', 'grey');
        container.css('top', 0);
        container.css('bottom', 0);
        container.css('left', 0);
        container.css('right', 0);
    };
    var unblockChecklist = function() {
        var checklistContainer = config(constants.CONTAINER_CHECKLIST_OVERLAY);
        var container = $(id(checklistContainer));
        container.html('');
        container.attr('style', '');
    };
    //Blocks user interaction with the vote
    var blockVote = function() {
        var voteContainer = config(constants.CONTAINER_VOTE_OVERLAY);
        var container = $(id(voteContainer));
        container.html('<img src="' + spinnerURL() + '" /> Updating vote');
        container.css('position', 'absolute');
        container.css('z-index', 2);
        container.css('display', 'block');
        container.css('background-color', 'grey');
        container.css('top', 0);
        container.css('bottom', 0);
        container.css('left', 0);
        container.css('right', 0);
    };
    var unblockVote = function() {
        var voteContainer = config(constants.CONTAINER_VOTE_OVERLAY);
        var container = $(id(voteContainer));
        container.html('');
        container.attr('style', '');
    };
    var hightlightCurrentStateNode = function() {
        var currentState = LifecycleAPI.lifecycle().currentState;
        var stateNode = LifecycleAPI.lifecycle().stateNode(currentState);
        if (!stateNode) {
            return;
        }
        LifecycleAPI.lifecycle().highlightCurrentState();
    };
    var clearComments = function() {
        var container = config(constants.INPUT_TEXTAREA_LC_COMMENT);
        $(id(container)).val('');
    };

    LifecycleAPI.event(constants.EVENT_LC_LOAD, function(options) {
        options = options || {};
        var lifecycleName = options.lifecycle;
        var impl = LifecycleAPI.lifecycle(lifecycleName);
        if (impl) {
            impl.render();
            renderStateInformation();
            hightlightCurrentStateNode();
            if (!LifecycleAPI.lifecycle().isLCActionsPermitted) {
                //Do not display a message since at this point we do not
                //have the permission details
                return;
            }
            renderLCActions();
            renderChecklistItems();
            renderVoteItems();
            renderDeleteActions();
            $(id(config(constants.CONTAINER_LC_NOTIFICATIONS_AREA))).html('');
        }
    });
    //LifecycleAPI.event(constants.EVENT_LC_LOAD, function(options) {
    //renderLCActions();
    //renderChecklistItems();
    //});
    LifecycleAPI.event(constants.EVENT_STATE_CHANGE, function() {
        renderStateInformation();
        hightlightCurrentStateNode();
        unrenderLCActions();
        unrenderChecklistItems();
        unrenderVoteItems();
        if (!LifecycleAPI.lifecycle().isLCActionsPermitted) {
            LifecycleAPI.notify(config(constants.MSG_WARN_CANNOT_CHANGE_STATE), {
                type: constants.NOTIFICATION_WARN,
                global: true
            });
            renderChecklistItems();
            return;
        }
        renderLCActions();
        renderChecklistItems();
        renderVoteItems();
        renderDeleteActions();
    });
    LifecycleAPI.event(constants.EVENT_FETCH_STATE_START, function() {
        blockChecklist();
        blockVote();
    });
    LifecycleAPI.event(constants.EVENT_FETCH_STATE_SUCCESS, function() {
        unblockChecklist();
        unblockVote();
        hightlightCurrentStateNode();
        renderStateInformation();
        if (LifecycleAPI.lifecycle().nextStates().length == 0) {
            LifecycleAPI.notify(config(constants.MSG_WARN_NO_TRAVERSABLE_STATE), {
                type: constants.NOTIFICATION_WARN,
                global: false
            });
            renderServerWarning(config(constants.MSG_WARN_NO_TRAVERSABLE_STATE));
            hideCommentInputArea();
            renderChecklistItems();
            renderVoteItems();
            return;
        }
        renderChecklistItems();
        renderVoteItems();
        renderLCActions();
        renderDeleteActions();
    });
    LifecycleAPI.event(constants.EVENT_FETCH_STATE_FAILED,function(){
        unrenderChecklistItems();
        $(id(config(constants.CONTAINER_CHECKLIST_OVERLAY))).hide();
        LifecycleAPI.notify("Failed to obtain state information ",{type:"error",global:true});
    });
    LifecycleAPI.event(constants.EVENT_UPDATE_CHECKLIST_START, function() {
        blockChecklist();
    });
    LifecycleAPI.event(constants.EVENT_UPDATE_CHECKLIST_SUCCESS, function() {
        unblockChecklist();
    });
    LifecycleAPI.event(constants.EVENT_UPDATE_CHECKLIST_FAILED, function() {
        unblockChecklist();
        LifecycleAPI.notify(config(constants.MSG_ERROR_CHECKLIST_UPDATE), {
            type: 'error'
        });
    });
    LifecycleAPI.event(constants.EVENT_UPDATE_VOTE_START, function() {
        blockVote();
    });
    LifecycleAPI.event(constants.EVENT_UPDATE_VOTE_SUCCESS, function() {
        unblockVote();
    });
    LifecycleAPI.event(constants.EVENT_UPDATE_VOTE_FAILED, function() {
        unblockVote();
        LifecycleAPI.notify(config(constants.MSG_ERROR_VOTE_UPDATE), {
            type: 'error'
        });
    });
    LifecycleAPI.event(constants.EVENT_ACTION_START, function() {
        blockLCActions();
    });
    LifecycleAPI.event(constants.EVENT_ACTION_SUCCESS, function() {
        //unrenderTransitionUI();
        hideTransitionInputsUI();
        unblockLCActions();
        clearComments();
        LifecycleAPI.notify(config(constants.MSG_SUCCESS_STATE_CHANGE), {
            type: 'success'
        });
        LifecycleAPI.lifecycle().fetchHistory();
    });
    LifecycleAPI.event(constants.EVENT_ACTION_FAILED, function() {
        unblockLCActions();
        //unrenderTransitionUI();
        var notifyMessage = constants.MSG_ERROR_STATE_CHANGE;
        if (arguments[0] && arguments[0].error) {
            notifyMessage = arguments[0].error;
            var n = notifyMessage.indexOf(": ");
            //to remove ": " along with exception type 2 was added to n
            notifyMessage = notifyMessage.substring(n + 2);
            LifecycleAPI.notify(notifyMessage, {
                type: 'error'
            });
        }
        else{
            LifecycleAPI.notify(config(constants.MSG_ERROR_STATE_CHANGE), {
                type: 'error'
            });
        }
    });
    LifecycleAPI.event(constants.EVENT_FETCH_HISTORY_SUCCESS, function() {
        clearHistoryRenderParams();
        renderHistory();
    });
    LifecycleAPI.event(constants.EVENT_LC_UNLOAD, function(options) {
        var lcContainer = config(constants.CONTAINER_LC_ACTION_AREA);
        var checklistContainer = config(constants.CONTAINER_CHECKLIST_AREA);
        var historyContainer = config(constants.CONTAINER_HISTORY_AREA);
        $(id(lcContainer)).html('');
        $(id(checklistContainer)).html('');
        $(id(historyContainer)).html('');
    });
    /**
     * The event callback is used to listen to selection changes to
     * the lifecycle select box
     */
    $(constants.UI_LIFECYCLE_SELECT_ID).change(function() {
        var selectedLC = $(this).val();
        debugger;
        //Call unload to make sure that the UI elements can de render
        LifecycleAPI.unloadActiveLifecycle();
        //Load the new lifecycle
        LifecycleAPI.lifecycle(selectedLC).load();
        LifecycleAPI.lifecycle(selectedLC).fetchHistory();
    });
    $(constants.UI_LIFECYCLE_SELECT_BOX).click(function(e) {
        e.preventDefault();
        debugger;
        var selectedLC = $(this).text();
        //Call unload to make sure that the UI elements can de render
        LifecycleAPI.unloadActiveLifecycle();
        //Load the new lifecycle
        LifecycleAPI.lifecycle(selectedLC).load();
        LifecycleAPI.lifecycle(selectedLC).fetchHistory();
    });

    $(constants.LIFECYCLE_HISTORY_LOADMORE_BUTTON).click(function(e) {
        e.preventDefault();
        appendHistory(historyStart,historyEnd);
    });

    var attachLifecycle = function(lifecycle,btn) {
        var data = {};
        data.lifecycles = [];
        data.lifecycles.push(lifecycle);
        var id = LifecycleUtils.currentAsset().id;
        var type = LifecycleUtils.currentAsset().type;
        var url = caramel.url('/apis/asset/' + id + '/attach-lifecycles?type=' + type);
        $.ajax({
            type: 'POST',
            url: url,
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function() {
                window.location.reload(false);
            },
            error: function() {
              $(btn).html('<i class="fw fw-add"></i> <span>Attach Lifecycle</span>');
              $(btn).removeClass('disable-lcmgt-btns');
              LifecycleAPI.notify(config(constants.MSG_ERROR_LC_ATTACH), {
                  type: constants.NOTIFICATION_ERROR,
                  global: false
              });
            }
        });
    };

    var detachLifecycle = function(lifecycle,btn) {
        var data = {};
        data.lifecycles = [];
        data.lifecycles.push(lifecycle);
        var id = LifecycleUtils.currentAsset().id;
        var type = LifecycleUtils.currentAsset().type;
        var url = caramel.url('/apis/asset/' + id + '/detach-lifecycles?type=' + type);
        $.ajax({
            type: 'POST',
            url: url,
            data: JSON.stringify(data),
            contentType: 'application/json',
            success: function() {
                window.location.reload(false);
            },
            error: function() {
              $(btn).html('<i class="fw fw-delete"></i><span>Remove</span>');
              $(btn).removeClass('disable-lcmgt-btns');
              //$(this).attr('disabled',false);
              LifecycleAPI.notify(config(constants.MSG_ERROR_LC_DETACH), {
                  type: constants.NOTIFICATION_ERROR,
                  global: false
              });
            }
        });
    };

    var initLifecycleManagement = function() {
        $('#lcMngAttachBtn').on('click', function(e) {
            e.preventDefault();
            //Disable the attach button
            //$(this).attr('disabled',true);
            $(this).html('Attaching lifecycle ....');
            $(this).addClass('disable-lcmgt-btns');
            var lifecycle = $('#lcPossibleLifecyclesSelect').val();
            attachLifecycle(lifecycle,this);
        });

        $('#attachedLifecyclesTable').find('.lc-mng-remove-btn').each(function() {
            $(this).on('click', function(e) {
                e.preventDefault();
                //Disable the remove button
                //$(this).attr('disabled',true);
                $(this).html('Removing lifecycle ...');
                $(this).addClass('disable-lcmgt-btns');
                var lifecycle = $(this).data('lifecycle');
                detachLifecycle(lifecycle,this);
            });
        });
    };

    var init = function() {
        var activeLC = LifecycleUtils.currentAsset().activeLifecycle;
        LifecycleAPI.lifecycle(activeLC).load();
        LifecycleAPI.lifecycle(activeLC).fetchHistory();
        initLifecycleManagement();
        validator.showError = function(element,errorMessage){
                $(element).notify(
                        errorMessage,
                        {
                            position:"right",
                            autoHide: false,
                            clickToHide: false
                        }
                );
        };
        validator.hideError = function(element){
                $(element).notify('notify-hide');
        };

    };
    init();
});
