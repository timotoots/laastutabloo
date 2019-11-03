import ijson
from ijson.common import ObjectBuilder
from decimal import Decimal
from converter import iter_json_objects






control = [{'id': '401', 'ujula_id': '257', 'nimetus': 'Abja Spordi- ja Tervisekeskuse suur bassein', 'tyyp': 'Suplemisbassein', 'koormus': '30', 'veevahetustyyp': 'Vee retsirkulatsiooniga', 'pindala': '225', 'ruumala': '281.3', 'ymbermoot': '68', 'min_sygavus': '1.05', 'max_sygavus': '1.45', 'viimane_inspekteerimine': '06.11.2018', 'inspekteerija': 'Margit Matt', 'hinnang': 'vastav', 'hinnangu_kuupaev': '12.06.2019', 'inspektori_markused': None, 'proovivotukohad': {'proovivotukoht': {'id': '5329', 'nimi': 'Suur bassein', 'aadress': 'Abja tee 15, Abja-Paluoja linn, Mulgi vald, Viljandi maakond', 'koordinaadid': None, 'veeallika_liik': 'Basseinivesi', 'proovivotukoha_liik': 'Bassein', 'proovivotukoha_liigitus': None}}}, {'id': '402', 'ujula_id': '257', 'nimetus': 'Abja Spordi- ja Tervisekeskuse suur bassein', 'tyyp': 'Suplemisbassein', 'koormus': '30', 'veevahetustyyp': 'Vee retsirkulatsiooniga', 'pindala': '225', 'ruumala': '281.3', 'ymbermoot': '68', 'min_sygavus': '1.05', 'max_sygavus': '1.45', 'viimane_inspekteerimine': '06.11.2018', 'inspekteerija': 'Margit Matt', 'hinnang': 'vastav', 'hinnangu_kuupaev': '12.06.2019', 'inspektori_markused': None, 'proovivotukohad': {'proovivotukoht': {'id': '5329', 'nimi': 'Suur bassein', 'aadress': 'Abja tee 15, Abja-Paluoja linn, Mulgi vald, Viljandi maakond', 'koordinaadid': None, 'veeallika_liik': 'Basseinivesi', 'proovivotukoha_liik': 'Bassein', 'proovivotukoha_liigitus': None}}}]

i=-1
for i, value in enumerate(iter_json_objects(open('./test_array_in_object.json', 'rb'), root="basseinid.bassein")):
    assert control[i] == value
assert i == 1





control = [{'type': 'Feature', 'id': 'pk_objekt_metsas.0', 'geometry_name': 'shape', 'geometry': {'type': 'LineString', 'coordinates': [[Decimal('25.900531'), Decimal('58.233521')], [Decimal('25.892356'), Decimal('58.206106')]]}, "properties": {
        "avaldatus": "0",
        "foto": "http://pk.rmk.ee/parandkultuur/VS/VS570.jpg",
        "id": 1224259566,
        "invent": "Väino Suigusaar",
        "invent_kpv": "2011-04-27T00:00:00Z",
        "kaart": "PK",
        "kolvik": "Teemaa",
        "kood": "797:MPO:003",
        "koosseis": "Pärandkultuuri märgid NL ajast: piimapukid, tootmishooned, siloaugud",
        "kyla": "Jakobimõisa küla",
        "lahteandmed": "Kohalik elanik, metsatöötaja",
        "maakond": "Viljandi maakond",
        "markused": "Pikk kruusatee. Rajatud maaparanduse käigus.",
        "nimi": "Tee Nevski prospekt",
        "seisund": "Objekt hästi või väga hästi säilinud",
        "sys_id": 17042,
        "tyyp": "Maaparandusobjektid",
        "ulatus": 3000,
        "vald": "Viljandi vald",
        "versioon": 1512695911837.0
      }}, ]

i=-1
for i, value in enumerate(iter_json_objects(open('./test_geojson.json', 'rb'), root="features")):
    assert control[i] == value
assert i == 0





control = [{'id': 1},
           {'id': 2}]
i=-1
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




print("Test run OK.")


