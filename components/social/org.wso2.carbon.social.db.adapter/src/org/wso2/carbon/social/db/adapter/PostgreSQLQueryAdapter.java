package org.wso2.carbon.social.db.adapter;

import com.google.gson.JsonSyntaxException;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * This class is used to handle cross database pagination, insert activities and RETURN_GENERATED_KEYS for PostgreSQL.
 */
public class PostgreSQLQueryAdapter implements AdapterInterface {
    protected static final Log log = LogFactory.getLog(PostgreSQLQueryAdapter.class);
    protected static final String errorMsg = "Unable to generate the resultset.";
    protected static final String preparedStatementMsg = "Creating preparedStatement for :";

    private static final String COMMENT_SELECT_SQL_DESC = "SELECT body, id FROM SOCIAL_COMMENTS WHERE " +
            "payload_context_id = ? AND tenant_domain = ? ORDER BY id DESC OFFSET ? LIMIT ?";

    private static final String COMMENT_SELECT_SQL_ASC = "SELECT body, id FROM SOCIAL_COMMENTS WHERE " +
            "payload_context_id = ? AND tenant_domain = ? ORDER BY id ASC OFFSET ? LIMIT ?";

    private static final String POPULAR_COMMENTS_SELECT_SQL = "SELECT body, id FROM SOCIAL_COMMENTS WHERE " +
            "payload_context_id = ? AND tenant_domain = ? ORDER BY likes DESC OFFSET ? LIMIT ?";

    private static final String POPULAR_ASSETS_SELECT_SQL = "SELECT payload_context_id FROM SOCIAL_RATING_CACHE WHERE" +
            " payload_context_id LIKE ? AND tenant_domain = ? ORDER BY rating_average DESC OFFSET ? LIMIT ?";

    private static final String INSERT_COMMENT_SQL = "INSERT INTO SOCIAL_COMMENTS (body, payload_context_id, user_id," +
            " tenant_domain, likes, unlikes, timestamp) VALUES(?, ?, ?, ?, ?, ?, ?)";

    private static final String INSERT_RATING_SQL = "INSERT INTO SOCIAL_RATING (comment_id, payload_context_id, " +
            "user_id, tenant_domain, rating, timestamp) VALUES(?, ?, ?, ?, ?, ?)";

    private static final String INSERT_LIKE_SQL = "INSERT INTO SOCIAL_LIKES (payload_context_id, user_id, " +
            "tenant_domain, like_value, timestamp) VALUES(?, ?, ?, ?, ?)";

    /**
     * Get paginated activity result set.
     *
     * @param connection {@link Connection} object
     * @param targetId Payload context id
     * @param tenant Tenant id
     * @param order Order
     * @param limit Limit
     * @param offset Offset
     * @return Activity resultSet
     * @throws SQLException on errors while trying to get paginated activity result set
     */
    @Override
    public ResultSet getPaginatedActivitySet(Connection connection, String targetId, String tenant, String order, int
            limit, int offset) throws SQLException {
        PreparedStatement statement;
        ResultSet resultSet;
        try {
            statement = getPaginatedActivitySetPreparedStatement(connection, targetId, tenant, order, limit, offset);
            resultSet = statement.executeQuery();
            return resultSet;
        } catch (SQLException e) {
            log.error(errorMsg + e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get paginated activity prepared statement.
     *
     * @param connection {@link Connection} object
     * @param targetId Payload context id
     * @param tenant Tenant id
     * @param order Order
     * @param limit Limit
     * @param offset Offset
     * @return {@link PreparedStatement} object
     * @throws SQLException on errors while trying to get paginated activity prepared statement
     */
    @Override
    public PreparedStatement getPaginatedActivitySetPreparedStatement(Connection connection, String targetId, String
            tenant, String order, int limit, int offset) throws SQLException {
        PreparedStatement statement;
        String selectQuery = getSelectquery(order);

        if (log.isDebugEnabled()) {
            log.debug(preparedStatementMsg + selectQuery + " with following parameters, targetId: " + targetId
                              + " tenant: " + tenant + " limit: " + limit + " offset: " + offset);
        }

        statement = connection.prepareStatement(selectQuery);
        statement.setString(1, targetId);
        statement.setString(2, tenant);
        statement.setInt(3, offset);
        statement.setInt(4, limit);
        return statement;
    }

    /**
     * Get paginated popular target ResultSet.
     *
     * @param connection {@link Connection} object
     * @param type Type
     * @param tenantDomain Tenant domain
     * @param limit Limit
     * @param offset Offset
     * @return {@link ResultSet} object
     * @throws SQLException on errors while trying to get paginated popular target ResultSet.
     */
    @Override
    public ResultSet getPopularTargetSet(Connection connection, String type, String tenantDomain, int limit, int
            offset) throws SQLException {
        PreparedStatement statement;
        ResultSet resultSet;
        try {
            statement = getPopularTargetSetPreparedStatement(connection, type, tenantDomain, limit, offset);
            resultSet = statement.executeQuery();
            return resultSet;
        } catch (SQLException e) {
            log.error(errorMsg + e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get popular target prepared statement.
     *
     * @param connection {@link Connection} object
     * @param type Type
     * @param tenantDomain Tenant domain
     * @param limit Limit
     * @param offset Offset
     * @return {@link PreparedStatement} object
     * @throws SQLException on errors get popular target prepared statement.
     */
    @Override
    public PreparedStatement getPopularTargetSetPreparedStatement(
            Connection connection, String type, String tenantDomain, int limit,
            int offset) throws SQLException {
        PreparedStatement statement;
        if (log.isDebugEnabled()) {
            log.debug(preparedStatementMsg + POPULAR_ASSETS_SELECT_SQL + " with following parameters, type: " + type
                              + " tenant: " + tenantDomain + " offset: " + offset + " limit : " + limit);
        }

        statement = connection.prepareStatement(POPULAR_ASSETS_SELECT_SQL);
        statement.setString(1, type + "%");
        statement.setString(2, tenantDomain);
        statement.setInt(3, offset);
        statement.setInt(4, limit);
        return statement;
    }

    /**
     * Insert comment activity.
     *
     * @param connection {@link Connection} object
     * @param json JSON String.
     * @param targetId Payload context id
     * @param userId User id
     * @param tenantDomain Tenant domain
     * @param totalLikes Total likes
     * @param totalUnlikes Total unlikes
     * @param timeStamp Time stamp
     * @return Generated comment id
     * @throws SQLException on errors while trying to insert comment activity
     */
    @Override
    public long insertCommentActivity(Connection connection, String json, String targetId, String userId, String
            tenantDomain, int totalLikes, int totalUnlikes, int timeStamp) throws SQLException {
        PreparedStatement commentStatement;
        try {
            commentStatement = getInsertCommentActivityPreparedStatement(connection, json, targetId, userId, tenantDomain,
                    totalLikes, totalUnlikes, timeStamp);
            commentStatement.executeUpdate();

            ResultSet generatedKeys = commentStatement.getGeneratedKeys();
            return getGenaratedKeys(generatedKeys);
        } catch (SQLException e) {
            log.error("Error while publishing comment activity. " + e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get comment activity insert prepared statement.
     *
     * @param connection {@link Connection} object
     * @param json Json string
     * @param targetId Payload context id
     * @param userId User id
     * @param tenantDomain Tenant domain
     * @param totalLikes Total likes
     * @param totalUnlikes Total unlikes
     * @param timeStamp Time stamp
     * @return {@link PreparedStatement} object
     * @throws SQLException on errors while trying to get comment activity insert prepared statement
     */
    @Override
    public PreparedStatement getInsertCommentActivityPreparedStatement(
            Connection connection, String json, String targetId, String userId,
            String tenantDomain, int totalLikes, int totalUnlikes, int timeStamp)
            throws SQLException {
        PreparedStatement commentStatement = null;
        try {
            if (log.isDebugEnabled()) {
                log.debug(preparedStatementMsg + INSERT_COMMENT_SQL + " with following parameters, json: " + json
                                  + " targetId: " + targetId + " userId: " + userId + " tenantDomain: " + tenantDomain);
            }

            commentStatement = connection.prepareStatement(INSERT_COMMENT_SQL, Statement.RETURN_GENERATED_KEYS);
            commentStatement.setBytes(1, json.getBytes());
            commentStatement.setString(2, targetId);
            commentStatement.setString(3, userId);
            commentStatement.setString(4, tenantDomain);
            commentStatement.setShort(5, (short) totalLikes);
            commentStatement.setShort(6, (short) totalUnlikes);
            commentStatement.setInt(7, timeStamp);
        } catch (JsonSyntaxException e) {
            String message = "Malformed JSON element found: " + e.getMessage();
            log.error(message, e);
        }
        return commentStatement;
    }

    /**
     * Insert rating activity.
     *
     * @param connection {@link Connection} object
     * @param autoGeneratedKey Auto generated key.
     * @param targetId Target id.
     * @param userId payload context id
     * @param tenantDomain Tenant domain
     * @param rating Rating
     * @param timeStamp Time stamp
     * @return Whether rating activity insert or not
     * @throws SQLException on errors while trying to insert rating activity
     */
    @Override
    public boolean insertRatingActivity(Connection connection,
                                        long autoGeneratedKey, String targetId, String userId,
                                        String tenantDomain, int rating, int timeStamp) throws SQLException {
        PreparedStatement ratingStatement;
        int returnVal = 0;
        try {
            ratingStatement = getinsertRatingActivityPreparedStatement(connection, autoGeneratedKey, targetId, userId,
                    tenantDomain, rating, timeStamp);
            returnVal = ratingStatement.executeUpdate();

            boolean value = returnVal > 0 ? true : false;
            return value;
        } catch (SQLException e) {
            log.error("Error while publishing rating activity. " + e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get rating activity insert prepared statement.
     *
     * @param connection {@link Connection} object
     * @param autoGeneratedKey Auto generated Key
     * @param targetId Target id
     * @param userId User id
     * @param tenantDomain Tenant domain
     * @param rating Rating
     * @param timeStamp Timestamp
     * @return {@link PreparedStatement} object
     * @throws SQLException on errors while trying to get rating activity insert prepared statement
     */
    @Override
    public PreparedStatement getinsertRatingActivityPreparedStatement(
            Connection connection, long autoGeneratedKey, String targetId,
            String userId, String tenantDomain, int rating, int timeStamp)
            throws SQLException {
        PreparedStatement ratingStatement;
        if (log.isDebugEnabled()) {
            log.debug(preparedStatementMsg + INSERT_RATING_SQL + " with following parameters, generatedKey: "
                              + autoGeneratedKey + " target: " + targetId + " user: "
                              + userId + " tenant: " + tenantDomain + " rating: " + rating);
        }

        ratingStatement = connection.prepareStatement(INSERT_RATING_SQL);
        ratingStatement.setLong(1, autoGeneratedKey);
        ratingStatement.setString(2, targetId);
        ratingStatement.setString(3, userId);
        ratingStatement.setString(4, tenantDomain);
        ratingStatement.setInt(5, rating);
        ratingStatement.setInt(6, timeStamp);
        return ratingStatement;
    }

    /**
     * Insert like activity.
     *
     * @param connection {@link Connection} object
     * @param targetId Payload context id
     * @param actor Actor
     * @param tenantDomain Tenant domain
     * @param likeValue Link value
     * @param timestamp Time stamp
     * @return whether like activity inserted or not
     * @throws SQLException on errors while trying to insert like activity
     */
    @Override
    public boolean insertLikeActivity(Connection connection, String targetId, String actor, String tenantDomain, int
            likeValue, int timestamp) throws SQLException {
        PreparedStatement insertActivityStatement;
        int returnVal = 0;
        try {
            insertActivityStatement = getinsertLikeActivityPreparedStatement(connection, targetId, actor, tenantDomain, likeValue,
                    timestamp);
            returnVal = insertActivityStatement.executeUpdate();
            boolean value = returnVal > 0 ? true : false;
            return value;
        } catch (SQLException e) {
            log.error("Error while publishing like activity. " + e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get like activity insert prepared statement.
     *
     * @param connection {@link Connection} object
     * @param targetId Payload context id
     * @param actor Actor
     * @param tenantDomain Tenant domain
     * @param likeValue Like value
     * @param timestamp Timestamp
     * @return {@link PreparedStatement} object
     * @throws SQLException on errors while trying to get like activity insert prepared statement
     */
    @Override
    public PreparedStatement getinsertLikeActivityPreparedStatement(
            Connection connection, String targetId, String actor,
            String tenantDomain, int likeValue, int timestamp)
            throws SQLException {
        PreparedStatement insertActivityStatement;
        if (log.isDebugEnabled()) {
            log.debug(preparedStatementMsg + INSERT_LIKE_SQL + " with following parameters, target: " + targetId
                              + " user: " + actor + " tenant: " + tenantDomain + " like: " + likeValue);
        }

        insertActivityStatement = connection.prepareStatement(INSERT_LIKE_SQL);
        insertActivityStatement.setLong(1, Long.parseLong(targetId));
        insertActivityStatement.setString(2, actor);
        insertActivityStatement.setString(3, tenantDomain);
        insertActivityStatement.setShort(4, (short) likeValue);
        insertActivityStatement.setInt(5, timestamp);
        return insertActivityStatement;
    }

    /**
     * Get Select query based on order.
     *
     * @param order Order
     * @return Select query
     */
    protected static String getSelectquery(String order) {
        if ("NEWEST".equals(order)) {
            return COMMENT_SELECT_SQL_DESC;
        } else if ("OLDEST".equals(order)) {
            return COMMENT_SELECT_SQL_ASC;
        } else {
            return POPULAR_COMMENTS_SELECT_SQL;
        }
    }

    /**
     * Get generated ID by providing the resultSet.
     *
     * @param generatedKeys {@link ResultSet} object
     * @return Generated keys
     * @throws SQLException On errors while trying to get generated keys
     */
    @Override
    public long getGenaratedKeys(ResultSet generatedKeys) throws SQLException {
        long autoGeneratedKey = -1;
        if (generatedKeys.next()) {
            autoGeneratedKey = generatedKeys.getLong(1);
            generatedKeys.close();
        }
        return autoGeneratedKey;
    }
}