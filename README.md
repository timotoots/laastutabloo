# laastutabloo
Source code for art installation Laastutabloo in Estonian National Museum.

Released here for self documentation and educational purposes.

# Software

## Start with fresh Ubuntu 18.04

## Install packages
```
sudo apt install nano git postgis apache2 npm python3-virtualenv virtualenvwrapper python3-scrapy python3-ujson python3-ijson python3-cffi libyajl2
sudo hostname laastutabloo

```

## Install frontend JS requirements
```
cd /opt/laastutabloo/frontend/lib/
npm i

```

## Clone this repo
```
sudo mkdir /opt/laastutabloo
sudo chown laastutabloo:laastutabloo /opt/laastutabloo 
cd /opt && git clone git@github.com:timotoots/laastutabloo.git
```

## Prepare database
```
sudo mkdir /opt/laastutabloo
sudo chown laastutabloo:laastutabloo /opt/laastutabloo 
cd /opt && git clone git@github.com:timotoots/laastutabloo.git
CREATE EXTENSION postgis;

```



## Setup up scrapy
```
sudo pip3 install scrapyd-client flask_cors 

```

## Setup up scrapy
```
sudo pip3 install scrapyd-client flask_cors 
cd /opt/laastutabloo/backend/laastutabloo/scrapy_updater/; scrapyd-deploy -p Laastutabloo
```


Docker
apt update ; apt install -y docker.io docker-compose

./init_project.sh


