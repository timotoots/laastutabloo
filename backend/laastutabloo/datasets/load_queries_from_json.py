#!/usr/bin/python
import pandas, numpy
import glob
import requests
import sqlalchemy, json
from sqlalchemy import create_engine
from .datasets_api import PreparedStatement, SlideTemplate, SubTemplate, TemplateRow, TemplateColumn, QuerySlide, session
engine = create_engine("postgresql://datastore_default:laastu123@localhost/laastutabloo")

def load_queries():
    all_df = pandas.DataFrame()
    for f in glob.glob("/opt/laastutabloo/config/queries/*.json"):
        for js in json.load(open(f)):
            load_query(js)

def load_query(js):
    query_id = js['query_id']
    devel = int(js.get('devel', False))
    delete_statement = None
    ps= session.query(PreparedStatement).filter_by(query_id=query_id, devel=devel).first()
    if not ps:
        ps= session.query(PreparedStatement).filter_by(query_id=query_id, devel=devel).first()
        if not ps:
            ps= PreparedStatement()
    ps.query_id = query_id
    ps.statement = js['sql']
    ps.meta = js.get('meta', False)
    ps.dataset_id = js.get('dataset_id', False)
    ps.where = js.get('where', '')
    ps.sql = js.get('sql', False)
    ps.name = js.get('name', False)
    ps.columns = js.get('columns', False)
    ps.style = js.get('style', False)
    ps.devel = devel
    ps.parameter_types = js.get('parameter_types', 'integer')
    session.add(ps)
    session.commit()
    return
    
    template = session.query(SlideTemplate).filter_by(name=js['style']['template']).first()
    if not template:
        template = SlideTemplate(name=js['style']['template'])
        align = js['style']['align']
        session.add(template)
        session.commit()
    qslide = session.query(QuerySlide).filter_by(query=ps.id, template=template).first()
    if not qslide:
        qslide = QuerySlide()
    qslide.pages_num = style['num_of_pages']
    qslide.query = ps.id
    qslide.template = template
    session.add(qslide)
    session.commit()

    body_temp_name = template.name + "_" + "body"
    body = session.query(SubTemplate).filter_by(template=template, name=body_temp_name).first()
    if not body:
        body = SubTemplate(name=body_temp_name, template=template)
    r = session.query(TemplateRow).filter_by(subtemplate=body).first()
    if not r:
        r = TemplateRow()
        session.add(r)    
        session.add(body)
        session.commit()
        body.rows.append(r)
    for col in js['columns']:
        # c = session.query(TemplateColumn).filter_by()
        c = TemplateColumn(name=col['name'], width=col['width'], align=col['align'], wrap=col['wrap'],
                           prefix=col.get('prefix', ''), suffix=col.get('suffix', ''))
        r.columns.append(c)
        session.add(c)
    session.add(r)    
    session.add(body)
    session.commit()

    
if __name__ == '__main__':
    load_queries()
