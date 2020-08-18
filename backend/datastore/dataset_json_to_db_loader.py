#!/usr/bin/python
import pandas, numpy
import argparse
import glob, sys, os.path, os, os.path
import requests
import sqlalchemy
from sqlalchemy import create_engine

engine = create_engine("postgresql://{laastutabloo_db_user}:{laastutabloo_db_password}@postgres/{laastutabloo_db}".format(**os.environ))

def load_providers(input):
    all_df = pandas.DataFrame()
    for f in glob.glob( os.path.join(input, "providers", "*.json")):        
        df = pandas.read_json(f)
        all_df = pandas.concat([all_df, df], join="outer")
    all_df.to_sql("providers", engine, dtype={'meta':sqlalchemy.types.JSON,
                                              'wms':sqlalchemy.types.JSON}, if_exists='replace')
    engine.execute("ALTER TABLE providers ADD PRIMARY KEY (id)")
    
    

def load_to_db(table, input):
    df = pandas.DataFrame()
    for f in glob.glob(os.path.join(input, "datasets", "*.json")):
        dataset_df = pandas.read_json(f, convert_dates=['last_updated', 'remote_updated'])
        df = pandas.concat([dataset_df, df], join="outer")


    if os.path.exists(os.path.join(input, "datasets_private.json")):
        df_auth = pandas.read_json(os.path.join(input, "datasets_private.json"))
        df_auth.fillna(False, inplace=True)

        df = pandas.concat([df, df_auth], join="outer")

        for auth in df_auth.itertuples():
            df.loc[df['id'] == auth.id, 'username'] = auth.username
            df.loc[df['id'] == auth.id, 'password'] = auth.password
            if 'url' in df_auth and  auth.url:
                df.loc[df['id'] == auth.id, 'url'] = auth.url
            if 'http_header' in df_auth and auth.http_header:
                df.loc[df['id'] == auth.id, 'http_header'] = auth.http_header

    # df = pandas.read_json("/opt/laastutabloo/backend/config/datasets2.json", dtype={'devel':'bool'})
    # df = pandas.read_json("/opt/laastutabloo/backend/config/datasets2.json", convert_dates=['last_updated', 'remote_updated'])
    
    df['devel'] = df['devel'].fillna(False)
    df['devel'] = df['devel'].astype('bool')

    df['private'] = df['private'].fillna(False)
    df['private'] = df['private'].astype('bool')


    df['cron_minutes'] = df['cron_minutes'].fillna("*")
    # df['cron_minutes'] = df['cron_minutes'].astype('int32')




    df['last_updated'] = df['last_updated'].fillna(pandas.Timestamp(0))
    df['remote_updated'] = df['remote_updated'].fillna(pandas.Timestamp(0))

    df['tables'] = df['tables'].fillna("")
    df['data_count'] = 0


    df.to_sql(table, engine, dtype={'schema':sqlalchemy.types.JSON,                                          
                                          'remote_updated':sqlalchemy.types.DateTime,
                                          'last_updated':sqlalchemy.types.DateTime,
                                          'tables':sqlalchemy.types.JSON,
                                          'http_header':sqlalchemy.types.JSON,
                                          'devel': sqlalchemy.types.Boolean}, if_exists='replace', index=False)

    engine.execute("ALTER TABLE {} ADD PRIMARY KEY (id, devel)".format(table))
    engine.execute("CREATE SCHEMA IF NOT EXISTS devel")

    # datasets_api does db introspection at import time
    from datastore import DatasetResource
    for i, r in df.iterrows():
        if not r['tables']:
            DatasetResource._sync_with_scrapykeeper(r['id'], False, {})
        else:
            DatasetResource._copy_schema_from_parent(r['id'])
        # requests.post("http://127.0.0.1:5000/dataset/" + r['id'], json={})
    
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("table", default="datasets2", help="Database table to import datasets. Defaults to datasets2")
    parser.add_argument("--input", default="/opt/laastutabloo/config", help="Configuration directiory to read JSON files from.")
    parser.add_argument("--providers", action='store_true', default=False, help="Also load dataset providers from JSON to table providers.")
    args = parser.parse_args()

    if args.providers:
        load_providers(args.input)
    load_to_db(args.table, args.input)

