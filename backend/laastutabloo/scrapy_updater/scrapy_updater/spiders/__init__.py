# This package will contain the spiders of your Scrapy project
#
# Please refer to the documentation for information on how to create and manage
# your spiders.

import zipfile, os, json
from shutil import fnmatch
import scrapy, pytz
from datetime import datetime, timedelta
from dateutil.parser import parse as parsedate
from w3lib.http import basic_auth_header


from scrapy.spidermiddlewares.httperror import HttpError
from twisted.internet.error import DNSLookupError
from twisted.internet.error import TimeoutError, TCPTimedOutError
from twisted.internet import reactor


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

import logging, logging.handlers

class DatasetItem(scrapy.Item):
  dataset = scrapy.Field()
  engine = scrapy.Field()
  downloaded_files = scrapy.Field()

class DownloadingSpider(scrapy.Spider):
  name = "downloader"

  def start_requests(self):
    dataset_id = getattr(self, 'dataset', '')
    convert_only = getattr(self, 'convert_only', False)
    if dataset_id:
      self.clean_log = logging.getLogger("spider_cleanlog")
      flogger = logging.handlers.RotatingFileHandler(filename = "/opt/laastutabloo/backend/data/logs/" + dataset_id, mode='a', maxBytes=1024*1024)

      flogger.setFormatter(logging.Formatter("%(asctime)s|{}|%(levelname)s|%(message)s".format(os.getpid())))
      self.clean_log.addHandler(flogger)

      logging.getLogger("converter").addHandler(flogger) 
      datasets = session.query(Dataset).filter_by(id=dataset_id)
    else:
      datasets = session.query(Dataset).all()
    for ds in datasets:

      if getattr(ds, 'timeout_min', None):
        task_timeout = ds.timeout_min * 60
      else:
        timeout_map = json.load(open("/opt/laastutabloo/config/timeout_conf.json"))[0]
        task_timeout = timeout_map.get(ds.update_frequency, None)
        if task_timeout is None:
          task_timeout = timeout_map.get('default', 10)
      self.task = reactor.callLater(task_timeout, self.crawler.engine.close_spider, self, reason='spider_timeout')
      self.clean_log.info("Timeout set to {} min.".format(task_timeout))
        
      
      if convert_only:
        self.clean_log.info("Skipping download.")
        yield scrapy.Request(url="http://0.0.0.0", meta={'dataset' : ds}, callback=self.start_converter_hack_callback)
        return

      if ds.status_updater and (ds.status_updater != 'done' and ds.status_updater != 'failed') or (ds.status_updater == 'done' and ds.status_converter == 'running'):
        self.clean_log.error("Already running. Not starting.")
        return

      self.clean_log.info("Starting check")

      try:
        self._headers = ds.http_header if ds.http_header else {}
        if ds.username and ds.password:
          self._headers[b'Authorization'] = basic_auth_header(ds.username, ds.password)
        yield scrapy.Request(url=ds.url, method="HEAD", callback=self.check, errback=self.request_failed,
                             headers=self._headers, meta={'dataset' : ds})
      except BaseException as ex:
        self.clean_log.error("Check failed: {}".format(ex))

  def start_converter_hack_callback(self, response):
    dataset = response.meta['dataset']
    for item in self.start_converter(dataset):
      yield item

  def request_failed(self, failure):

    if failure.check(HttpError):
      # these exceptions come from HttpError spider middleware
      # you can get the non-200 response
      response = failure.value.response
      self.clean_log.error('HttpError on {}: {}'.format(response.url, response.status))
    elif failure.check(DNSLookupError):
      # this is the original request
      request = failure.request
      self.clean_log.error('DNSLookupError on {}'.format(request.url))
    elif failure.check(TimeoutError, TCPTimedOutError):
      request = failure.request
      self.clean_log.error('TimeoutError on {}'.format(request.url))
    else:
      self.clean_log.info(repr(failure))
    ds = failure.request.meta['dataset']
    ds.status_updater = 'failed'
    session.commit()


  def check(self, response):
    dataset = response.meta['dataset']
        
    db_last_mod = dataset.last_updated
    last_modified = response.headers.get('Last-Modified')
    remote_hash = response.headers.get('ETag')
    if remote_hash:
      remote_hash = remote_hash.decode()
      if remote_hash == dataset.remote_hash:
          self.clean_log.info("Skipping download because dataset not modified (etag).")
          dataset.status_updater = 'done'
          session.add(dataset)
          session.commit()
          return
      dataset.remote_hash = remote_hash
    # Check if its time to update.
    # update = True

    if last_modified:
      last_modified = parsedate(last_modified, ignoretz=True)
      try:
        if db_last_mod and last_modified < db_last_mod:
          self.clean_log.info("Skipping download because dataset not modified.")
          dataset.status_updater = 'done'
          dataset.remote_updated = last_modified
          session.add(dataset)
          session.commit()
          return
      except Exception:
        pass
    # update_interval = dataset.update_frequency
    # self.log("Updating dataset: " + dataset.id)
    # self.log("Last modified: " + str(db_last_mod))

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
    # print("Should we update? " + str(update))

    # if update:
    filename = RAW_FILE_PATH + dataset.id + '.' + dataset.type
    dataset.status_updater = 'downloading'
    session.add(dataset)
    try:
      session.commit()
      self.clean_log.info('Saved dataset')
    except BaseException as e:
      session.rollback()
      self.clean_log('Saving dataset {} failed'.format(dataset.id))
      
    yield scrapy.Request(url=dataset.url, callback=self.save_result, errback=self.request_failed,
                         headers=self._headers, meta={'filename' : filename, 'dataset' : dataset})
    
  def extract_from_zip(self, filename, dataset):
    try:
      zip_file = zipfile.ZipFile(filename)
    except zipfile.BadZipfile:
      self.clean_log.info("Failed to extract from file: {}".format(filename))
      return
    extracted_files = []
    for fn in  zip_file.namelist():
      if fnmatch.fnmatch(fn, dataset.file_in_package):
        filename = RAW_FILE_PATH + dataset.id + '.' + fn
        with open(filename, 'wb') as f:
          f.write(zip_file.read(fn))
        extracted_files.append(filename)
        self.clean_log.info("Extracted file: {}".format(filename))
    return extracted_files
    
    
  def save_result(self, response):
    filename = response.meta['filename']
    ds = response.meta['dataset']
    
    with open(filename, 'wb') as f:
      f.write(response.body)

    self.clean_log.info('Saved file %s' % filename)

    ds.last_updated = datetime.utcnow()#.replace(tzinfo=None)
    if ds.file_in_package:
      ds.dataset_files = ",".join(self.extract_from_zip(filename, ds))
    else:
      ds.dataset_files = filename

    self.clean_log.info('Dataset downloaded.')
    for item in self.start_converter(ds):
      yield item


  def start_converter(self, ds):
    ds.status_updater = 'converting'
    ds.status_converter = 'running'

    try:
      session.commit()
      item = DatasetItem()
      item['dataset'] = ds
      item['engine'] = engine
      item['downloaded_files'] = ds.dataset_files      
      self.clean_log.info('Converter started.')
      yield item
      ds.status_updater = 'done'
      ds.status_converter = 'done'
    except BaseException as e:
      session.rollback()
      ds.status_converter = 'failed'
      self.clean_log.info('Saving dataset failed')
      self.clean_log.debug("Saving dataset failed: {}".format(e))
    finally:
      session.commit()

      
