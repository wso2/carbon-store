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

package org.wso2.carbon.social.core.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;

import org.wso2.carbon.social.core.Activity;
import org.wso2.carbon.social.core.ActivityBrowser;
import org.wso2.carbon.social.core.ActivityPublisher;
import org.wso2.carbon.social.core.SocialActivityException;

import java.util.List;

public abstract class SocialActivityService {

	/**
	 * Allows activity to be passed into the service. 
	 * 
	 * Eg: -
	 * {"verb":"post","object"
	 * :{"objectType":"review","content":"sample comment",
	 * "rating":4,"likes":{"totalItems"
	 * :0},"dislikes":{"totalItems":0}},"target":
	 * {"id":"319f492d-3210-4096-8ffb-f49b0fed1d2d"
	 * },"actor":{"id":"user@tenant.com","objectType":"person"}}
	 * 
	 * @param activity
	 * @throws SocialActivityException 
	 * @throws JsonSyntaxException 
	 * 
	 */
	public long publish(String activity) throws SocialActivityException {
		return getActivityPublisher().publish(activity);
	}

	/**
	 * 
	 * @param targetId
	 * @param order
	 * @param offset
	 * @param limit
	 * @return
	 * @throws SocialActivityException 
	 */
	public String[] listActivities(String targetId, String order, int offset,
			int limit) throws SocialActivityException {
		List<Activity> activities = getActivityBrowser()
				.listActivities(targetId, order, offset, limit);
		String[] serializedActivities = new String[activities.size()];
		for (int i = 0; i < activities.size(); i++) {
			serializedActivities[i] = activities.get(i).toString();
		}
		return serializedActivities;
	}

    /**
     * Update an activity given new activity,
     * Retrieve the current activity by activitiId and Replace the existing activity information with the
     * given {activity} object
     * @param activity Stringify activity JSON, An activity can be either
     *                       comment or like/dislike unlike/un-dislike
     * @throws SocialActivityException
     * @throws JsonSyntaxException
     */
    public String update(String activity) throws SocialActivityException {
        return getActivityPublisher().update(activity);
    }

	/**
	 * Allows asset id to be passed into the service and retrieve average rating
	 * for the given asset
	 * 
	 * @param targetId
	 * @return averageRating
	 */
	public JsonObject getRating(String targetId) throws SocialActivityException {
		return getActivityBrowser().getRating(targetId);
	}

	/**
	 * Allows targetId, sortOrder, offset and limit to be passed into the
	 * service and retrieve social activities. offset and limit will be used for
	 * pagination purpose.
	 * 
	 * 1st page : offset=0 and limit =10 (returns 1st 10 activities according to
	 * the given sort order) 2nd page : offset:10 and limit=10 ...
	 * 
	 * @param targetId
	 * @param sortOrder
	 * @param offset
	 * @param limit
	 * @return
	 */
	public String getSocialObjectJson(String targetId, String sortOrder,
			int offset, int limit) throws SocialActivityException {
		JsonObject socialObject = getActivityBrowser().getSocialObject(
				targetId, sortOrder, offset, limit);

		if (socialObject != null) {
			return socialObject.toString();
		} else {
			return "{}";
		}
	}

	/**
	 * Allows average rating and limit to be passed and returns assets with
	 * greater average rating value.
	 * 
	 * @param avgRating
	 * @param limit
	 * @return
	 */
	public String getTopAssets(double avgRating, int limit) throws SocialActivityException {
		JsonObject topAssetObject = getActivityBrowser().getTopAssets(
				avgRating, limit);
		if (topAssetObject != null) {
			return topAssetObject.toString();
		} else {
			return "{}";
		}
	}

	public String getPopularAssets(String type, String tenantId, int limit, int offset) throws SocialActivityException {
		JsonObject popularAssetObject = getActivityBrowser().getPopularAssets(
				type, tenantId, limit, offset);
		if (popularAssetObject != null) {
			return popularAssetObject.toString();
		} else {
			return "{}";
		}
	}
	
	/**
	 * Allows target id and number of likes to be passed and return social
	 * activities with greater number of likes.
	 * 
	 * @param targetId
	 * @param likes
	 * @return
	 */
	public String getTopComments(String targetId, int likes) throws SocialActivityException {
		JsonObject topCommentObject = getActivityBrowser().getTopComments(
				targetId, likes);
		if (topCommentObject != null) {
			return topCommentObject.toString();
		} else {
			return "{}";
		}
	}

	/**
	 * Return springfield JSON object of the user review , for the given asset by given username.
	 *
	 * @param userId   User name with the tenant domain i:e = admin@carbon.super
	 * @param targetId Asset type with asset UUID separated by colon.
	 * @return springfield JSON object of user review
	 * @throws SocialActivityException
	 */
	public String getUserComment(String userId, String targetId) throws SocialActivityException {
		JsonObject userCommentObject = getActivityBrowser().getUserComment(userId, targetId);
		if (userCommentObject != null) {
			return userCommentObject.toString();
		} else {
			return "{}";
		}
	}

	/**
	 * 
	 * @param targetId
	 * @param timestamp
	 * @return
	 */
	public String pollLatestComments(String targetId, int timestamp) throws SocialActivityException {
		JsonObject newestCommentObject = getActivityBrowser()
				.pollNewestComments(targetId, timestamp);
		if (newestCommentObject != null) {
			return newestCommentObject.toString();
		} else {
			return "{}";
		}
	}

	/**
	 * Allows activity id and user id to be passed into the service and remove
	 * given activity
	 * 
	 * @param activityId
	 * @param userId
	 * @return
	 */
	public boolean removeActivity(int activityId, String userId) throws SocialActivityException {
		return getActivityPublisher().remove(activityId, userId);
	}

	/**
	 * Allows user id, target id and like/unlike value into the service and get
	 * like/unlike status
	 * 
	 * @param userId
	 * @param targetId
	 * @param like
	 * @return
	 */
	public boolean isUserLiked(String userId, int targetId, int like) throws SocialActivityException {
		return getActivityBrowser().isUserlikedActivity(userId, targetId, like);
	}

	/**
	 * Check for existing reviews for the targetId given username
	 *
	 * @param targetId Asset type and asset UUID delimited by colon i:e - gadget:03e25109-02d6-40c8-9994-6292737599a4
	 * @param userId Username with the tenant domain i:e - admin@carbon.super
	 *
	 */
	public boolean isPublished(String activity, String targetId, String userId) throws SocialActivityException {
		return getActivityBrowser().isPublished(activity, targetId, userId);
	}

	/**
	 * Rating cache keep the pre-calculated average rating value for individual asset so that
	 * it saves computation when listing asset details with rating values
	 * @param targetId Asset type and asset UUID delimited by semicolon i:e 'gadget:213213-214-2141A-212FA221B'
	 * @return
	 * @throws SocialActivityException
	 */
	public int warmUpRatingCache(String targetId) throws SocialActivityException {
		return getActivityPublisher().warmUpRatingCache(targetId);
	}

	public abstract ActivityBrowser getActivityBrowser();

	public abstract ActivityPublisher getActivityPublisher();

	/**
	 * Allows an external configuration object to be passed into the Service
	 * //TODO: remove this. config should happen independent of the service
	 *
	 * @param configObject
	 */
	public abstract void configPublisher(String configuration);
}
