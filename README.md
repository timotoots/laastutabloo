# laastutabloo
Source code for art installation Laastutabloo in Estonian National Museum.

Released for self documenation and educational purposes.

# Software

## Start with fresh Ubuntu 18.04

## Install packages
```
sudo apt install nano git postgis apache2 npm
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

##
