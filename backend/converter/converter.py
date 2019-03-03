#!/usr/local/bin/python

# Libraries
import ujson, urllib3, certifi, pandas, ijson
import json_schema_generator, threading
import xml.etree.ElementTree as ET
from json_schema_generator.generator import SchemaGenerator
from sqlalchemy import create_engine

# Constants
CONFIG_FILE = '../config/config.json'
DATASETS_FILE = '../config/datasets.json'
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
def convert_and_insert_DB(f, engine):
  # Construct path with file object
  filetype = f["type"]
  path = RAW_FILE_PATH + f["id"] + "." + filetype
  data = pandas.DataFrame()

  # Switch-case for file type differentiation, reading to pandas
  try:
    if filetype == 'json' or filetype == 'geojson':
      # JSON stream parsing, going from schema given top element
      objects = ijson.items(open(path), f["converter_top_element"])
      
      # Library specific loop
      for o in objects:
        first = True
        counter = 0
        
        # Loop throught every record in the JSON
        for record in o:
          dictionary = {}       # will hold data from record in dict form
          schema = f["schema"]  # Mapping for columns
          
          # Loop through every column to map
          for k in schema:
            
            # If there is a field, keep the data
            if "field" in k: 
              # If field is separated by "." we recursively go in the tree of the record
              if len(k["field"].split(".")) > 1:
                tmp = record
                fieldhierarchy = k["field"].split(".")
                for i in fieldhierarchy:
                  if i in tmp:
                    tmp=tmp[i]

                # If the type of the field is text, write content in field,
                # either underlying JSON or text content and change column name
                if k["type"] == 'text':
                  dictionary[k["column"]] = [str(tmp)]
              else:

                # If field is without "." and contained in record,
                # write it to dict and change column name
                if k["field"] in record:
                  dictionary[k["column"]] = [record[k["field"]]]
                else:
                  dictionary[k["column"]] = [""]
            
            # If there is no field, run given custom script to build it
            else:
              mod = __import__("scripts." + k["script"])
              function = getattr(getattr(mod, k["script"]), k["script"])
              field = function(record)
              dictionary[k["column"]] = [field]

          # Every 100 record, parse it to pandas dataframe
          if counter != 100:
            chunk = pandas.DataFrame.from_dict(dictionary)
            data = pandas.concat([data, chunk], sort=False, join='outer')
            counter += 1
          
          # Last record, parse rest of the data if there is some         
          elif counter == len(o):
            
            # If total number of records is smaller than 100,
            # first time writing to db has to replace table
            if first:
              data.to_sql(f["id"], engine, if_exists='replace', chunksize=10000)
              first = False
            
            # Append dataframe to db
            else:
              data.to_sql(f["id"], engine, if_exists='append', chunksize=10000)
          else:
              
            # First time writing to db has to replace table
            if first:
              data.to_sql(f["id"], engine, if_exists='replace', chunksize=10000) 
              first = False
            
            # Append dataframe to db
            else:
              data.to_sql(f["id"], engine, if_exists='append', chunksize=10000)

    elif filetype == 'csv':
      # Read and add CSV to DB by chunks 
      data = pandas.read_csv(open(path), encoding='utf-8', sep=f["delimiter"], chunksize=10000, iterator=True)
      first = True
      for i in data:
        if first:
          i.to_sql(f["id"], engine, if_exists='replace', chunksize=10000)
          first = False
        else:
          i.to_sql(f["id"], engine, if_exists='append', chunksize=10000)
    elif filetype == 'xml':
      data = xml_to_pandas(open(path, 'rb'))
      data.to_sql(f["id"], engine, if_exists='replace', chunksize=10000) 
    else:
      print "Bad file type", f["type"]
  except Exception as e:
    print "Cannot convert file", path, e
    pass

# Run file through pipeline
def pipeline(f, engine):
  fetch(f)
  #schematize(f)
  convert_and_insert_DB(f, engine)


# Main function
# Spawn threads for each file of each dataset
if __name__ == '__main__':
  
  # Read config file and fetch file object for each dataset
  config = ujson.load(open(CONFIG_FILE))
  dataset_json = ujson.load(open(DATASETS_FILE))
  datasets = []
  for i in dataset_json:
    datasets.append(i['datasets'])
  
  # PostgreSQL engine
  engine = create_engine("postgresql://" + config["database_user"] + ":" + config["database_password"] + "@localhost/" + config["database_name"])
  

  # Spawn pipeline threads for each file
  threads = {}
  for ds in datasets: 
    for f in ds:
      # entry for the thread is the function pipeline(f, engine)
      t = threading.Thread(target=pipeline, args=(f, engine)) 
      threads[f["id"]] = t
      t.start()
      print "Spawned thread for file", f["id"]
  
  # Join all finished threads
  for i in threads: 
    threads[i].join()
    print "Joined thread", i 
