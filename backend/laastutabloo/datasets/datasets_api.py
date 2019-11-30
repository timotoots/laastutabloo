from flask import Flask, request, jsonify, Response, json
from flask_cors import CORS, cross_origin
import psycopg2
import json, requests, urllib

# Initialize the Flask application
app = Flask(__name__)
app.config["RESTFUL_JSON"] = {}
app.config["RESTFUL_JSON"]["cls"] = app.json_encoder 

CORS(app, support_credentials=True)

from flask_restful import Resource
from flask_restful_swagger_2 import Api, swagger, Schema
api = Api(app, api_version='0.1')

SCRAPYKEEPER_API_URL = "http://admin:admin@laastutabloo.erm.ee:5001/api/projects/1/jobs"
SCRAPYKEEPER_API_SPIDER_URL = "http://admin:admin@laastutabloo.erm.ee:5001/api/projects/1/spiders/1"
SCRAPYKEEPER_FRONTEND_URL = "http://admin:admin@laastutabloo.erm.ee:5001/project/1/job/"

from beautifultable import BeautifulTable

from sqlalchemy import create_engine
engine = create_engine("postgresql://datastore_default:laastu123@localhost/laastutabloo")

from sqlalchemy.ext.automap import automap_base
from sqlalchemy.ext.declarative import declarative_base                                                                             
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import Integer, ForeignKey, String, Column, Date, Text, Table, JSON
from sqlalchemy import MetaData
import sqlalchemy.exc
import uuid, datetime
import csv

import geojson

from sqlalchemy.dialects import postgresql
from laastutabloo.functions import get_wms_url, wms_get_capabilities

metadata = MetaData()
metadata.reflect(engine, only=['datasets2', 'providers'])

Base = automap_base(metadata=metadata)
DecBase = declarative_base()

Base.prepare(engine)

Dataset = Base.classes.datasets2
Provider = Base.classes.providers


Session = sessionmaker(bind=engine)                                                                                                    
session = Session()      



def sqlrow_as_dict(row):
  return {c.name: getattr(row, c.name) for c in row.__table__.columns}
   
@app.route('/list_datasets')
@cross_origin(supports_credentials=True)
def list_datasets():
  return jsonify([ sqlrow_as_dict(r) for r in session.query(Dataset).all() ])


@app.route('/list_providers')
@cross_origin(supports_credentials=True)
def list_providers():
    return jsonify([ sqlrow_as_dict(r) for r in session.query(Provider).all() ])

class DatasetSchema(Schema):
    type = 'object'
    properties = {
        'provider': {
            'type': 'string'
        }
    }


class DatasetsResource(Resource):
    @swagger.doc({
        'tags': ['datasets'],
        'description': "All defined datasets.",
        'responses': {
            '200': {
                'description': 'Dataset in JSON',
                'schema': DatasetSchema,
                'examples': {
                    'application/json': {
                        'id': "basseinid",
                    }
                }       
            }
        },
        })
    def get(self):
        return [ sqlrow_as_dict(r) for r in session.query(Dataset).order_by(Dataset.provider, Dataset.id) ], 200

class DatasetResource(Resource):
    @swagger.doc({
        'tags': ['datasets'],
        'description': "Dataset",
        'parameters':[
            {
                "name": "dataset_id",
                "description": "Dataset id",
                'in': 'path',
                'type': 'string',
            },
            {
                "name": "devel",
                "description": "Select devel or live dataset",
                'in': 'query',
                'type': 'bool',
            }
            
          ],
        'responses': {
            '200': {
                'description': 'User',
                'schema': DatasetSchema,
                'examples': {
                    'application/json': {
                        'id': "basseinid",
                    }
                }       
            }
        },
        })
    def get(self, dataset_id):
        devel = request.args.get('devel', False)
        return sqlrow_as_dict(session.query(Dataset).filter_by(id=dataset_id, devel=devel).first()), 200

    @swagger.doc({
        'tags': ['datasets'],
        'description': "POST Dataset",
        'consumes': ['application/json'],
        'parameters':[
            {
                "name": "dataset_id",
                "description": "Dataset id",
                'in': 'path',
                'type': 'string',
            },
            {
                "name": "json",
                "description": "Dataset metadata",
                'in': 'body',
                'schema': { 'type': 'object', 'properties': [ {'json': {'type': 'json'} } ]},
                'type': 'string',
            }
            
          ],
        'responses': {
            '200': {
                'description': 'Dataset',
                'schema': DatasetSchema,
                'examples': {
                    'application/json': {
                        'id': "basseinid",
                    }
                }       
            }
        },
        })
    @cross_origin(supports_credentials=True)
    def post(self, dataset_id):
      if not request.json:
        return jsonify({'error': "No JSON received."})
      devel = request.json.get('devel', False)
      return jsonify(DatasetResource._sync_with_scrapykeeper(dataset_id, devel, request.json))
        
    @staticmethod
    def _sync_with_scrapykeeper(dataset_id, devel, update_json):
      ds = session.query(Dataset).filter_by(id=dataset_id, devel=devel).first()
      if not ds:
        ds = Dataset(id=dataset_id, devel=devel)
      for k, v in update_json.items():
        setattr(ds, k, v)
      session.add(ds)
      try:
        session.commit()
      except:    
        session.rollback()
        return False

      jobs = json.loads(requests.get(SCRAPYKEEPER_API_URL).text)
      job_id = None
      for j in jobs:
        if j['desc'] == ds.id:
          job_id = j['job_instance_id']

      enabled = 0
      cron_day_of_week = ds.cron_day_of_week
      cron_day_of_month = ds.cron_day_of_month
      try:
        cron_minutes = int(float(ds.cron_minutes))
      except:
        cron_minutes = "*"               
      try:
        cron_hour = int(float(ds.cron_hour))
      except:
        cron_hour = "*" 

      cron_month = ds.cron_month

      if ds.update_frequency == 'manual':
        enabled = -1

      if ds.update_frequency == 'weekly':
        cron_day_of_week = 1
        cron_hour = 0
        cron_minutes = 0

      if ds.update_frequency == 'monthly':
        cron_day_of_month = 1
        cron_hour = 0
        cron_minutes = 0
             
      if ds.update_frequency == 'daily':
        cron_hour = 1
        cron_minutes = 0

      if ds.update_frequency == 'yearly':
        cron_month = 1
        cron_day_of_month = 1
        cron_hour = 0
        cron_minutes = 0
        

      if not job_id:
        # create new job
        requests.post(SCRAPYKEEPER_API_URL, {'spider_name':'downloader', 'spider_arguments': 'dataset='+ds.id,
                                             'run_type': 'periodic', 'cron_minutes': cron_minutes,
                                             'cron_hour': cron_hour, 'cron_day_of_month': cron_day_of_month,
                                             'cron_day_of_week': cron_day_of_week, 'cron_month': cron_month,
                                             'desc': ds.id, 'enabled': enabled})
        jobs = json.loads(requests.get(SCRAPYKEEPER_API_URL).text)
        job_id = None
        for j in jobs:
          if j['desc'] == ds.id:
            job_id = j['job_instance_id']
        if enabled == -1:
          requests.put(SCRAPYKEEPER_API_URL + "/" + str(job_id), {'enabled': enabled})

      else:
          # update job
          requests.put(SCRAPYKEEPER_API_URL + "/" + str(job_id), {'cron_minutes': cron_minutes, 'cron_hour': cron_hour,
                                                     'cron_day_of_month': cron_day_of_month,
                                                     'cron_day_of_week': cron_day_of_week, 'cron_month': cron_month,
                                                     'enabled':enabled })
      # if not ds.last_updated or ds.last_updated.year == 1970:
          # run job
          # requests.put(API_URL + "/" + str(job_id), data={ 'status': 'run',})
      return True

    @staticmethod
    def _copy_schema_from_parent(dataset_id):
      ds = session.query(Dataset).filter_by(id=dataset_id).first()
      parents = session.query(Dataset).filter(Dataset.id.in_(ds.tables)).all()
      schema = {}
      if ds.tables_join_key:
        for p in parents:
          for c in p.schema:
            schema[p.id + "." + c['column']] = c
            c['column'] = p.id + "." + c['column']
      else:
        for p in parents:
          for c in p.schema:
            schema[c['column']] = c
      ds.schema = [*schema.values()]
      session.add(ds)
      session.commit()
      
      
    
api.add_resource(DatasetsResource, '/datasets')
api.add_resource(DatasetResource, '/dataset/<string:dataset_id>')

@app.route('/reload_datasets')
@cross_origin(supports_credentials=True)
def reload_dataset():
    from dataset_json_to_db_loader import load_to_db
    load_to_db()
    return 


@app.route('/reload_queries')
@cross_origin(supports_credentials=True)
def reload_queries():
  from .load_queries_from_json import load_queries
  load_queries()
  return jsonify(True)

  
@app.route('/update_dataset')
@cross_origin(supports_credentials=True)
def update_dataset():
    id = request.args.get('id', "basseinid") 
    ds = session.query(Dataset).filter_by(id=id).first()
    return 


@app.route('/get_wms_url')
@cross_origin(supports_credentials=True)
def call_get_wml_url():
    wms_url = request.args.get('wms_url', "www.ee") 
    service = request.args.get('service', "wms") 
    layer = request.args.get('layer', "test") 
    count = int(request.args.get('count', 0))
    
    return jsonify(get_wms_url(wms_url, service, layer, count))




@app.route('/wms_get_capabilities')
@cross_origin(supports_credentials=True)
def call_wms_get_capabilities():
    url = request.args.get('url') 
    service = request.args.get('service')
    resp = Response(wms_get_capabilities(url, service))
    resp.headers['Content-Type'] = 'application/json'
    return resp





@app.route('/run_updater')
@cross_origin(supports_credentials=True)
def run_updater():
  dataset_id = request.args.get('dataset_id')
  convert_only = request.args.get('convert_only')
  if not dataset_id:
    return jsonify({"error" : "Need parameter dataset_id."})

  ds = session.query(Dataset).filter_by(id=dataset_id).first()
  if not ds:
    return jsonify({"error" : "No such dataset {}.".format(dataset_id)})

  if not convert_only:
    jobs = json.loads(requests.get(SCRAPYKEEPER_API_URL).text)
    job_id = None
    for j in jobs:
      if j['desc'] == ds.id:
        job_id = j['job_instance_id']
    if job_id:
      url = SCRAPYKEEPER_FRONTEND_URL + str(job_id) + "/run"
      requests.get(url)
      return jsonify(True)
  else:
    resp = requests.put(SCRAPYKEEPER_API_SPIDER_URL, data={'spider_arguments': 'dataset={},convert_only=1'.format(dataset_id)})
    return jsonify(True)




@app.route('/get_log')
@cross_origin(supports_credentials=True)
def get_log():
  dataset_id = request.args.get('dataset_id')
  if dataset_id:
    filename = "/opt/laastutabloo/backend/data/logs/" + dataset_id
    try:
      loglines = open(filename).readlines()
    except:
      return jsonify({"error": "No log for {}.".format(dataset_id)})
    
    log = []
    for l in loglines:
      parts = l.split("|")
      try:
        log.append({'time': parts[0], 'pid': parts[1], 'level':parts[2], 'message': parts[3].strip()})
      except:
        log.append({'message': l})
    return jsonify(log)
  else:
    return jsonify({"error" : "Need parameter dataset_id."})




@app.route('/dataset_preview')
@cross_origin(supports_credentials=True)
def dataset_preview():
  dataset_id = request.args.get('dataset_id')
  limit = request.args.get('limit', 10)
  if not dataset_id:
    return jsonify({"error" : "Need parameter dataset_id."})

  ds = session.query(Dataset).filter_by(id=dataset_id).first()
  try:
    res = session.execute("SELECT * FROM {} ORDER BY ctid ASC LIMIT {}".format(ds.id, int(limit)))
  except:
    session.rollback()
    return jsonify(False)
  return jsonify([ dict(r.items()) for r in res.fetchall()])




def index():

    """
    Initialize the dropdown menues
    """

    class_entry_relations = get_dropdown_values()

    default_classes = sorted(class_entry_relations.keys())
    default_values = class_entry_relations[default_classes[0]]
    
    fieldValues = get_field_values()
    #get actual scripts
    scripts = ['placeholder1', 'placeholder2']
    #get actual translations
    translations = ['translation1', 'translation2']




## From querybuilder
class Translations:
    def __init__(self, translation_file):
        r = csv.reader(open(translation_file))
        header = next(r)
        lang_num = len(header)
        self.translations = {}
        for lang in header:
            self.translations[lang] = {}
        for l in r:
            for i in range(lang_num):
                self.translations[header[i]][l[0]] = l[i]
        self.all_langs = header
        self.active_lang = header[0]

    def setlocale(self, lang):
        if not lang in self.all_langs:
            raise "Language not found: {}".format(lang)
        self.active_lang = lang
                
    def _(self, s, lang=None):
        if lang is not None:
            return self.translations[lang][s]
        else:
            return self.translations[self.active_lang][s]


ehak_type_trans = Translations("/opt/laastutabloo/frontend/uploads/translation.csv")

        
class PreparedStatement(DecBase):
  __tablename__ = "prepared_statements"
  id = Column(Integer, primary_key=True)
  query_id = Column(String(100)) 
  dataset_id = Column(String(100)) 
  devel = Column(Integer)
  statement = Column(Text) 
  parameter_types = Column(Text)
  meta = Column(JSON)
  name = Column(JSON)
  style = Column(JSON)
  columns = Column(JSON)
  where = Column(Text)

  def _get_sql(self):
    if self.statement:
      return self.statement
    else:
      sql = self._construct_sql()
      print(sql)
      return sql
    
  def _construct_sql(self):
    dataset = session.query(Dataset).filter_by(id=self.dataset_id).first()
    if not dataset:
      return False
    has_point = False
    has_ehak = False

    for c in dataset.schema:
      if c['column'] == 'point' and c['type'] == 'geom':
        has_point = True
      if c['column'] == 'ehak':
        has_ehak = True

    #print("ehak {} point {}".format(has_ehak, has_point))

    ## select liiginimi_et from loodusvaatlused_2019 inner join ehak ON ST_Contains(ehak.geom, loodusvaatlused_2019.point) WHERE akood::integer=6455 LIMIT 10;

    sql_template = "SELECT {columns} FROM {table} WHERE {where_clause} ORDER BY {order_clause} LIMIT {limit}"
    columns = []

    # collect all columns with set order_order to a dict, columns without order got to bucket under -1
    order_columns = {-1: []}
    sort_orders = {}
    where_columns = []
    for c in self.columns:
      columns.append(c['name'])
      order_num = c.get('order_order', -1)
      if order_num == -1:
        order_columns[order_num].append(c['name'])
      else:
        order_columns[order_num] = c['name']
      sort_orders[c['name']] = c.get('sort_order', 'DESC')

    flat_order_columns = [ v for k,v in order_columns.items() if k != -1]
    for c in order_columns[-1]:
      flat_order_columns.append(c)
    order_columns = flat_order_columns
    
    if self.where:
      where_columns.append(self.where)

    table_clause = self.dataset_id    
    if has_ehak and not has_point:
      where_columns.append("ehak::integer = $1")
    elif has_point:
      table_clause = "{table} LEFT JOIN ehak ON ST_Contains(ehak.geom, {table}.point)".format(table=self.dataset_id)
      columns.append("ST_AsGeoJSON(point) as point")
      where_columns.append("ehak.akood::integer = $1::integer")

    where_clause = " AND ".join(where_columns)

    order_clause = ",".join(order_columns)
    limit = self.style['num_of_pages'] * 10
    return sql_template.format(columns = ",".join(columns),
                               table = table_clause,
                               where_clause = " and ".join(where_columns),
                               order_clause = order_clause,
                               limit=limit)

class QuerySchema(Schema):
    type = 'object'
    properties = {
        'provider': {
            'type': 'string'
        }
    }

class QueriesResource(Resource):
    @swagger.doc({
        'tags': ['queries'],
        'description': "All defined queries.",
        'responses': {
            '200': {
                'description': 'Dataset in JSON',
                'schema': DatasetSchema,
                'examples': {
                    'application/json': {
                        'id': "basseinid",
                    }
                }       
            }
        },
        })
    def get(self):
      return list_queries()
      return [ sqlrow_as_dict(r) for r in session.query(Dataset).all() ], 200

    
class QueryResource(Resource):
    @swagger.doc({
        'tags': ['queries'],
        'description': "Query",
        'parameters':[
            {
                "name": "query_id",
                "description": "Query id",
                'in': 'path',
                'type': 'string',
            },
            {
                "name": "devel",
                "description": "Select devel or live query status",
                'in': 'query',
                'type': 'bool',
            }
            
          ],
        'responses': {
            '200': {
                'description': 'Query',
                'schema': QuerySchema,
                'examples': {
                    'application/json': {
                        'id': "basseinid",
                    }
                }       
            }
        },
        })
    def get(self, query_id):
        devel = request.args.get('devel', 0)
        return sqlrow_as_dict(session.query(PreparedStatement).filter_by(query_id=query_id, devel=devel).first()), 200

    @swagger.doc({
        'tags': ['queries'],
        'description': "POST Query",
        'consumes': ['application/json'],
        'parameters':[
            {
                "name": "query_id",
                "description": "Query id",
                'in': 'path',
                'type': 'string',
            },
            {
                "name": "json",
                "description": "Query metadata",
                'in': 'body',
                'schema': { 'type': 'object', 'properties': [ {'json': {'type': 'json'} } ]},
                'type': 'string',
            }
            
          ],
        'responses': {
            '200': {
                'description': 'Query',
                'schema': QuerySchema,
                'examples': {
                    'application/json': {
                        'id': "basseinid",
                    }
                }       
            }
        },
        })
    @cross_origin(supports_credentials=True)
    def post(self, query_id):
      devel = request.json.get('devel', 0)
      delete_statement = None
      q = session.query(PreparedStatement).filter_by(query_id=query_id, devel=1).first()
      if q:
          # we are going to live
          if not devel:
              q_live = session.query(PreparedStatement).filter_by(query_id=query_id, devel=0).first()
              if q_live:
                  delete_statement = q
                  q = q_live 
      else:
          q = session.query(PreparedStatement).filter_by(query_id=query_id, devel=devel).first()
          if not q:
              q = PreparedStatement()
      for k, v in request.json.items():
        setattr(q, k, v)
      q.query_id = query_id
      q.devel = devel
      q.parameter_types = request.json.get('parameter_types', 'integer')

      session.add(q)
      try:
        session.commit()
        try:
          clean_and_prepare_all()
        except sqlalchemy.exc.DBAPIError as e:
          return jsonify({"error" : str(e)})
      except:
        session.rollback()
      return jsonify(True)
        
  
api.add_resource(QueriesResource, '/list_queries')
api.add_resource(QueryResource, '/query/<string:query_id>')

class TemplateColumn(DecBase):
    __tablename__ = "template_column"
    id = Column(Integer, primary_key=True)
    width = Column(Integer)
    align = Column(Text)
    wrap = Column(Text)
    name = Column(Text)
    fill_char = Column(Text)
    prefix = Column(Text)
    suffix = Column(Text)

    def get_text(self, values):
        if self.fill_char:
            return self.fill_char * self.width
        v = str(values.get(self.name))
        return self.prefix + v + self.suffix
    
    
association_table = Table('association', DecBase.metadata,
    Column('template_column_id', Integer, ForeignKey('template_column.id')),
    Column('template_row_id', Integer, ForeignKey('template_row.id'))
)

wrap_mode_map = {'truncate' : BeautifulTable.WEP_STRIP,
                 'wrap' : BeautifulTable.WEP_WRAP, }

align_map = {'left': BeautifulTable.ALIGN_LEFT,
             'right': BeautifulTable.ALIGN_RIGHT,
             'center': BeautifulTable.ALIGN_CENTER,
}

class TemplateRow(DecBase):
    __tablename__ = "template_row"
    id = Column(Integer, primary_key=True)
    columns = relationship("TemplateColumn", secondary=association_table)
    subtemplate_id = Column(Integer, ForeignKey('subtemplate.id'))
    subtemplate = relationship("SubTemplate", back_populates='rows')
    how_many = Column(Integer)

    def get_columns(self):
        columns = []
        for col in self.columns:
            wrap = wrap_mode_map['truncate']
            if col.wrap:
                wrap = wrap_mode_map[col.wrap]
            align = align_map['left']

            if col.align:
                align = align_map[col.align]
            print(col.name)
            columns.append({'name': col.name, 'width': col.width, 'wrap': wrap, 'align': align})
        return columns

    
    def get_values(self, values):
        row_values = []
        for col in self.columns:
            try:
                row_values.append(col.get_text(values))
            except AttributeError:
                import pdb; pdb.set_trace()
        return row_values

    
    
class SubTemplate(DecBase):
    __tablename__ = "subtemplate"
    id = Column(Integer, primary_key=True)
    name = Column(Text)
    rows = relationship("TemplateRow", back_populates='subtemplate')
    template_id = Column(Integer, ForeignKey('slide_template.id'))
    template = relationship("SlideTemplate", back_populates="subtemplates")

    def render(self, values, meta, page_num):
        print("RENDER", self.name)
        text_rows = []

        header_table = BeautifulTable(max_width=27, default_padding=0)
        header_table.set_style(BeautifulTable.STYLE_NONE)
        header_table.column_headers = [ "" ]
        header_table.column_alignments[0] = align_map['center']
        header_table.append_row( (meta['ehak'], ) )
        header_table.append_row( (meta['query_id'], ) )
        header_table.append_row( ("*" * 27, ) )
        
        for row in self.rows:
            row_count = 1
            if row.how_many and row.how_many > 1:
                row_count = row_many
            else:
                row_count = 9
            
            table = BeautifulTable(max_width=27, default_padding=0)
            columns = row.get_columns()
            table.column_headers = [ col['name'] for col in columns ]
            table.set_style(BeautifulTable.STYLE_NONE)
            for col in columns:
                table.column_alignments[col['name']] = col['align']
                table.column_widths = [ col['width'] for col in columns ]

            start = row_count * page_num
            page_values = values[start:start+row_count]
            for i in range(min(row_count, len(page_values))):
                if self.name != 'header':                    
                    row_values = row.get_values(page_values[i])
                    table.append_row(row_values)
            table.column_headers = [""] * len(columns)

            st = table.get_string(recalculate_width=False)
            text_rows.append(st)
            header_table.append_row(text_rows)
            st = header_table.get_string()
            print(st)
            return st

                    
        return text_rows
    
class SlideTemplate(DecBase):
    __tablename__ = "slide_template"    
    id = Column(Integer, primary_key=True)
    name = Column(Text)
    meta = Column(Text)
    subtemplates = relationship("SubTemplate", back_populates="template")
    

class QuerySlide(DecBase):
    __tablename__ = "query_slide"
    id = Column(Integer, primary_key=True)
    template_id = Column(Integer, ForeignKey('slide_template.id'))
    template = relationship("SlideTemplate")
    query = Column(Integer, ForeignKey('prepared_statements.id'))
    pages_num = Column(Integer)


# @app.route('/list_queries')
# @cross_origin(supports_credentials=True)
def list_queries():
    return jsonify([ {"query_id": r.query_id, "sql": r.statement, "devel": bool(r.devel),
                      "style": r.style, "columns": r.columns,
                      "dataset_id": r.dataset_id, "where": r.where, "name": r.name} for r in session.query(PreparedStatement).all() ])

@app.route('/list_query2')
@cross_origin(supports_credentials=True)
def list_query2():
    return jsonify(list(engine.execute("SELECT * FROM pg_prepared_statements")))






@app.route('/file_preview')
@cross_origin(supports_credentials=True)
def file_preview():
  url = request.args.get('url')
  if url:
    url = urllib.parse.unquote(url.decode("utf8"))
    body_trim_len = urllib.parse.unquote(request.args.get('trim').decode("utf8"))
    r = requests.get(url)
    resp = Response(r.text)
    resp.headers['Content-Type'] = r.headers['Content-Type']
    return resp
  dataset_id = request.args.get('dataset_id')
  limit = request.args.get('limit', 500000)
  if dataset_id:
    pass


def prepare_statement(s, raise_exc=False):
    print(s.query_id, s.devel)
    try:
        print("PREPARE %s_%d (%s) AS %s;" % (s.query_id, s.devel, s.parameter_types, s._get_sql()))
        engine.execute("PREPARE %s_%d (%s) AS %s;" % (s.query_id, s.devel, s.parameter_types, s._get_sql()))
    except:
        print("PREPARE %s_%d (%s) AS %s;" % (s.query_id, s.devel, s.parameter_types, s._get_sql()))
        if raise_exc:
          raise

def clean_and_prepare_all():
    engine.execute("DEALLOCATE ALL")
    for s in session.query(PreparedStatement).all():
        prepare_statement(s)


@app.route('/save_query')
@cross_origin(supports_credentials=True)
def save_query():
    query_id = request.args.get('query_id', '')
    devel = int(request.args.get('devel', True))
    delete_statement = None
    s = session.query(PreparedStatement).filter_by(query_id=query_id, devel=1).first()
    if s:
        # we are going to live
        if not devel:
            s_live = session.query(PreparedStatement).filter_by(query_id=query_id, devel=0).first()
            if s_live:
                delete_statement = s
                s = s_live 
    else:
        s = session.query(PreparedStatement).filter_by(query_id=query_id, devel=devel).first()
        if not s:
            s = PreparedStatement()
    s.query_id = query_id
    s.statement = request.args.get('query', '')
    s.meta = request.args.get('meta', '')
    s.name = request.args.get('name', '')
    s.style = request.args.get('style', '')
    s.columns = request.args.get('columns', '')
    s.devel = devel
    s.parameter_types = request.args.get('parameter_types', 'integer')
    session.add(s)
    session.commit()
    if delete_statement:
        session.delete(delete_statement)
    try:
        clean_and_prepare_all()
    except sqlalchemy.exc.DBAPIError as e:
        return jsonify({"error" : str(e)})
    
    return jsonify(True)

@app.route('/del_query')
@cross_origin(supports_credentials=True)
def del_query():
    s = session.query(PreparedStatement).filter_by(query_id=request.args.get('query_id', '')).first()
    session.delete(s)
    session.commit()
    return jsonify(True)

@app.route('/run_query')
@cross_origin(supports_credentials=True)
def run_query():
    devel = int(request.args.get('devel', 0))    
    s = session.query(PreparedStatement).filter_by(query_id=request.args.get('query_id', ''), devel=devel).first()
    if not s:
        return jsonify(False)

    val1 = request.args.get('ehak', None)
    val2 = request.args.get('val1', None)
    args = val1
    if val2 is not None:
        args = args + ", " + val2
    query = "EXECUTE %s_%d(%s)" % (s.query_id,  s.devel, args)
    res = engine.execute(query)
    return jsonify([ dict(r.items()) for r in res.fetchall()])

def _run_prepared_statement(prep_statement, devel, ehak, val1=None):
    args = ehak
    if val1 is not None:
        args = args + ", " + val1
    query = "EXECUTE %s_%d(%s)" % (prep_statement.query_id, devel, args)
    print(query)
    try:
      res = engine.execute(query)
    except sqlalchemy.exc.OperationalError:      
      prepare_statement(prep_statement, raise_exc=True)
      res = engine.execute(query)
    return [ dict(r.items()) for r in res.fetchall()]

ehak_type_map = {
    0 : 'maakond',
    1 : 'vald',    
    3 : 'alev',
    4 : 'linn',
    5 : 'linn',
    6 : 'linnaosa',
    7 : 'alevik',
    8 : 'küla',
}
def clean_ehak_name(full_name, ehak_type):
    # handle Väikeheinamaa küla / Lillängin
    full_name = full_name.strip().split("/")[0].strip()
    parts = full_name.split(" ")
    # cut off küla/alev/linnaosa
    if parts[-1] == ehak_type_map[ehak_type]:
        parts = parts[:-1]
    return "".join(parts)
        

@app.route('/render_query')
@cross_origin(supports_credentials=True)
def render_query():
  output = request.args.get('output', False)
  if output == "geojson":
    return run_query_geojson()
  
  devel = int(request.args.get('devel', 0))
  query_id=request.args.get('query_id', '')
  query_ids=request.args.get('query_ids', False)
  s = session.query(PreparedStatement).filter_by(query_id=query_id, devel=devel).first()
  if not s:
      return jsonify({'error': "Query not found."})
  ehak = int(request.args.get('ehak', None))
  if ehak is None:
    return jsonify({'error': "Parameter ehak required."})
  try:
      ehak_name, ehak_type = session.execute("select animi, tyyp from ehak where akood::integer = '{}';".format(ehak)).first()
  except TypeError:
      return jsonify({'msg': 'Cannot find ehak.'})
  val1 = request.args.get('val1', None)

  jt = json.load(open("/opt/laastutabloo/backend/laastutabloo/querybuilder/slide_template.json"))
  jt['district']['id'] = ehak
  jt['district']['name'] = clean_ehak_name(ehak_name, int(ehak_type))
  jt['district']['type'] = dict( [ (l, ehak_type_trans._(ehak_type_map[int(ehak_type)], l)) for l in ehak_type_trans.all_langs  ])
  jt['queries'] = {}

  values = _run_prepared_statement(s, devel, ehak, val1)

  jt['queries'][s.query_id] = {}
  jt['queries'][s.query_id]['data'] = values

  jt['queries'][s.query_id]['config'] = {"style": s.style,
                                         "columns": s.columns,
                                         "name": s.name }


  for p in session.query(QuerySlide).filter_by(query=s.id):
      qdict = {'config' : ['s']}
      for page_num in range(p.pages_num):
          for subtemp in p.template.subtemplates:
              lines = []
              lines.append(subtemp.render(values, {'ehak': jt['district']['id'],
                                                            'query_id': s.query_id}, page_num).split("\n"))
          # qdict['pages'].append(lines[0])
      # jt['queries'][s.query_id] = qdict
  return jsonify(jt)
  # qs = session.query(QuerySlide).filter_by(query_id=s.query_id).first()

    

@app.route('/run_query_geojson')
@cross_origin(supports_credentials=True)
def run_query_geojson():
    devel = int(request.args.get('devel', 0))    

    s = session.query(PreparedStatement).filter_by(query_id=request.args.get('query_id', ''), devel=devel).first()
    if not s:
        return jsonify(False)

    ehak = int(request.args.get('ehak', None))

    if ehak is None:
      return jsonify({'error': "Parameter ehak required."})

    val1 = request.args.get('val1', None)

    values = _run_prepared_statement(s, devel, ehak, val1)



    # create a new list which will store the single GeoJSON features
    featureCollection = list()

    # iterate through the list of result dictionaries
    for row in values:
        # create a single GeoJSON geometry from the geometry column which already contains a GeoJSON string
        geom = geojson.loads(row['point'])

        # remove the geometry field from the current's row's dictionary
        row.pop('point')

        # create a new GeoJSON feature and pass the geometry columns as well as all remaining attributes which are stored in the row dictionary
        feature = geojson.Feature(geometry=geom, properties=row)
        
        # append the current feature to the list of all features
        featureCollection.append(feature)

    # when single features for each row from the database table are created, pass the list to the FeatureCollection constructor which will merge them together into one object
    featureCollection = geojson.FeatureCollection(featureCollection)
    GeoJSONFeatureCollectionAsString = geojson.dumps(featureCollection)
    resp = Response(GeoJSONFeatureCollectionAsString)
    resp.headers['Content-Type'] = 'application/json;type=geojson'
    return resp


def index():

    """
    Initialize the dropdown menues
    """

    class_entry_relations = get_dropdown_values()

    default_classes = sorted(class_entry_relations.keys())
    default_values = class_entry_relations[default_classes[0]]
    
    fieldValues = get_field_values()
    #get actual scripts
    scripts = ['placeholder1', 'placeholder2']
    #get actual translations
    translations = ['translation1', 'translation2']


DecBase.metadata.create_all(engine)

if __name__ == '__main__':
  execute_from_command_line()
  
def execute_from_command_line():
  clean_and_prepare_all()
  app.run(debug=True, host='0.0.0.0')
