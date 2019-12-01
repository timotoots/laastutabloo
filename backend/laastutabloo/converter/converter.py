#!/usr/local/bin/python

# Libraries
import ujson, pandas, sys, json, decimal, re, os
import ijson.backends.yajl2_cffi as ijson
from ijson.common import ObjectBuilder
import threading
import xmltodict
import shapefile
from importlib import import_module
# from json_schema_generator.generator import SchemaGenerator
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import sessionmaker
import sqlalchemy
from sqlalchemy import inspect


from pandas_ods_reader import read_ods

from geoalchemy2 import Geometry, WKTElement
from geomet import wkt
import logging

log = logging.getLogger("converter")

# Constants
CONFIG_FILE = '../../config/config.json'
DATASETS_FILE = '../../config/datasets.json'
RAW_FILE_PATH = '../../data/raw/'
SCHEMA_FILE_PATH = '../../data/schema/'




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

def iter_json_objects(json_file, root=''):
    key = '-'
    data_in_array = False
    for prefix, event, value in ijson.parse(json_file):
        # print(prefix, event, value)
        if prefix == '' and event == u'start_array':
            data_in_array = True
            root = "item"

        if root:
            root_plus_key = root
            if key:
                root_plus_key = root + "." + key
        else:
            root_plus_key = key

        # print("ROOT ", root, root_plus_key)

        if (not data_in_array and prefix == root and (event == 'map_key' or event == 'start_array')) or \
        (data_in_array and prefix=='item' and event=='start_map'):  # found new object at the root
          if prefix == root and event == u'start_array':
            value = "item"

          key = value if value else '' # mark the key value
          builder = ObjectBuilder()
          if data_in_array:
            builder.event('start_map', None)
        elif prefix.startswith(root_plus_key):
            # print("EVENT ", event, value)
            builder.event(event, value)
            if (not data_in_array and event == 'end_map' and prefix == root_plus_key):
              # print("YIELD ", event, value)
              yield builder.value
            if (data_in_array and prefix=='item' and event=='end_map'):  # found the end of an object at the current key, yield
              yield builder.value


# Write schema of given file to ../data/schema
def schematize(f):
  # Construct path with file object
  filetype = f.type
  path = RAW_FILE_PATH + f.id + "." + filetype
  
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
      print ("Bad file type", f.type)
    open(SCHEMA_FILE_PATH + f.id + "." + filetype + '.schema', 'wb').write(data) 
  except Exception as e:
    print ("Cannot schematize file", path, e )

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

module_cache = {}

def populate_dict_from_json(record, field_description, dictionary):
  global module_cache
  # If there is a field, keep the data
  if "field" in field_description: 
    fieldname = field_description['field']
    # If field is separated by "." we recursively go in the tree of the record
    if len(fieldname.split(".")) > 1:
      value = record
      fieldhierarchy = fieldname.split(".")
      for i in fieldhierarchy:
        if i in value:
          value=value[i]

      # we did not find anything
      if value is record:
        return dictionary
    else:
      try:
        value = record[fieldname]
      except KeyError:
        return dictionary
              
    # If the type of the field is text, write content in field,
    # either underlying JSON or text content and change column name
    if field_description["type"] == 'text':
      try:
        if type(value) is bytes:
          text_value = value.encode("utf8")
        elif type(value) is dict:
          text_value = json.dumps(value, ensure_ascii=False)
        else:
          # text_value= str(value).encode("utf-8")
          text_value= str(value)

        dictionary[field_description["column"]] = [text_value]
      except BaseException as e:
        import pdb; pdb.set_trace()
        print(e)
      # if field_description["type"] == "geojson":
      # value = json.dumps(record[fieldname], cls=DecimalEncoder)
      # If field is without "." and contained in record,
      # write it to dict and change column name
    else:
      if fieldname in record:
        dictionary[field_description["column"]] = [value]
      else:
        dictionary[field_description["column"]] = [""]

    # If there is no field, run given custom script to build it
  else:
    if 'script' in field_description:
      if not module_cache.get(field_description["script"]):
        module_cache[field_description["script"]] = import_module("laastutabloo.converter.scripts." + field_description["script"])
      function = getattr(module_cache[field_description["script"]], field_description["script"])
      try:
        field = function(record)
        dictionary[field_description["column"]] = [field]
      except BaseException as e:
        print(str(e))
  return dictionary
  
from shapely.geometry import shape

def find_views(engine, dataset_name):
  result = engine.execute("select id, tables from datasets2 where tables::jsonb ? '{}';".format(dataset_name))
  return { r[0] : r[1] for r in result }
  
def drop_views(engine, views):
  Session = sessionmaker(bind=engine) 
  session = Session()
  for v in views.keys():
    try:
      sql = "drop view {};".format(v)
      session.execute(sql)
    except:
      session.rollback()
  session.commit()

def create_views(engine, views):
  Session = sessionmaker(bind=engine) 
  session = Session()

  for v, tables in views.items():
    try:
      selects = [ "select * from {} ".format(t) for t in tables ]
      union = " union ".join(selects)
      sql = "create view {} as {}".format(v, union)
      session.execute(sql)
    except:
      session.rollback()
  session.commit()
  
dtypes_map = { 'text': sqlalchemy.types.Text,
               'float': sqlalchemy.types.Float }

def handle_json_records(records, f, engine):
  session = inspect(f).session
  data = pandas.DataFrame()
  first = True
  counter = 0
  views = find_views(engine, f.id)

  schema = f.schema  # Mapping for columns
  dtypes = {'geom': Geometry('', srid=4326)}
  for k in schema:
    try:
      dtypes[k['column']] = dtypes_map.get(k['type'], sqlalchemy.types.Text)
    except KeyError:
      log.critical('Missing column type: ' + str(k))
      return

  new_table = f.id + "_new"

  def write_pandas_df(data):
    if f.type == "geojson" or f.type == "shapefile":
      def to_wkt(x):
        return wkt.dumps(x)
      
      data['geom'] = data['geometry'].apply(to_wkt) 
      data.drop('geometry', 1, inplace=True)
    schema = 'public'
    if f.devel:
      schema = 'devel'
    if first:
      try:
        drop_views(engine, views)
      except:
        pass
      try:
        data.to_sql(new_table, engine, schema=schema, if_exists='replace', chunksize=10000, dtype=dtypes)
      except:
        log.error("Converter failed to insert into table.")
        log.exception('Pandas to_sql failed.')
      # Append dataframe to db
    else:
      data.to_sql(new_table, engine, schema=schema, if_exists='append', chunksize=10000, dtype=dtypes)

  # Loop throught every record in the JSON
  total_count = 0
  for o in records:
    dictionary = {}       # will hold data from record in dict form
    
    if f.type == "geojson" or f.type == "shapefile":
      schema.append({"column": "geometry", "type" :"geojson", "field": "geometry"})
    # Loop through every column to map
    for k in schema:
      populate_dict_from_json(o, k, dictionary)
      
    chunk = pandas.DataFrame.from_dict(dictionary)
    data = pandas.concat([data, chunk], join='outer')

    if counter != 1000:
      counter += 1      
    else:
      counter = 0
      write_pandas_df(data)
      data = pandas.DataFrame()
      first = False
      f.data_count = total_count
      session.commit()

    total_count += 1


  # write leftover data if any
  if not data.empty:
    write_pandas_df(data)

  f.data_count = total_count
  session.commit()


  log.info("Found {} items.".format(total_count))

  Session = sessionmaker(bind=engine) 
  for field in f.schema:
    if 'sql' in field:
      session = Session()
      sql_template = open("/opt/laastutabloo/backend/laastutabloo/converter/sql/" + field['sql']).read()
      sql = sql_template.format(tablename=new_table, fieldname=field['column'])
      print(sql)
      session.execute(sql)
      session.commit()

  if f.script_sql:
      session = Session()
      sql = open("/opt/laastutabloo/backend/laastutabloo/converter/sql/" + f.script_sql).read()
      print(sql)
      session.execute(sql)
      session.commit()

  create_views(engine, views)
  if validate_new_table(new_table, f.id):
      session = Session()
      sql = "DROP TABLE IF EXISTS {}_old".format(f.id)
      print(sql)
      session.execute(sql)
      sql = "ALTER TABLE {} RENAME TO {}_old ".format(f.id, f.id)
      print(sql)
      session.execute(sql)
      sql = "ALTER TABLE {} RENAME TO {}".format(new_table, f.id)
      print(sql)
      session.execute(sql)
      session.commit()

def validate_new_table(new_table, old_table):
    return True

    
def convert_shapefile_to_geojson(shp, geojson, encoding=None):
  # read the shapefile
  reader = shapefile.Reader(shp)
  if encoding:
    reader.encoding = encoding
  fields = reader.fields[1:]
  field_names = [field[0] for field in fields]
  buffer = []
  for sr in reader.shapeRecords():
    atr = dict(zip(field_names, sr.record))
    geom = sr.shape.__geo_interface__
    buffer.append(dict(type="Feature", \
                       geometry=geom, properties=atr)) 
   
  # write the GeoJSON file
  with open(geojson, "w") as f:
    try:
      f.write(ujson.dumps({"type": "FeatureCollection",\
                           "features": buffer}, indent=2, ensure_ascii=False))
      #                         "features": buffer}, indent=2, ensure_ascii=False) + "\n")
    except e:
      log.critical("SHP to GeoJSON conversion failed.")
      
    
# Insert given file to postgreSQL
def convert_and_insert_DB(ds, engine, files):
  # Construct path with file object
  filetype = ds.type
  path = files[0]
  data = pandas.DataFrame()

  # Switch-case for file type differentiation, reading to pandas
  try:
    if filetype == 'shapefile':
      for fname in files:
        fpart, ext = os.path.splitext(fname)
        if ext.lower() == '.shp':
          geojson_path = fname + ".geojson"
          convert_shapefile_to_geojson(fname, geojson_path, ds.encoding)
          filetype = 'geojson'
          path = geojson_path
          break
        
    if filetype == 'ods':
      objects = read_ods(path, 1)
      def iter_rows(data):
        for i, row in data.iterrows():
          yield row
      handle_json_records(iter_rows(objects), ds, engine)
      return
    
    if filetype == 'json' or filetype == 'geojson':
      # JSON stream parsing, going from schema given top element

      prefix = ds.converter_top_element
      objects = iter_json_objects(open(path, mode="rb"), prefix)
      try:
        handle_json_records(objects, ds, engine)
      except ijson.common.IncompleteJSONError:
        log.critical("Incomplete JSON.")
      

    elif filetype == 'csv':
      encoding = 'utf-8'
      if ds.encoding:
        encoding = ds.encoding
      kwargs = {}
      if ds.csv_colnames:
        kwargs['names'] = ds.csv_colnames.strip('{}').split(",")
      objects = pandas.read_csv(open(path, "r", encoding=encoding), sep=ds.delimiter, na_filter=False, **kwargs)
      data.fillna('', inplace=True)
      
      def iter_rows(data):
        for i, row in data.iterrows():
          yield row
      handle_json_records(iter_rows(objects), ds, engine)
      return
    
    elif filetype == 'xml':
      dataset = open(path, "rb").read()
      objects = xmltodict.parse(dataset)            
      data = {}
      open(path + "tmp.json","w").write(ujson.dumps(objects))

      prefix = ds.converter_top_element
      objects = iter_json_objects(open(path + "tmp.json", mode='rb'), prefix)
      handle_json_records(objects, ds, engine)
      return
    
      
      
      regex = re.compile("^" + ds.converter_top_element + "$")
      key = '-'
      for prefix, event, value in ijson.parse(open("tmp.json", 'r')):
        match = regex.match(prefix)
        if match and event == 'map_key':  # found new object at the root
          key = value  # mark the key value
          builder = ObjectBuilder()
        elif prefix.startswith(ds.converter_top_element + "." + key):  # while at this key, build the object
          builder.event(event, value)
          if event == 'end_map':  # found the end of an object at the current key, yield
            data[key] = builder.value

      df = pandas.DataFrame.from_dict(data)
      
      # TODO insert in db      
      df.to_sql(ds.id, engine, if_exists='replace', chunksize=1)
    else:
      print ("Bad file type", ds.type)
  except Exception as e:
    log.critical("Cannot convert file: " + path)
    log.exception('Exception:')
    ds.status_converter = 'failed'
    session = inspect(ds).session
    session.commit()
    log.debug("Exception: {}".format(e))


# Run file through pipeline
def pipeline(f, engine):
  # fetch(f)
  #schematize(f)
  convert_and_insert_DB(f, engine, (RAW_FILE_PATH + f.id + "." + f.type, ))


# Main function
# Spawn threads for each file of each dataset
if __name__ == '__main__':
  
  # Read config file and fetch file object for each dataset
  config = ujson.load(open(CONFIG_FILE))

  # PostgreSQL engine
  engine = create_engine("postgresql://" + config["database_user"] + ":" + config["database_password"] + "@localhost/" + config["database_name"], encoding='utf-8')
  
  metadata = MetaData()
  metadata.reflect(engine, only=['datasets2',])

  Base = automap_base(metadata=metadata)                                                                                                           
  Base.prepare(engine)

  Dataset = Base.classes.datasets2
  
  Session = sessionmaker(bind=engine)                                                                                                    
  session = Session()

  # Spawn pipeline threads for each file
  threads = {}
  for ds in session.query(Dataset).all():
    if len(sys.argv) > 1:
      if ds.id not in sys.argv:
        continue

    # entry for the thread is the function pipeline(f, engine)
    t = threading.Thread(target=pipeline, args=(ds, engine)) 
    threads[ds.id] = t
    t.start()
    print ("Spawned thread for file", ds.id)
  
  # Join all finished threads
  for i in threads: 
    threads[i].join()
    print ("Joined thread", i)
