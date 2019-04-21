# This package will contain the spiders of your Scrapy project
#
# Please refer to the documentation for information on how to create and manage
# your spiders.

import scrapy, pytz
from datetime import datetime, timedelta
from dateutil.parser import parse as parsedate

from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import sessionmaker

RAW_FILE_PATH = '/opt/laastutabloo/backend/data/raw/'

engine = create_engine("postgresql://datastore_default:laastu123@localhost/laastutabloo")
metadata = MetaData()
metadata.reflect(engine, only=['datasets2',])

Base = automap_base(metadata=metadata)                                                                                                           
Base.prepare(engine)

Dataset = Base.classes.datasets2

Session = sessionmaker(bind=engine)                                                                                                    
session = Session()

class DownloadingSpider(scrapy.Spider):
  name = "downloader"

  def start_requests(self):
    dataset_id = getattr(self, 'dataset', '')
    if dataset_id:
      datasets = session.query(Dataset).filter_by(id=dataset_id)
    else:
      datasets = session.query(Dataset).all()
    for ds in datasets:
      yield scrapy.Request(url=ds.url, method="HEAD", callback=self.check, meta={'dataset' : ds})

  def check(self, response):
    dataset = response.meta['dataset']

    # http auth
    if dataset.username and dataset.password:
      DownloadingSpider.http_user = dataset.username
      DownloadingSpider.http_password = dataset.password
    
    db_last_mod = dataset.last_updated
    last_modified = response.headers.get('Last-Modified')

    # Check if its time to update.
    update = True

    if last_modified:
      last_modified = parsedate(last_modified, ignoretz=True)
      try:
        if db_last_mod and last_modified < db_last_mod:
          self.log("Skipping " + dataset.id)
          return
      except Exception:
        pass
    update_interval = dataset.update_frequency
    self.log("Updating dataset: " + dataset.id)
    self.log("Last modified: " + str(db_last_mod))

    # if update_interval == "5min":
    #   update = (datetime.now() + timedelta(hours=hours_offset)) >= (last_mod + timedelta(minutes=5))
    # elif update_interval == "hourly":
    #   update = (datetime.now() + timedelta(hours=hours_offset)) >= (last_mod + timedelta(hours=1))
    # elif update_interval == "daily":
    #   update = (datetime.now() + timedelta(hours=hours_offset)) >= (last_mod + timedelta(days=1))
    # elif update_interval == "weekly":
    #   update = (datetime.now() + timedelta(hours=hours_offset)) >= (last_mod + timedelta(days=7))
    # elif update_interval == "monthly":
    #   update = (datetime.now() + timedelta(hours=hours_offset)) >= (last_mod + timedelta(days=30))
    # elif update_interval == "annually":
    #   update = (datetime.now() + timedelta(hours=hours_offset)) >= (last_mod + timedelta(days=365))

    # same = compare_file_to_hash(RAW_FILE_PATH + dataset.id + '.' + dataset.type, dataset.hash)
    # update = update and not same
    print("Should we update? " + str(update))

    if update:
      filename = RAW_FILE_PATH + dataset.id + '.' + dataset.type
      dataset.status_updater = 'running'
      session.add(dataset)
      try:
        session.commit()
        self.log('Saved dataset')
      except BaseException as e:
        session.rollback()
        self.log('Saving dataset {} failed'.format(dataset.id))
      
      yield scrapy.Request(url=dataset.url, callback=self.parse, meta={'filename' : filename, 'dataset' : dataset})
    

  def parse(self, response):
    filename = response.meta['filename']
    with open(filename, 'wb') as f:
      f.write(response.body)
      self.log('Saved file %s' % filename)
      ds = response.meta['dataset']
      ds.last_updated = datetime.now().replace(tzinfo=None)
      ds.status_updater = 'done'
      session.add(ds)
      try:
        session.commit()
        self.log('Saved dataset')
      except BaseException as e:
        session.rollback()
        self.log('Saving dataset {} failed'.format(ds.id))
