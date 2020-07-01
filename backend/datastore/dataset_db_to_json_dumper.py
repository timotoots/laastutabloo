#!/usr/bin/python
import pandas, numpy
import argparse, json
import glob, sys, os.path, os, os.path
import requests
import sqlalchemy
from sqlalchemy import create_engine
from collections import defaultdict

engine = create_engine("postgresql://{laastutabloo_db_user}:{laastutabloo_db_password}@postgres/{laastutabloo_db}".format(**os.environ), encoding='utf16')

def dump_providers(output):
    df = pandas.read_sql_table("providers", engine)

    for row in df.to_dict('records'):
        del row['index']

        prov_file = os.path.join(output, "providers", row['id'] + ".json")
        with open(prov_file, "w") as f:
            f.write("[") 
            df_prov = pandas.DataFrame.from_dict([row])
            df_prov.to_json(f, indent=4, orient='records', lines=True)

            f.write("]")


    

def dump_from_db(table, output):
    df = pandas.read_sql_table(table, engine)

    df['last_updated'] = df['last_updated'].fillna(pandas.Timestamp(0))
    df['remote_updated'] = df['remote_updated'].fillna(pandas.Timestamp(0))

    df['last_updated'] = df['last_updated'].astype(str)
    df['remote_updated'] = df['remote_updated'].astype(str)

    private = []
    provider_map = defaultdict(list)
    depend_datasets = []
    datasets_map = {}

    for row in df.to_dict('records'):
        del row['index']

        del_keys = []

        for k,v in row.items():
            if v is None:
                del_keys.append(k)
        for k in del_keys:
            del row[k]

        datasets_map[row['id']] = row

        if row['private']:
            private.append(row)
            continue

        if 'provider' not in row and 'master_dataset' in row:
            depend_datasets.append(row)
            continue

        provider_map[row['provider']].append(row)

    for ds in depend_datasets:
        ds['provider'] = datasets_map[ds['master_dataset']]['provider']
        provider_map[row['provider']].append(row)

    for provider, datasets in provider_map.items():
        prov_file = os.path.join(output, "datasets", provider + ".json")

        with open(prov_file, "w") as f:
            f.write("[") 
            for i, ds in enumerate(datasets):
                if i:
                    f.write(",")
                df_priv = pandas.DataFrame.from_dict([ds])
                df_priv.to_json(f, indent=4, orient='records', lines=True)

            f.write("]")

    with open(os.path.join(output, "datasets_private.json"), "w") as f:
        df = pandas.DataFrame.from_dict(private)
        df.to_json(f, indent=4, orient='records')



    # for f in glob.glob("/opt/laastutabloo/config/datasets/*.json"):
    #     dataset_df = pandas.read_json(f, convert_dates=['last_updated', 'remote_updated'])
    #     df = pandas.concat([dataset_df, df], join="outer")
    
    # # df = pandas.read_json("/opt/laastutabloo/backend/config/datasets2.json", dtype={'devel':'bool'})
    # # df = pandas.read_json("/opt/laastutabloo/backend/config/datasets2.json", convert_dates=['last_updated', 'remote_updated'])
    
    # df['devel'] = df['devel'].fillna(False)
    # df['devel'] = df['devel'].astype('bool')

    # df['cron_minutes'] = df['cron_minutes'].fillna("*")
    # # df['cron_minutes'] = df['cron_minutes'].astype('int32')
    
    # df['last_updated'] = df['last_updated'].fillna(pandas.Timestamp(0))
    # df['tables'] = df['tables'].fillna("")
    # df['data_count'] = 0


    # if os.path.exists("/opt/laastutabloo/config/datasets_private.json"):
    #     df_auth = pandas.read_json("/opt/laastutabloo/config/datasets_private.json")
    #     df_auth.fillna(False, inplace=True)
    #     for auth in df_auth.itertuples():
    #         df.loc[df['id'] == auth.id, 'username'] = auth.username
    #         df.loc[df['id'] == auth.id, 'password'] = auth.password
    #         if auth.url:
    #             df.loc[df['id'] == auth.id, 'url'] = auth.url
    #         if auth.http_header:
    #             df.loc[df['id'] == auth.id, 'http_header'] = auth.http_header

    # df['last_updated'] = df['last_updated'].fillna(pandas.Timestamp(0))
    # df.to_sql(table, engine, dtype={'schema':sqlalchemy.types.JSON,                                          
    #                                       'remote_updated':sqlalchemy.types.DateTime,
    #                                       'last_updated':sqlalchemy.types.DateTime,
    #                                       'tables':sqlalchemy.types.JSON,
    #                                       'http_header':sqlalchemy.types.JSON,
    #                                       'devel': sqlalchemy.types.Boolean}, if_exists='replace')
    # engine.execute("ALTER TABLE {} ADD PRIMARY KEY (id, devel)".format(table))
    # engine.execute("CREATE SCHEMA IF NOT EXISTS devel")

    # # datasets_api does db introspection at import time
    # from datastore import DatasetResource
    # for i, r in df.iterrows():
    #     if not r['tables']:
    #         DatasetResource._sync_with_scrapykeeper(r['id'], False, {})
    #     else:
    #         DatasetResource._copy_schema_from_parent(r['id'])
    #     # requests.post("http://127.0.0.1:5000/dataset/" + r['id'], json={})
    
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("table", default="datasets2", help="Database table to export datasets from. Defaults to datasets2")
    parser.add_argument("--output", default="/opt/laastutabloo/config/", help="Configuration directory to write JSON files to.")
    parser.add_argument("--providers", action='store_true', default=False, help="Also dump dataset providers from table providers.")
    args = parser.parse_args()

    if args.providers:
        dump_providers(args.output)
    dump_from_db(args.table, args.output)

