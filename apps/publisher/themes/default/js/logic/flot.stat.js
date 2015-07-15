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
$(function(flotUtils, graphUtils) {
    
    //Date picker specific code
    var to = new Date();
    var from = new Date(to.getTime() - 1000 * 60 * 60 * 24 * 14);
    $('#datepicker-calendar').DatePicker({
        inline: true,
        date: [from, to],
        calendars: 3,
        mode: 'range',
        current: new Date(to.getFullYear(), to.getMonth() - 1, 1),
        onChange: function(dates, el) {
            // update the range display
            $('#date-range-field span').text(convertDate(dates[0]) + ' to ' + convertDate(dates[1]));
            onDateSelected(convertDate(dates[0]),convertDate(dates[1]));
        }
    });
    $('#date-range-field span').text(convertDate(from) + ' to ' + convertDate(to));
    $('#date-range-field').bind('click', function() {
        $('#datepicker-calendar').toggle();
        if ($('#date-range-field a').text().charCodeAt(0) == 9660) {
            // switch to up-arrow
            $('#date-range-field a').html('&#9650;');
            $('#date-range-field').css({
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0
            });
            $('#date-range-field a').css({
                borderBottomRightRadius: 0
            });
        } else {
            // switch to down-arrow
            $('#date-range-field a').html('&#9660;');
            $('#date-range-field').css({
                borderBottomLeftRadius: 5,
                borderBottomRightRadius: 5
            });
            $('#date-range-field a').css({
                borderBottomRightRadius: 5
            });
        }
        return false;
    });
    $('html').click(function() {
        if ($('#datepicker-calendar').is(":visible")) {
            $('#datepicker-calendar').hide();
            $('#date-range-field a').html('&#9660;');
            $('#date-range-field').css({
                borderBottomLeftRadius: 5,
                borderBottomRightRadius: 5
            });
            $('#date-range-field a').css({
                borderBottomRightRadius: 5
            });
        }
    });
    $('#datepicker-calendar').click(function(event) {
        event.stopPropagation();
    });

    //Flot rendering logic

    var url = window.location.pathname;
    var comps = url.split('/');
    var type = comps[comps.length - 2];
    var operation = comps[comps.length - 3];
    var dateRange = $('#date-range-field span').text();
    var fromDate = dateRange.split('to')[0];
    var toDate = dateRange.split('to')[1];
    var API_URL = '/apis/statistics';
    var buildApiUrl = function(type, startDate, endDate, onChoice) {
        onChoice = onChoice || false;
        var choice = (onChoice) ? ('&onchoice=' + onChoice) : '';
        var context = caramel.context;
        return context + API_URL + '?type=' + type + '&start=' + startDate + '&end=' + endDate + choice;
    };
    $.ajax({
        url: buildApiUrl(type, fromDate, toDate),
        type: 'GET',
        success: function(response) {
            //var parsedResponse = JSON.parse(response);
            var parsedResponse = response;
            /* Bookmark stats graph */
            var data = [{
                data: parsedResponse.bookmarkStats,
                color: '#409628',
                label: 'Assets',
                lines: {
                    show: true
                },
                points: {
                    show: true
                }
            }];
            var options = {
                yaxis: {
                    show: true,
                    tickDecimals: 0
                },
                xaxis: {
                    labelAngle: 90,
                    ticks: parsedResponse.bookmarkTicks
                }
            };
            $.plot($("#placeholder1"), data, options);
            /* Hot assets stats graph */
            var data2 = [{
                data: parsedResponse.hotAssetStats,
                color: '#FFC826',
                label: 'Assets',
                bars: {
                    show: true,
                    barWidth: 0.6,
                    align: "center"
                }
            }];
            var options2 = {
                yaxis: {
                    show: true,
                    tickDecimals: 0
                },
                xaxis: {
                    labelAngle: 90,
                    ticks: parsedResponse.hotAssetTicks
                }
            };
            $.plot($("#placeholder2"), data2, options2);
        },
        error: function(response) {
            alert('Error occured at statistics graph rendering');
        }
    });
    function onDateSelected(from, to) {
        var url = window.location.pathname;
        var comps = url.split('/');
        var type = comps[comps.length - 2];
        var operation = comps[comps.length - 3];
        $.ajax({
            url: buildApiUrl(type, from, to, true),
            type: 'GET',
            success: function(response) {
                var parsedResponse = JSON.parse(JSON.stringify(response));
                /* Hot assets stats graph */
                var data2 = [{
                    data: parsedResponse.hotAssetStats,
                    color: '#FFC826',
                    label: 'Assets',
                    bars: {
                        show: true,
                        barWidth: 0.6,
                        align: "center"
                    }
                }];
                var options2 = {
                    yaxis: {
                        show: true,
                        tickDecimals: 0
                    },
                    xaxis: {
                        labelAngle: 90,
                        ticks: parsedResponse.hotAssetTicks
                    }
                };
                $.plot($("#placeholder2"), data2, options2);
            },
            error: function(response) {
                alert('Error occured at statistics graph rendering');
            }
        });
    };
    function convertDate(date) {
        var month = date.getMonth() + 1;
        var day = date.getDate();
        return date.getFullYear() + '-' + (('' + month).length < 2 ? '0' : '') + month + '-' + (('' + day).length < 2 ? '0' : '') + day;
    };
});