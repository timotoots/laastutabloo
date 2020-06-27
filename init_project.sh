#!/bin/sh

docker-compose up --no-start
docker-compose start postgres
sleep 1
docker-compose exec postgres su -c /opt/laastutabloo/config/postgres_startup.sh  postgres 

docker-compose start datastore scrapyd scrapykeeper
sleep 1
docker-compose exec scrapyd scrapyd-deploy
docker-compose exec scrapykeeper /init_scrapykeeper.sh
docker-compose run datastore python3 /opt/laastutabloo/backend/datastore/dataset_json_to_db_loader.py --providers datasets2