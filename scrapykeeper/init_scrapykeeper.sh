#!/bin/bash

wget --post-data=project_name=Laastutabloo  http://$scrapykeeper_user:$scrapykeeper_password@localhost:5050/api/projects --no-http-keep-alive
