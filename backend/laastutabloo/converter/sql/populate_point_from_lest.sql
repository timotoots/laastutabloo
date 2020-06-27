SELECT AddGeometryColumn('{tablename}', '{fieldname}', 4326, 'POINT', 2);

UPDATE {tablename}  SET {fieldname} = ST_TRANSFORM(St_SetSRID(ST_MakePoint("lest_x"::float, "lest_y"::float), 3301), 4326);

