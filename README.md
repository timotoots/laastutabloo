# Laastutabloo
Source code for art installation Laastutabloo in Estonian National Museum.

Released here for self documentation and educational purposes.

# Software

## Start with fresh Ubuntu 20.04

# Setup using Docker
```
sudo apt update
sudo apt install -y docker.io docker-compose apache2-utils
sudo mkdir /opt/laastutabloo
cd /opt && git clone https://github.com/timotoots/laastutabloo.git
cd laastutabloo
```

Change usernames and passwords in .env
(Optional) Add extra credentials for datasets to file config/datasets_private.json

```
./init_project.sh
cp config/laastutabloo.service /etc/systemd/system/
systemctl enable laastutabloo
```

Create user with access to admin:
```
htpasswd config/nginx/htpasswd username
```


