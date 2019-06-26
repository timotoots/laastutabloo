#!/usr/bin/python
import pandas, numpy

import requests
import sqlalchemy
from sqlalchemy import create_engine
engine = create_engine("postgresql://datastore_default:laastu123@localhost/laastutabloo")


def load_to_db():
    # df = pandas.read_json("/opt/laastutabloo/backend/config/datasets2.json", dtype={'devel':'bool'})
    df = pandas.read_json("/opt/laastutabloo/backend/config/datasets2.json")
    df['devel'] = df['devel'].fillna(False)
    df['devel'] = df['devel'].astype('bool')

    df.to_sql("datasets2", engine, dtype={'schema':sqlalchemy.types.JSON,                                          
                                          'remote_updated':sqlalchemy.types.DateTime,
                                          'last_updated':sqlalchemy.types.DateTime,
                                          'devel': sqlalchemy.types.Boolean}, if_exists='replace')
    engine.execute("ALTER TABLE datasets2 ADD PRIMARY KEY (id, devel)")
    engine.execute("CREATE SCHEMA IF NOT EXISTS devel")
    for i, r in df.iterrows():
        requests.post("http://127.0.0.1:5000/dataset/" + r['id'], json={})
    
if __name__ == '__main__':
    load_to_db()
