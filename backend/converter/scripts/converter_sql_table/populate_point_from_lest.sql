SELECT AddGeometryColumn('{tablename}', '{fieldname}', 4326, 'POINT', 2);

UPDATE {tablename}  SET {fieldname} = ST_TRANSFORM(St_SetSRID(ST_MakePoint("lest_y"::float, "lest_x"::float), 3301), 4326) WHERE "lest_x" != '' AND "lest_y" != '';

