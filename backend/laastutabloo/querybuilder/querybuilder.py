from flask import Flask, request, jsonify, Response
from flask_cors import CORS, cross_origin
import psycopg2
import json, requests, urllib
import tableformatter

# Initialize the Flask application
app = Flask(__name__)
CORS(app, support_credentials=True)

from beautifultable import BeautifulTable


from sqlalchemy import create_engine
engine = create_engine("postgresql://datastore_default:laastu123@localhost/laastutabloo")

from sqlalchemy.ext.declarative import declarative_base                                                                             
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import Integer, ForeignKey, String, Column, Date, Text, Table, JSON
import sqlalchemy.exc
import uuid, datetime                                                                                                               
import csv

from sqlalchemy.dialects import postgresql
from laastutabloo.functions import get_wms_url, wms_get_capabilities

Base = declarative_base()                                                                                                           

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
        
class PreparedStatement(Base):
    __tablename__ = "prepared_statements"
    id = Column(Integer, primary_key=True)
    query_id = Column(String(100)) 
    dataset_id = Column(String(100)) 
    test = Column(Integer)
    statement = Column(Text) 
    parameter_types = Column(Text)
    meta = Column(JSON)
    name = Column(JSON)
    style = Column(JSON)
    columns = Column(JSON)
    where = Column(Text)

    def _get_sql(self):
        # import pdb; pdb.set_trace()
        if self.statement:
            return self.statement
        else:
            sql_template = "SELECT {columns} FROM {table} WHERE {where_clause} ORDER BY {order_clause} LIMIT {limit}"
            columns = []
            order_columns = {}
            sort_orders = {}
            where_columns = []
            for c in json.loads(self.columns):
                columns.append(c['name'])
                order_columns[c['order_order']] = c['name']
                # sort_orders[]
            return sql_template.format({'columns': ",".joins(columns),
                                        'table': s.dataset_id,
                                        'where_clause': " and ".join(where_columns)})
    
    
    

class TemplateColumn(Base):
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
    
    
association_table = Table('association', Base.metadata,
    Column('template_column_id', Integer, ForeignKey('template_column.id')),
    Column('template_row_id', Integer, ForeignKey('template_row.id'))
)

wrap_mode_map = {'truncate' : BeautifulTable.WEP_STRIP,
                 'wrap' : BeautifulTable.WEP_WRAP, }

align_map = {'left': BeautifulTable.ALIGN_LEFT,
             'right': BeautifulTable.ALIGN_RIGHT,
             'center': BeautifulTable.ALIGN_CENTER,
}

class TemplateRow(Base):
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

    
    
class SubTemplate(Base):
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
    
class SlideTemplate(Base):
    __tablename__ = "slide_template"    
    id = Column(Integer, primary_key=True)
    name = Column(Text)
    meta = Column(Text)
    subtemplates = relationship("SubTemplate", back_populates="template")
    

class QuerySlide(Base):
    __tablename__ = "query_slide"
    id = Column(Integer, primary_key=True)
    template_id = Column(Integer, ForeignKey('slide_template.id'))
    template = relationship("SlideTemplate")
    query = Column(Integer, ForeignKey('prepared_statements.id'))
    pages_num = Column(Integer)

Base.metadata.create_all(engine)


Session = sessionmaker(bind=engine)                                                                                                    
session = Session()      


@app.route('/list_queries')
@cross_origin(supports_credentials=True)
def list_queries():
    return jsonify([ {"query_id": r.query_id, "statement": r.statement, "test": bool(r.test),
                      "style": json.loads(r.style), "columns": json.loads(r.columns), "name": json.loads(r.name)} for r in session.query(PreparedStatement).all() ])
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
    url = urllib.parse.unquote(request.args.get('url').decode("utf8"))
    body_trim_len = urllib.parse.unquote(request.args.get('trim').decode("utf8"))
    r = requests.get(url)
    resp = Response(r.text)
    resp.headers['Content-Type'] = r.headers['Content-Type']
    return resp


def prepare_statement(s):
    print(s.query_id, s.test)
    try:
        engine.execute("PREPARE %s_%d (%s) AS %s;" % (s.query_id, s.test, s.parameter_types, s._get_sql()))
    except:
        print("PREPARE %s_%d (%s) AS %s;" % (s.query_id, s.test, s.parameter_types, s._get_sql()))
        pass

def clean_and_prepare_all():
    engine.execute("DEALLOCATE ALL")
    for s in session.query(PreparedStatement).all():
        prepare_statement(s)


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
    s.name = request.args.get('name', '')
    s.style = request.args.get('style', '')
    s.columns = request.args.get('columns', '')
    s.test = test
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
    test = int(request.args.get('test', 0))    
    s = session.query(PreparedStatement).filter_by(query_id=request.args.get('query_id', ''), test=test).first()
    if not s:
        return jsonify(False)

    val1 = request.args.get('ehak', None)
    val2 = request.args.get('val1', None)
    args = val1
    if val2 is not None:
        args = args + ", " + val2
    query = "EXECUTE %s_%d(%s)" % (s.query_id,  s.test, args)
    res = engine.execute(query)
    return jsonify([ dict(r.items()) for r in res.fetchall()])

def _run_prepared_statement(prep_statement, test, ehak, val1=None):
    args = ehak
    if val1 is not None:
        args = args + ", " + val1
    query = "EXECUTE %s_%d(%s)" % (prep_statement.query_id, test, args)
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
    test = int(request.args.get('test', 0))
    query_id=request.args.get('query_id', '')
    query_ids=request.args.get('query_ids', False)
    s = session.query(PreparedStatement).filter_by(query_id=query_id, test=test).first()
    if not s:
        return jsonify(False)
    ehak = int(request.args.get('ehak', None))
    try:
        ehak_name, ehak_type = session.execute("select animi, tyyp from ehak where akood::integer = '{}';".format(ehak)).first()
    except TypeError:
        return jsonify(False)
    val1 = request.args.get('val1', None)
        
    jt = json.load(open("/opt/laastutabloo/backend/laastutabloo/querybuilder/slide_template.json"))
    jt['district']['id'] = ehak
    jt['district']['name'] = clean_ehak_name(ehak_name, int(ehak_type))
    jt['district']['type'] = dict( [ (l, ehak_type_trans._(ehak_type_map[int(ehak_type)], l)) for l in ehak_type_trans.all_langs  ])
    jt['queries'] = {}
    
    values = _run_prepared_statement(s, test, ehak, val1)
    
    jt['queries'][s.query_id] = {}
    jt['queries'][s.query_id]['data'] = values
    
    jt['queries'][s.query_id]['config'] = {"style": json.loads(s.style),
                                           "columns": json.loads(s.columns),
                                           "name": json.loads(s.name) }
    
    
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
    clean_and_prepare_all()
    app.run(debug=True, host='0.0.0.0', port=9000)
