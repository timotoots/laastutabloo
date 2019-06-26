CREATE or replace FUNCTION geojson_from_ehak(s text, ehak int) RETURNS text AS $$ 
rec = plpy.execute("""
SELECT row_to_json(fc)
FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
   FROM (SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom, 4)::json As geometry
    , row_to_json((SELECT l FROM (SELECT %s) As l
      )) As properties
   FROM ehak As lg WHERE lg.akood='%d' ) As f ) As fc; """ % (str(s), int(ehak)))
return rec[0]['row_to_json']
$$
LANGUAGE plpythonu SECURITY DEFINER;



CREATE or replace FUNCTION geojson_from_table(tablename text, s text, ehak int) RETURNS text AS $$ 
rec = plpy.execute("""
SELECT row_to_json(fc)
FROM ( SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features
   FROM (SELECT 'Feature' As type
    , ST_AsGeoJSON(lg.geom, 4)::json As geometry
    , row_to_json((SELECT l FROM (SELECT %s) As l
      )) As properties
   FROM %s As lg WHERE lg.ehak_akood='%d' ) As f ) As fc;""" % (str(s), str(tablename), int(ehak)))
return rec[0]['row_to_json']
$$
LANGUAGE plpythonu SECURITY DEFINER;

