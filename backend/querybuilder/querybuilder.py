from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import json

# Initialize the Flask application
app = Flask(__name__)
CORS(app, support_credentials=True)



from sqlalchemy import create_engine
engine = create_engine("postgresql://datastore_default:laastu123@localhost/pg_query")

from sqlalchemy.ext.declarative import declarative_base                                                                             
from sqlalchemy.orm import sessionmaker, relationship                                                                               
from sqlalchemy import Integer, ForeignKey, String, Column, Date                                                                    
import uuid, datetime                                                                                                               

from sqlalchemy.dialects import postgresql

Base = declarative_base()                                                                                                           

class PreparedStatement(Base):
    __tablename__ = "prepared_statements"
    name = Column(String(50), primary_key=True) 
    admin = Column(Integer, primary_key=True)
    statement = Column(String(2048)) 
    parameter_types = Column(String(128))

Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)                                                                                                    
session = Session()      


@app.route('/list_query')
@cross_origin(supports_credentials=True)
def list_query():
    return jsonify([ {"name": r.name, "statement": r.statement, "admin": bool(r.admin)} for r in session.query(PreparedStatement).all() ])
    return jsonify(session.query(PreparedStatement).all())

@app.route('/list_query2')
@cross_origin(supports_credentials=True)
def list_query2():
    return jsonify(list(engine.execute("SELECT * FROM pg_prepared_statements")))


def prepare_statement(s):
    engine.execute("PREPARE %s_%d (%s) AS %s;" % (s.name, s.admin, s.parameter_types, s.statement))

def clean_and_prepare_all():
    engine.execute("DEALLOCATE ALL")
    for s in session.query(PreparedStatement).all():
        prepare_statement(s)
    
@app.route('/save_query')
@cross_origin(supports_credentials=True)
def save_query():
    name = request.args.get('name', '')
    admin = int(request.args.get('admin', True))
    delete_statement = None
    s = session.query(PreparedStatement).filter_by(name=name, admin=1).first()
    if s:
        # we are going to live
        if not admin:
            s_live = session.query(PreparedStatement).filter_by(name=name, admin=0).first()
            if s_live:
                delete_statement = s
                s = s_live 
    else:
        s = session.query(PreparedStatement).filter_by(name=name, admin=admin).first()
        if not s:
            s = PreparedStatement()
    s.name = name
    s.statement = request.args.get('query', '')
    s.admin = admin
    s.parameter_types = 'integer'
    session.add(s)
    session.commit()
    if delete_statement:
        session.delete(delete_statement)
    clean_and_prepare_all()
    return jsonify(True)

@app.route('/del_query')
@cross_origin(supports_credentials=True)
def del_query():
    s = session.query(PreparedStatement).filter_by(name=request.args.get('name', '')).first()
    session.delete(s)
    session.commit()
    return jsonify(True)

@app.route('/run_query')
@cross_origin(supports_credentials=True)
def run_query():
    admin = int(request.args.get('admin', 0))    
    s = session.query(PreparedStatement).filter_by(name=request.args.get('name', ''), admin=admin).first()
    if not s:
        return jsonify(False)
    
    res = engine.execute("EXECUTE %s_%d(%d)" % (s.name,  s.admin, int(request.args.get('val1', 0))))
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



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
