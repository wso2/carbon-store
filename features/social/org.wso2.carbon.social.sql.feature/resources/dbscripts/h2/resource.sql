CREATE TABLE IF NOT EXISTS ES_SOCIAL ( id VARCHAR(250), payload_context_id VARCHAR(250),body CLOB, tenant_domain VARCHAR(100), timestamp VARCHAR(250));
CREATE TABLE IF NOT EXISTS ES_SOCIAL_RATING ( id VARCHAR(250), payload_context_id VARCHAR(250),body CLOB, tenant_domain VARCHAR(100), rating BIGINT,timestamp VARCHAR(250));
CREATE TABLE IF NOT EXISTS ES_SOCIAL_RATING_CACHE ( payload_context_id VARCHAR(250), rating_total BIGINT,rating_count BIGINT);
