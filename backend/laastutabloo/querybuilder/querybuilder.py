from flask import Flask, request, jsonify, Response
from flask_cors import CORS, cross_origin
import psycopg2
import json, requests, urllib2

# Initialize the Flask application
app = Flask(__name__)
CORS(app, support_credentials=True)



from sqlalchemy import create_engine
engine = create_engine("postgresql://datastore_default:laastu123@localhost/laastutabloo")

from sqlalchemy.ext.declarative import declarative_base                                                                             
from sqlalchemy.orm import sessionmaker, relationship                                                                               
from sqlalchemy import Integer, ForeignKey, String, Column, Date, Text
import sqlalchemy.exc
import uuid, datetime                                                                                                               

from sqlalchemy.dialects import postgresql
from backend.functions import get_wms_url, wms_get_capabilities

Base = declarative_base()                                                                                                           

class PreparedStatement(Base):
    __tablename__ = "prepared_statements"
    query_id = Column(String(100), primary_key=True) 
    test = Column(Integer, primary_key=True)
    statement = Column(Text) 
    parameter_types = Column(Text)
    meta = Column(Text)
    
Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)                                                                                                    
session = Session()      


@app.route('/list_queries')
@cross_origin(supports_credentials=True)
def list_queries():
    return jsonify([ {"query_id": r.query_id, "statement": r.statement, "test": bool(r.test), "meta": r.meta} for r in session.query(PreparedStatement).all() ])
    return jsonify(session.query(PreparedStatement).all())

@app.route('/list_query2')
@cross_origin(supports_credentials=True)
def list_query2():
    return jsonify(list(engine.execute("SELECT * FROM pg_prepared_statements")))


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

def clean_and_prepare_all():
    engine.execute("DEALLOCATE ALL")
    for s in session.query(PreparedStatement).all():
        prepare_statement(s)

clean_and_prepare_all()

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
    app.run(debug=True, host='0.0.0.0')
