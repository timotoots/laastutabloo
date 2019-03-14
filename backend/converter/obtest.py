import ijson
from ijson.common import ObjectBuilder


def objects(file):
    key = '-'
    for prefix, event, value in ijson.parse(file):
        
        print (prefix, event, value)

        if prefix == 'data' and event == 'map_key':  # found new object at the root
            print "yes"
            
            key = value  # mark the key value
            builder = ObjectBuilder()
        elif prefix.startswith("data." + key):  # while at this key, build the object
            builder.event(event, value)
            if event == 'end_map':  # found the end of an object at the current key, yield
                # print builder.value
                print "end"
                yield key, builder.value


for key, value in objects(open('./test2.json', 'rb')):
    pass
    # print(key, value)