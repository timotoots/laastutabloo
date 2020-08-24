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
                                              'meta_internal':sqlalchemy.types.JSON,
                                              'wms':sqlalchemy.types.JSON}, if_exists='replace')
    engine.execute("ALTER TABLE providers ADD PRIMARY KEY (id)")

def load_queries(input):

    f = os.path.join(input, "queries.json")
    df = pandas.read_json(f)
    df['statement'].fillna("", inplace=True)
    df.fillna(False, inplace=True)
    engine.execute("DROP TABLE prepared_statements CASCADE")    
    df.to_sql("prepared_statements", engine, dtype={'meta':sqlalchemy.types.JSON,
                                                    'name':sqlalchemy.types.JSON,
                                                    'style':sqlalchemy.types.JSON,
                                                    'columns':sqlalchemy.types.JSON,
                                                    'orderby':sqlalchemy.types.JSON,
                                                    'custom_sql': sqlalchemy.types.TEXT,
                                                    'meta_internal':sqlalchemy.types.JSON,
                                                    'wms':sqlalchemy.types.JSON}, if_exists='replace', index=False)
    engine.execute("ALTER TABLE prepared_statements ADD PRIMARY KEY (id)")
    engine.execute("CREATE SEQUENCE IF NOT EXISTS prepared_statements_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1")
    engine.execute("ALTER TABLE prepared_statements ALTER COLUMN id SET DEFAULT  nextval('prepared_statements_id_seq'::regclass)")


def load_scripts(input):
    f = os.path.join(input, "scripts.json")
    df = pandas.read_json(f)
    df.to_sql("script", engine, dtype={'meta':sqlalchemy.types.JSON,
                                              'meta_internal':sqlalchemy.types.JSON,
                                              'wms':sqlalchemy.types.JSON}, if_exists='replace', index=False)
    engine.execute("ALTER TABLE script ADD PRIMARY KEY (id)")


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
                df.loc[df['id'] == auth.id, 'http_header'] = auth.http_header[0]

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
    parser.add_argument("--queries", action='store_true', default=False, help="Load queries from JSON to table prepared_statements.")
    parser.add_argument("--scripts", action='store_true', default=False, help="Load scripts from JSON to table script.")
    args = parser.parse_args()

    if args.providers:
        load_providers(args.input)    
    if args.scripts:
        load_scripts(args.input)
        exit()
    if args.queries:
        load_queries(args.input)
        exit()

    load_to_db(args.table, args.input)

