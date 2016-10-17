/*
 * Copyright (c) 2005-2015, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package org.wso2.carbon.social.core;

import com.google.gson.JsonObject;

import java.util.List;

public interface ActivityBrowser {

	JsonObject getRating(String targetId) throws SocialActivityException;

	JsonObject getSocialObject(String targetId, String order, int offset,
			int limit) throws SocialActivityException;

	List<Activity> listActivities(String targetId, String order,int offset, int limit) throws SocialActivityException;

	/*List<Activity> listActivitiesChronologically(String targetId, String order,
			int offset, int limit);*/

	JsonObject getTopAssets(double avgRating, int limit) throws SocialActivityException;

	JsonObject getTopComments(String targetId, int likes) throws SocialActivityException;

	/**
	 *  Get comment with the targetId for the user with the given userId
	 * @param userId Username with tenant domain i:e admin@carbon.super
	 * @param targetId AssetType + UUID delimited by colon
	 * @return JsonObject Comment JsonObject with text
	 * @throws SocialActivityException
	 */
	JsonObject getUserComment(String userId, String targetId) throws SocialActivityException;

	boolean isUserlikedActivity(String userId, int targetId, int like) throws SocialActivityException;

	/**
	 * Check whether the given user has already published the given activity on targetId (AssetType + UUID)
	 *
	 * @param activity Stringify activity JSON, An activity can be either
	 *                       comment or like/dislike unlike/un-dislike
	 * @param targetId       AssetType + UUID delimited by colon
	 * @param userId         Username with tenant domain i:e admin@carbon.super
	 * @return Boolean whether user has already reviewed or not
	 */
	boolean isPublished(String activity, String targetId, String userId) throws SocialActivityException;

	JsonObject pollNewestComments(String targetId, int timestamp) throws SocialActivityException;

	JsonObject getPopularAssets(String type, String tenantId, int limit,
			int offset) throws SocialActivityException;
}
