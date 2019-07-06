from flask import Flask, request, jsonify, Response, json
from flask_cors import CORS, cross_origin
import psycopg2
import json, requests, urllib2

# Initialize the Flask application
app = Flask(__name__)
app.config["RESTFUL_JSON"] = {}
app.config["RESTFUL_JSON"]["cls"] = app.json_encoder 

CORS(app, support_credentials=True)

from flask_restful import Resource
from flask_restful_swagger_2 import Api, swagger, Schema
api = Api(app, api_version='0.1')


from sqlalchemy import create_engine
engine = create_engine("postgresql://datastore_default:laastu123@localhost/laastutabloo")

from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import MetaData
import sqlalchemy.exc
import uuid, datetime                                                                                                               

from sqlalchemy.dialects import postgresql
from backend.functions import get_wms_url, wms_get_capabilities

metadata = MetaData()
metadata.reflect(engine, only=['datasets2',])

Base = automap_base(metadata=metadata)                                                                                                           
Base.prepare(engine)

Dataset = Base.classes.datasets2


Session = sessionmaker(bind=engine)                                                                                                    
session = Session()      

def sqlrow_as_dict(row):
       return {c.name: getattr(row, c.name) for c in row.__table__.columns}
   
@app.route('/list_datasets')
@cross_origin(supports_credentials=True)
def list_datasets():
    return jsonify([ sqlrow_as_dict(r) for r in session.query(Dataset).all() ])


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
        return [ sqlrow_as_dict(r) for r in session.query(Dataset).all() ], 200

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
    def post(self, dataset_id):
        devel = request.json.get('devel', False)
        ds = session.query(Dataset).filter_by(id=dataset_id, devel=devel).first()
        for k, v in request.json.items():
            setattr(ds, k, v)
        session.add(ds)
        try:
            session.commit()
        except:
            session.rollback()
        API_URL = "http://admin:admin@laastutabloo.ee:5001/api/projects/1/jobs"
        jobs = json.loads(requests.get(API_URL).text)
        job_id = None
        for j in jobs:
            if j['desc'] == ds.id:
                job_id = j['job_instance_id']

        if not job_id:
            # create new job
            requests.post(API_URL, {'spider_name':'downloader', 'spider_arguments': 'dataset='+ds.id,
                                    'run_type': 'periodic', 'cron_minutes': ds.cron_minutes,
                                    'cron_hour': ds.cron_hour, 'cron_day_of_month': ds.cron_day_of_month,
                                    'cron_day_of_week': ds.cron_day_of_week, 'cron_month': ds.cron_month,
                                    'desc': ds.id})
            jobs = json.loads(requests.get(API_URL).text)
            job_id = None
            for j in jobs:
                if j['desc'] == ds.id:
                    job_id = j['job_instance_id']

        else:
            # update job
            requests.put(API_URL + "/" + str(job_id), {'cron_minutes': ds.cron_minutes, 'cron_hour': ds.cron_hour,
                                                       'cron_day_of_month': ds.cron_day_of_month,
                                                       'cron_day_of_week': ds.cron_day_of_week, 'cron_month': ds.cron_month, })
        if not ds.last_updated or ds.last_updated.year == 1970:
            # run job
            requests.put(API_URL + "/" + str(job_id), data={ 'status': 'run',})
            

    
api.add_resource(DatasetsResource, '/datasets')
api.add_resource(DatasetResource, '/dataset/<string:dataset_id>')

@app.route('/reload_datasets')
@cross_origin(supports_credentials=True)
def reload_dataset():
    from dataset_json_to_db_loader import load_to_db
    load_to_db()
    return 


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



@app.route('/proxy')
@cross_origin(supports_credentials=True)
def proxy():
    url = urllib2.unquote(request.args.get('url').decode("utf8"))
    r = requests.get(url)
    resp = Response(r.text)
    resp.headers['Content-Type'] = r.headers['Content-Type']
    return resp


def prepare_statement(s):
    print(s.query_id)
    engine.execute("PREPARE %s_%d (%s) AS %s;" % (s.query_id, s.test, s.parameter_types, s.statement))


@app.route('/save_query')
@cross_origin(supports_credentials=True)
def save_query():
    query_id = request.args.get('query_id', '')
    test = int(request.args.get('test', True))
    delete_statement = None
    s = session.query(PreparedStatement).filter_by(query_id=query_id, test=1).first()
    if s:
        # we are going to live
        if not test:
            s_live = session.query(PreparedStatement).filter_by(query_id=query_id, test=0).first()
            if s_live:
                delete_statement = s
                s = s_live 
    else:
        s = session.query(PreparedStatement).filter_by(query_id=query_id, test=test).first()
        if not s:
            s = PreparedStatement()
    s.query_id = query_id
    s.statement = request.args.get('query', '')
    s.meta = request.args.get('meta', '')
    s.test = test
    s.parameter_types = request.args.get('parameter_types', 'integer')
    session.add(s)
    session.commit()
    if delete_statement:
        session.delete(delete_statement)
    try:
        clean_and_prepare_all()
    except sqlalchemy.exc.DBAPIError as e:
        return jsonify({"error" : str(e.message)})
    
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
    test = int(request.args.get('test', 0))    
    s = session.query(PreparedStatement).filter_by(query_id=request.args.get('query_id', ''), test=test).first()
    if not s:
        return jsonify(False)

    val1 = request.args.get('val1', None)
    val2 = request.args.get('val2', None)
    args = val1
    if val2 is not None:
        args = args + ", " + val2
    query = "EXECUTE %s_%d(%s)" % (s.query_id,  s.test, args)
    res = engine.execute(query)
    return jsonify([ dict(r.items()) for r in res.fetchall()])

@app.route('/run_query_geojson')
@cross_origin(supports_credentials=True)
def run_query_geojson():
    test = int(request.args.get('test', 0))    
    s = session.query(PreparedStatement).filter_by(query_id=request.args.get('query_id', ''), test=test).first()
    if not s:
        return jsonify(False)

    val1 = request.args.get('val1', None)
    val2 = request.args.get('val2', None)
    args = val1
    if val2 is not None:
        args = args + ", " + val2
    query = "EXECUTE %s_%d(%s)" % (s.query_id,  s.test, args)
    print(query)
    res = engine.execute(query)
    resp = Response(res.first().values()[0])
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



if __name__ == '__main__':
  execute_from_command_line()
  
def execute_from_command_line():
  app.run(debug=True, host='0.0.0.0')
