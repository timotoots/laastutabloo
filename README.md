# Laastutabloo
Source code for art installation Laastutabloo in Estonian National Museum.

Released here for self documentation and educational purposes.

# Software

## Start with fresh Ubuntu 20.04

## Setup operating system
```
sudo timedatectl set-timezone Europe/Tallinn
sudo apt update
sudo apt install -y docker.io docker-compose apache2-utils
sudo mkdir /opt/laastutabloo
cd /opt && git clone https://github.com/timotoots/laastutabloo.git
cd laastutabloo
```

## Change usernames and passwords in .env  
```
nano .env
```

## Check configuration
* Configuration for datasets, providers and scripts are imported during setup. 
* Check ```config/datasets/``` for public datasets.
* Create file ```config/datasets_private.json``` for private datasets. This file is not version controlled.

## Create user to access admin interface:
```
htpasswd config/nginx/htpasswd username
```

## Initialize system
```
./init_project.sh
```

## Create service and enable for starting on boot
```
sudo cp config/laastutabloo.service /etc/systemd/system/
sudo systemctl enable laastutabloo
```

## Start the system
```
sudo systemctl start laastutabloo
```

## Access admin interface here
https://laastutabloo.erm.ee/admin

## Access public web interface here
https://laastutabloo.erm.ee

## Success!! Your server should be oprational!

# Operational tools

## Check logs for backend
```
docker-compose logs -f --tail=50 datastore scrapyd
```

## Check logs for curator
```
docker-compose logs -f --tail=50 curator
```

## Restart all processes
```
sudo systemctl restart laastutabloo
```

## Restart specific containers
```
docker-compose restart curator
docker-compose restart nginx
```

## Restart and run curator
```
docker-compose stop curator
docker-compose up curator
```

## Start with all ports public for debugging
```
docker-compose run --service-ports
```

# Making backups

## Export datasets from database to JSON
```
docker-compose run datastore python3 /opt/laastutabloo/backend/datastore/dataset_db_to_json_dumper.py --output /output --providers --scripts --queries datasets2  
```

## Commit all changes in datasets to git
```
git add /opt/laastutabloo/output/*
git commit -m "backup config"
git pull
git push
```

## Copy private datasets to your computer
```
config/datasets_private.json
```



