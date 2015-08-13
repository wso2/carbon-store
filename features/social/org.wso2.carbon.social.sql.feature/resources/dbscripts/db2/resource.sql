CREATE TABLE SOCIAL_COMMENTS ( id BIGINT NOT NULL,body BLOB, payload_context_id VARCHAR(250),user_id VARCHAR(100), tenant_domain VARCHAR(100), likes SMALLINT, unlikes SMALLINT, timestamp VARCHAR(100), PRIMARY KEY (id))
/
CREATE TABLE SOCIAL_RATING ( id BIGINT NOT NULL, comment_id BIGINT NOT NULL, payload_context_id VARCHAR(250),user_id VARCHAR(100), tenant_domain VARCHAR(100), rating SMALLINT,timestamp VARCHAR(100), PRIMARY KEY (id), FOREIGN KEY (comment_id) REFERENCES SOCIAL_COMMENTS(id) ON DELETE CASCADE)
/
CREATE TABLE SOCIAL_RATING_CACHE ( payload_context_id VARCHAR(250) NOT NULL, rating_total INT,rating_count INT, rating_average DOUBLE PRECISION, tenant_domain VARCHAR(100), PRIMARY KEY (payload_context_id))
/
CREATE TABLE SOCIAL_LIKES ( id BIGINT NOT NULL, payload_context_id BIGINT NOT NULL, user_id VARCHAR(100), tenant_domain VARCHAR(100), like_value SMALLINT, timestamp VARCHAR(100), PRIMARY KEY (id), FOREIGN KEY (payload_context_id) REFERENCES SOCIAL_COMMENTS(id) ON DELETE CASCADE)
/
