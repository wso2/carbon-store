package org.wso2.carbon.social.sql;

import java.sql.PreparedStatement;
import java.sql.Connection;
import java.sql.SQLException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;
import org.mozilla.javascript.NativeObject;
import org.wso2.carbon.social.sql.Constants;
import org.wso2.carbon.social.core.ActivityPublisher;
import org.wso2.carbon.social.core.JSONUtil;

public class SQLActivityPublisher extends ActivityPublisher {

	private static Log log = LogFactory.getLog(SQLActivityPublisher.class);
	public static final String INSERT_SQL = "INSERT INTO "
			+ Constants.SOCIAL_TABLE_NAME
			+ "(id, payload_context_id, body) VALUES(?, ?, ?)";
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

			String contextId = JSONUtil.getNullableProperty(activity,
					Constants.CONTEXT_JSON_PROP, Constants.ID_JSON_PROP);
			if (contextId == null) {
				contextId = JSONUtil.getProperty(activity,
						Constants.TARGET_JSON_PROP, Constants.ID_JSON_PROP);
			}

			connection.setAutoCommit(false);
			statement = connection.prepareStatement(INSERT_SQL);
			// TODO set tenantDomain separately
			statement.setString(1, id);
			statement.setString(2, contextId);
			statement.setString(3, json);
			ret = statement.executeUpdate();
			connection.commit();

			if (ret > 0) {
				return id;
			}

			if (log.isDebugEnabled()) {
				if (ret > 0) {
					log.debug("Activity published successfully. "
							+ " Activity ID: " + id + " ContextID: "
							+ contextId + " JSON: " + json);
				} else {
					log.debug(ErrorStr + " Activity ID: " + id + " ContextID: "
							+ contextId + " JSON: " + json);
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
