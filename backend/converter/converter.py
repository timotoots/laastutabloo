#!/usr/local/bin/python

# Libraries
import ujson, urllib3, certifi, pandas
import json_schema_generator, threading 
import xml.etree.ElementTree as ET
from json_schema_generator.generator import SchemaGenerator
from sqlalchemy import create_engine

# Constants
CONFIG_FILE = '../config/datasets.json'
RAW_FILE_PATH = '../data/raw/'
SCHEMA_FILE_PATH = '../data/schema/'

# Variables
http = urllib3.PoolManager(cert_reqs='CERT_REQUIRED', ca_certs=certifi.where())

# Fetch file with HTTP
def fetch(f):
  fd = open(RAW_FILE_PATH + f['id'] + '.' + f['type'], 'wb')
  r = http.request('GET', f['url'])
  data = r.data
  fd.write(data)
  fd.close()


# Convert XML to pandas
def xml_to_pandas(file_path):
    tree = ET.parse(file_path)

    data = []
    tmp = {}
    for i in tree.iterfind('./*'):
        for j in i.iterfind('*'):
            tmp[j.tag] = j.text
        data.append(tmp)
        tmp = {}

    return pandas.DataFrame(data)


# From stackoverflow
def delete_keys_from_dict(d, to_delete):
    if isinstance(to_delete, str):
        to_delete = [to_delete]
    if isinstance(d, dict):
        for single_to_delete in set(to_delete):
            if single_to_delete in d:
                del d[single_to_delete]
        for k, v in d.items():
            delete_keys_from_dict(v, to_delete)
    elif isinstance(d, list):
        for i in d:
            delete_keys_from_dict(i, to_delete)
    return d

# Used to create jstree
def recursive_iterdict(schema):
  res = []
  for key, value in schema.items():
    if value == {}:
      res.append({"text" : key})
    else:
      res.append({"text" : key})
      res[-1]["children"] = recursive_iterdict(schema[key])

  return res


# Write schema of given file to ../data/schema
def schematize(f):
  # Construct path with file object
  filetype = f["type"]
  path = RAW_FILE_PATH + f["id"] + "." + filetype
  
  # Switch-case for file type differentiation, 
  # creating schema with Schemagenerator library
  try:
    if filetype == 'json' or filetype == 'geojson':
      generator = SchemaGenerator.from_json(open(path, 'rb').read())
      schema = generator.to_dict()
      delete_keys_from_dict(schema, ['$schema', 'id', 'required', 'type'])
      data = ujson.dumps(recursive_iterdict(schema), indent=2)        
    elif filetype == 'csv':
      schema = open(path, 'rb').readline()
      schema = schema.split()  
      data = []
      for j in schema:
        data.append({"text" : j})
      data = ujson.dumps(data, indent=2)
    elif filetype == 'xml':
      #todo 
      pass
    else:
      print "Bad file type", f["type"]
    open(SCHEMA_FILE_PATH + f["id"] + "." + filetype + '.schema', 'wb').write(data) 
  except Exception as e:
    print "Cannot schematize file", path, e 

# Insert given file to postgreSQL
def insert_database(f, engine):
  # Construct path with file object
  filetype = f["type"]
  path = RAW_FILE_PATH + f["id"] + "." + filetype
  data = pandas.DataFrame()

  # Switch-case for file type differentiation, reading to pandas
  try:
    if filetype == 'json' or filetype == 'geojson':
      data = pandas.read_json(open(path, 'rb'), encoding='utf-8', dtype='str')
    elif filetype == 'csv':
      data = pandas.read_csv(open(path, 'rb'), encoding='utf-8', engine='python', sep=None)
    elif filetype == 'xml':
      data = xml_to_pandas(open(path, 'rb'))
    else:
      print "Bad file type", f["type"]
  except Exception as e:
    print "Cannot convert file", path, e
  
  # Write to postgreSQL
  try:
    data.to_sql(f["id"], engine, if_exists='replace', chunksize=100000)  
  except Exception as e:
    print "Cannot insert file into database", path, e 


# Run file through pipeline
def pipeline(f, engine):
  fetch(f)
  schematize(f)
  insert_database(f, engine)


# Main function
# Spawn threads for each file of each dataset
if __name__ == '__main__':
  
  # Read config file and fetch file object for each dataset
  config = ujson.load(open(CONFIG_FILE))
  datasets = []
  for i in config:
    datasets.append(i['datasets'])
  
  # PostgreSQL engine
  engine = create_engine("postgresql://datastore_default:laastu123@localhost/laastutabloo")

  # Spawn pipeline threads for each file
  threads = {}
  for ds in datasets: 
    for f in ds:
      t = threading.Thread(target=pipeline, args=(f, engine))
      threads[f["id"]] = t
      t.start()
      print "Spawned thread for file", f["id"]
  
  # Join all finished threads
  for i in threads: 
    threads[i].join()
    print "Joined thread", i 
