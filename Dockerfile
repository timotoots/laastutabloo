FROM ubuntu:18.04
MAINTAINER Tanel Karindi mou@mou.ee

RUN apt-get update -y && \
    apt-get install -y python3-pip python3-dev python3-geojson


# We copy just the requirements.txt first to leverage Docker cache
COPY backend/datastore/requirements.txt requirements.txt

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PYTHONIOENCODING UTF-8 

RUN pip3 install -r requirements.txt
COPY backend /opt/laastutabloo/backend
COPY config /opt/laastutabloo/config
WORKDIR /opt/laastutabloo/backend/datastore

RUN python3 setup.py develop

#ENTRYPOINT [ "python3" ]

CMD [ "datastore" ]
