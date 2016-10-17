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

public interface Activity {
    String getId();

    JsonObject getBody();

    int getTimestamp();

    String getActorId();

    String getTargetId();

    int getLikeCount();

    int getDislikeCount();

    String getObjectType();

    String getVerb();

    int getRating();

    String getComment();

	void setLikeCount(int likeCount);

	void setDislikeCount(int dislikeCount);

	void setId(int id);

    /**
     *
     * @param rating Set rating to current Activity
     */
    void setRating(int rating);

    /**
     *
     * @param comment Add comment to current activity , This will override the (if)existing comment.
     */
    void setComment(String comment);

    void setILike(boolean like);

    void setIDislike(boolean dislike);
}
