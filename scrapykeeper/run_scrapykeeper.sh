#!/bin/bash

scrapykeeper --port 5050 --server http://scrapyd:6800 --username $scrapykeeper_user --password  $scrapykeeper_password --database-url=postgres://$laastutabloo_db_user:$laastutabloo_db_password@postgres:5432/scrapykeeper

