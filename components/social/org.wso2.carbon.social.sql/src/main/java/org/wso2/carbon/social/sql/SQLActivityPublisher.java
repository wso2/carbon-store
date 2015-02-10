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

package org.wso2.carbon.social.sql;

import java.sql.PreparedStatement;
import java.sql.Connection;
import java.sql.SQLException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.mozilla.javascript.NativeObject;
import org.wso2.carbon.social.sql.Constants;
import org.wso2.carbon.social.sql.SocialUtil;
import org.wso2.carbon.social.core.ActivityPublisher;
import org.wso2.carbon.social.core.JSONUtil;

public class SQLActivityPublisher extends ActivityPublisher {

	private static Log log = LogFactory.getLog(SQLActivityPublisher.class);
	public static final String INSERT_SQL = "INSERT INTO "
			+ Constants.SOCIAL_TABLE_NAME + "(" + Constants.ID_COLUMN + ","
			+ Constants.CONTEXT_ID_COLUMN + "," + Constants.BODY_COLUMN + ", "
			+ Constants.TENANT_DOMAIN_COLUMN + ", " + Constants.TIMESTAMP
			+ ") VALUES(?, ?, ?, ?, ?)";
	public static final String ErrorStr = "Failed to publish the social event.";

	@Override
	protected String publish(String id, NativeObject activity) {
		DSConnection con = new DSConnection();
		Connection connection = con.getConnection();
		int ret = 0;

		if (connection == null) {
			return null;
		}

		PreparedStatement statement;

		String json = null;
		try {
			json = JSONUtil.SimpleNativeObjectToJson(activity);

			String targetId = JSONUtil.getNullableProperty(activity,
					Constants.CONTEXT_JSON_PROP, Constants.ID_JSON_PROP);
			if (targetId == null) {
				targetId = JSONUtil.getProperty(activity,
						Constants.TARGET_JSON_PROP, Constants.ID_JSON_PROP);
			}

			String timeStamp = JSONUtil.getProperty(activity,
					Constants.TIMESTAMP);

			connection.setAutoCommit(false);
			statement = connection.prepareStatement(INSERT_SQL);
			String tenantDomain = SocialUtil.getTenantDomain();
			statement.setString(1, id);
			statement.setString(2, targetId);
			statement.setString(3, json);
			statement.setString(4, tenantDomain);
			statement.setString(5, timeStamp);
			ret = statement.executeUpdate();
			connection.commit();

			if (ret > 0) {
				return id;
			}

			if (log.isDebugEnabled()) {
				if (ret > 0) {
					log.debug("Activity published successfully. "
							+ " Activity ID: " + id + " TargetID: " + targetId
							+ " JSON: " + json);
				} else {
					log.debug(ErrorStr + " Activity ID: " + id + " TargetID: "
							+ targetId + " JSON: " + json);
				}
			}

		} catch (SQLException e) {
			log.error(ErrorStr + e);
		} catch (JSONException e) {
			log.error("Unable to retrieve the JSON activity. " + e);
		} finally {
			if (con != null) {
				con.closeConnection(connection);
			}
		}

		return null;

	}

}
