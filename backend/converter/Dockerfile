FROM ubuntu:20.04
MAINTAINER Tanel Karindi

ENV TZ=Europe/Tallinn
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN set -xe \
    && apt-get update \
    && apt-get install -y python3-scrapy python3-setuptools python3-psycopg2 python3-pip python3-ijson python3-cffi libyajl2


COPY . /opt/laastutabloo/backend/converter

WORKDIR /opt/laastutabloo/backend/converter

RUN pip3 install -r requirements.txt

RUN python3 setup.py develop



# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1


COPY scrapyd.conf /etc/scrapyd/

EXPOSE 6800
CMD ["scrapyd", "--pidfile="]
