package org.wso2.carbon.social.sql.internal;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.osgi.framework.BundleContext;
import org.osgi.service.component.ComponentContext;
import org.wso2.carbon.ndatasource.core.DataSourceService;
import org.wso2.carbon.social.sql.service.SQLActivityService;
import org.wso2.carbon.social.core.service.SocialActivityService;
import org.wso2.carbon.social.sql.JDBCPersistenceManager;
import org.wso2.carbon.social.sql.Constants;

/**
 * Registering {@link SocialActivityService}
 * 
 * @scr.component name="org.wso2.carbon.social.component" immediate="true"
 * @scr.reference name="datasources.service"
 *                interface="org.wso2.carbon.ndatasource.core.DataSourceService"
 *                cardinality="1..1" policy="dynamic"
 *                bind="setDataSourceService" unbind="unsetDataSourceService"
 **/

public class SQLSocialComponent {

	private static Log log = LogFactory.getLog(SQLSocialComponent.class);

	protected void activate(ComponentContext context) {
		BundleContext bundleContext = context.getBundleContext();
		bundleContext.registerService(SocialActivityService.class,
				new SQLActivityService(), null);
		if (log.isDebugEnabled()) {
			log.debug("Social Activity service is activated  with SQL Implementation");
		}

			String cmd = System.getProperty(Constants.SETUP_CMD);
			if (cmd != null) {
				JDBCPersistenceManager jdbcPersistenceManager;
				try {
					jdbcPersistenceManager = JDBCPersistenceManager
							.getInstance();
					jdbcPersistenceManager.initializeDatabase();
				} catch (Exception e) {
					log.error("Failed to initilize database. " + e);
				}
				
			}
	}

	protected void setDataSourceService(DataSourceService dataSourceService) {
		if (log.isDebugEnabled()) {
			log.debug("Setting the DataSourceService");
		}
		JDBCPersistenceManager.setCarbonDataSourceService(dataSourceService);
	}

	protected void unsetDataSourceService(DataSourceService dataSourceService) {
		if (log.isDebugEnabled()) {
			log.debug("Unsetting the DataSourceService");
		}
		JDBCPersistenceManager.setCarbonDataSourceService(null);
	}

}