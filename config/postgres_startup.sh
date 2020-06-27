#!/bin/bash
psql -c "create role $laastutabloo_db_user with login password '$laastutabloo_db_password'"
createdb -O $laastutabloo_db_user $laastutabloo_db
createdb -O $laastutabloo_db_user scrapykeeper
psql -d $laastutabloo_db  -c "CREATE EXTENSION postgis;"
psql -d $laastutabloo_db  -c "GRANT CREATE ON DATABASE $laastutabloo_db TO $laastutabloo_db_user;"
psql -U $laastutabloo_db_user -d $laastutabloo_db -f /opt/laastutabloo/config/init.sql
