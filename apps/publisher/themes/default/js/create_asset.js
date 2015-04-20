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
$(function(){
	var obtainFormMeta=function(formId){
		return $(formId).data();
	};
	$(document).ready(function(){
		$('#form-asset-create').ajaxForm({
			beforeSubmit:function(){
				PublisherUtils.blockButtons({
					container:'saveButtons',
					msg:'Creating the '+PublisherUtils.resolveCurrentPageAssetType()+ ' instance'
				});
			},
			success:function(){
                var options = obtainFormMeta('#form-asset-create');
                console.log(JSON.stringify(options));
                if (options.jqxhr.status == 201) {
                    window.location = options.redirectUrl;
                } else if (options.jqxhr.status == 202) {
                    alert('Invoked the asset creation workflow')
                    window.location = options.redirectUrl;
                }
                //alert('Aww snap! '+JSON.stringify(options));

			},
			error:function(){
				alert('Unable to add the '+PublisherUtils.resolveCurrentPageAssetType()+' instance.');
				PublisherUtils.unblockButtons({
					container:'saveButtons'
				});
			}
		});
	});

});