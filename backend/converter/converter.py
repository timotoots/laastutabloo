#!/usr/local/bin/python

# Libraries
import ujson, urllib3, certifi, pandas, sys, json, decimal, re, os
import ijson.backends.yajl2_cffi as ijson
from ijson.common import ObjectBuilder
import json_schema_generator, threading
import xmltodict
from json_schema_generator.generator import SchemaGenerator
from sqlalchemy import create_engine
from geoalchemy2 import Geometry, WKTElement
from geomet import wkt

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
      pass
    else:
      print "Bad file type", f["type"]
    open(SCHEMA_FILE_PATH + f["id"] + "." + filetype + '.schema', 'wb').write(data) 
  except Exception as e:
    print "Cannot schematize file", path, e 

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

def populate_dict_from_json(record, field_description, dictionary):
  # If there is a field, keep the data
  if "field" in field_description: 
    fieldname = field_description['field']
    # If field is separated by "." we recursively go in the tree of the record
    if len(fieldname.split(".")) > 1:
      tmp = record
      fieldhierarchy = fieldname.split(".")
      for i in fieldhierarchy:
        if i in tmp:
          tmp=tmp[i]

      # we did not find anything
      if tmp is record:
        tmp = ""
        
      # If the type of the field is text, write content in field,
      # either underlying JSON or text content and change column name
      if field_description["type"] == 'text':
        try:
          if type(tmp) is unicode:
            text_value = tmp.encode("utf8")
          else:
            text_value= str(tmp).encode("utf-8")

          dictionary[field_description["column"]] = [text_value]
        except BaseException as e:
          print(e)
    else:
      value = [record[fieldname]]
      # if field_description["type"] == "geojson":
        # value = json.dumps(record[fieldname], cls=DecimalEncoder)
      # If field is without "." and contained in record,
      # write it to dict and change column name
      if fieldname in record:
        dictionary[field_description["column"]] = [value]
      else:
        dictionary[field_description["column"]] = [""]

    # If there is no field, run given custom script to build it
  else:
    mod = __import__("scripts." + field_description["script"])
    function = getattr(getattr(mod, field_description["script"]), field_description["script"])
    field = function(record)
    dictionary[field_description["column"]] = [field]
  return dictionary
  
from shapely.geometry import shape
    
def handle_json_records(records, f, engine):
  data = pandas.DataFrame()
  first = True
  counter = 0
  
  def write_pandas_df(data):
    if f["type"] == "geojson":
      def to_wkt(x):
        return wkt.dumps(x[0])
      
      data['geom'] = data['geometry'].apply(to_wkt) 
      data.drop('geometry', 1, inplace=True)
      
    if first:
      data.to_sql(f["id"], engine, if_exists='replace', chunksize=10000, dtype={'geom': Geometry('', srid=4326)})
      # Append dataframe to db
    else:
      data.to_sql(f["id"], engine, if_exists='append', chunksize=10000, dtype={'geom': Geometry('', srid=4326)})
    
  # Loop throught every record in the JSON
  for o in records:
    dictionary = {}       # will hold data from record in dict form
    schema = f["schema"]  # Mapping for columns
    
    if f["type"] == "geojson":
      schema.append({"column": "geometry", "type" :"geojson", "field": "geometry"})
    # Loop through every column to map
    for k in schema:
      populate_dict_from_json(o, k, dictionary)
      
    chunk = pandas.DataFrame.from_dict(dictionary)
    data = pandas.concat([data, chunk], sort=False, join='outer')

    if counter != 100:
      counter += 1
      
    else:
      counter = 0
      write_pandas_df(data)
      data = pandas.DataFrame()
      first = False
  # write leftover data if any
  if not data.empty:
    write_pandas_df(data)
  
    
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

      prefix = f["converter_top_element"]
      if prefix:
        prefix += ".item"
      else:
        prefix = "item"
      objects = ijson.items(open(path), prefix)
      handle_json_records(objects, f, engine)
      

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
      dataset = open(path, "rb").read()
      dictionary = xmltodict.parse(dataset)
      data = {}
      open("tmp.json","w").write(ujson.dumps(dictionary))
      regex = re.compile("^" + f["converter_top_element"] + "$")
      key = '-'
      for prefix, event, value in ijson.parse(open("tmp.json", 'r')):
        match = regex.match(prefix)
        if match and event == 'map_key':  # found new object at the root
          key = value  # mark the key value
          builder = ObjectBuilder()
        elif prefix.startswith(f["converter_top_element"] + "." + key):  # while at this key, build the object
          builder.event(event, value)
          if event == 'end_map':  # found the end of an object at the current key, yield
            data[key] = builder.value

      df = pandas.DataFrame.from_dict(data)
      
      # TODO insert in db      
      #df.to_sql(f["id"], engine, if_exists='replace', chunksize=10000)
    else:
      print "Bad file type", f["type"]
  except Exception as e:
    print "Cannot convert file", path, e
    raise (e)
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
  datasets = [ d['datasets'] for d in dataset_json ]

  # PostgreSQL engine
  engine = create_engine("postgresql://" + config["database_user"] + ":" + config["database_password"] + "@localhost/" + config["database_name"])
  

  # Spawn pipeline threads for each file
  threads = {}
  for ds in datasets: 
    for f in ds:
      if len(sys.argv) > 1:
        if f['id'] not in sys.argv:
          continue

      # entry for the thread is the function pipeline(f, engine)
      t = threading.Thread(target=pipeline, args=(f, engine)) 
      threads[f["id"]] = t
      t.start()
      print "Spawned thread for file", f["id"]
  
  # Join all finished threads
  for i in threads: 
    threads[i].join()
    print "Joined thread", i 
