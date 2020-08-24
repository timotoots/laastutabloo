SELECT AddGeometryColumn('{tablename}', '{fieldname}', 4326, 'POINT', 2);

UPDATE {tablename}  SET {fieldname} = ST_TRANSFORM(St_SetSRID(ST_MakePoint("lon"::float, "lat"::float), 4326), 4326) WHERE "lat"::float IS NOT NULL AND "lon"::float IS NOT NULL;

