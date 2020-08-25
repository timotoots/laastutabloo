FROM ubuntu:18.04
MAINTAINER Tanel Karindi mou@mou.ee

RUN apt-get update -y && \
    apt-get install -y python3-pip git python3-psycopg2 libmysqlclient-dev python3-numpy wget


RUN git clone https://github.com/fliot/ScrapyKeeper.git
#RUN git clone https://github.com/c-lorand/ScrapyKeeper.git

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone


COPY init_scrapykeeper.sh /init_scrapykeeper.sh
WORKDIR ScrapyKeeper
#RUN  grep -vE "(PyMySQL|mysqlclient)" requirements.txt > req-without-mysql.txt

RUN pip3 install -r requirements.txt
RUN pip3 install .
#COPY backend /opt/laastutabloo/backend
#COPY config /opt/laastutabloo/config
#WORKDIR /opt/laastutabloo/backend/

#RUN python3 setup.py install

#ENTRYPOINT [ "python3" ]

EXPOSE 5050

ENV RUNS_IN_CLOUD 0
# docker-compose run --service-ports scrapykeeper /bin/bash
# scrapykeeper --port 5050 --server http://scrapyd:6800

COPY run_scrapykeeper.sh /run_scrapykeeper.sh
CMD [ "/run_scrapykeeper.sh" ]













