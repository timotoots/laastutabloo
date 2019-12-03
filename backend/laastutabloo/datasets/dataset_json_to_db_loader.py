#!/usr/bin/python
import pandas, numpy
import argparse
import glob, sys, os.path
import requests
import sqlalchemy
from sqlalchemy import create_engine
engine = create_engine("postgresql://datastore_default:laastu123@localhost/laastutabloo")
from datasets_api import DatasetResource

def load_providers():
    all_df = pandas.DataFrame()
    for f in glob.glob("/opt/laastutabloo/config/providers/*.json"):        
        df = pandas.read_json(f)
        all_df = pandas.concat([all_df, df], join="outer")
    all_df.to_sql("providers", engine, dtype={'meta':sqlalchemy.types.JSON,
                                              'wms':sqlalchemy.types.JSON}, if_exists='replace')
    engine.execute("ALTER TABLE providers ADD PRIMARY KEY (id)")
    


def load_to_db(table):
    df = pandas.DataFrame()
    for f in glob.glob("/opt/laastutabloo/config/datasets/*.json"):
        dataset_df = pandas.read_json(f, convert_dates=['last_updated', 'remote_updated'])
        df = pandas.concat([dataset_df, df], join="outer")
    
    # df = pandas.read_json("/opt/laastutabloo/backend/config/datasets2.json", dtype={'devel':'bool'})
    # df = pandas.read_json("/opt/laastutabloo/backend/config/datasets2.json", convert_dates=['last_updated', 'remote_updated'])
    
    df['devel'] = df['devel'].fillna(False)
    df['devel'] = df['devel'].astype('bool')

    df['cron_minutes'] = df['cron_minutes'].fillna("*")
    # df['cron_minutes'] = df['cron_minutes'].astype('int32')
    
    df['last_updated'] = df['last_updated'].fillna(pandas.Timestamp(0))
    df['tables'] = df['tables'].fillna("")
    df['data_count'] = 0
    
    df_auth = pandas.read_json("/opt/laastutabloo/config/datasets_private.json")
    df_auth.fillna(False, inplace=True)
    for auth in df_auth.itertuples():
        df.loc[df['id'] == auth.id, 'username'] = auth.username
        df.loc[df['id'] == auth.id, 'password'] = auth.password
        if auth.url:
            df.loc[df['id'] == auth.id, 'url'] = auth.url
        if auth.http_header:
            df.loc[df['id'] == auth.id, 'http_header'] = auth.http_header

    df['last_updated'] = df['last_updated'].fillna(pandas.Timestamp(0))
    df.to_sql(table, engine, dtype={'schema':sqlalchemy.types.JSON,                                          
                                          'remote_updated':sqlalchemy.types.DateTime,
                                          'last_updated':sqlalchemy.types.DateTime,
                                          'tables':sqlalchemy.types.JSON,
                                          'http_header':sqlalchemy.types.JSON,
                                          'devel': sqlalchemy.types.Boolean}, if_exists='replace')
    engine.execute("ALTER TABLE {} ADD PRIMARY KEY (id, devel)".format(table))
    engine.execute("CREATE SCHEMA IF NOT EXISTS devel")
    for i, r in df.iterrows():
        if not r['tables']:
            DatasetResource._sync_with_scrapykeeper(r['id'], False, {})
        else:
            DatasetResource._copy_schema_from_parent(r['id'])
        # requests.post("http://127.0.0.1:5000/dataset/" + r['id'], json={})
    
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("table", default="datasets2", help="Database table to import datasets. Defaults to datasets2")
    args = parser.parse_args()

    if not args:
        load_providers()
    load_to_db(args.table)

