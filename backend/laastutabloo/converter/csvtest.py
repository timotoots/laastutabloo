from sqlalchemy import create_engine, Table, Column, String, Integer, Float, Boolean

# Define a new table with a name, count, amount, and valid column: data
#data = Table('data', metadata,
#             Column('name', String(255)),
#             Column('count', Integer()),
#             Column('amount', Float()),
#             Column('valid', Boolean())
3#)

# Use the metadata to create the table
#metadata.create_all(engine)

# Print table details
#print(repr(data))


###########################################





import ujson, csv

CONFIG_FILE = '../config/config.json'
RAW_FILE_PATH = '../data/raw/'
config = ujson.load(open(CONFIG_FILE))
f={}
f["delimiter"] = "\t"
f["id"] = "vara_1"
filetype = "csv"
path = RAW_FILE_PATH + f["id"] + "." + filetype
reader = csv.reader(open(path), delimiter=f["delimiter"])
engine = create_engine("postgresql://" + config["database_user"] + ":" + config["database_password"] + "@localhost/" + config["database_name"])

counter=0
data=[]
first = True
for row in reader:

  # Every 100 record, write to db
  if counter != 100:
    data.append(row)
    counter += 1

  else:
    # First time writing to db has to replace table
    if first:
      engine.execute("DROP TABLE IF EXISTS " + f["id"] + ";")
      engine.execute(" CREATE TABLE " + f["id"] + "(" + str([i + " varchar" for i in data[0]])[1:-1].replace("'", "") + ");")
      engine.execute(" INSERT INTO " + f["id"] + "(" + str(data[0])[1:-1].replace("'", "") + ")" + " VALUES (" + str(data[1])[1:-1] + ");")
      first = False
    
    # Append dataframe to db
    else:
      engine.execute("INSERT INTO " + f["id"] + "(" + str(data[0])[1:-1].replace("'", "") + ")" + " VALUES (" + str(data[1])[1:-1] + ");")

# append last chunk
if counter % 100 != 0:
  engine.execute("INSERT INTO" + f["id"] + "(" + str(data[0])[1:-1].replace("'", "") + ")" + " VALUES (" + str(data[1])[1:-1] + ");")



