FROM vimagick/scrapyd
COPY . scrapy_updater
WORKDIR scrapy_updater

RUN apt-get update -y && \
    apt-get install -y python-psycopg2

RUN pip install -r requirements.txt
RUN python setup.py install
