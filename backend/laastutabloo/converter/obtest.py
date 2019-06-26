import ijson
from ijson.common import ObjectBuilder

from converter import iter_json_objects

control = [{'id': 1},
           {'id': 2}]

for i, value in enumerate(iter_json_objects(open('./test_object.json', 'rb'))):
    assert control[i] == value
assert i == 1

control = [{'id': 1, 'type':3},
           {'id': 2, 'asd': [1,2,3]} ]

for i, value in enumerate(iter_json_objects(open('./test_array.json', 'rb'))):
    assert control[i] == value
assert i == 1
    
control = [{'id': 1},
           {'id': 2, 'asd': [1,2,3]} ]

i = 0
for i, value in enumerate(iter_json_objects(open('./test3.json', 'rb'), root="data")):
    assert control[i] == value
assert i == 1


control = [{'id': 1},
           {'id': 2}]

i=0
for i, value in enumerate(iter_json_objects(open('./test4.json', 'rb'), root="data")):
    assert control[i] == value
assert i == 1

i=0
for i, value in enumerate(iter_json_objects(open('./test5.json', 'rb'), root="data.data2")):
    assert control[i] == value
assert i == 1
