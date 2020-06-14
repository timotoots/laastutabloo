SELECT animi, s1._distance, akood, CONCAT('Kaugus: ', _distance, ' km') as last_stop,route,ST_AsGeoJSON(_point), elron_rongid.* as _point
 FROM elron_rongid LEFT JOIN ehak ON ST_Contains(ehak.geom, elron_rongid._point),
 LATERAL (SELECT ST_Distance(ST_Centroid(ehak.geom), ST_SetSRID(ST_Point(lon, lat), 4326)::geography ) as _distance FROM elron_rongid LEFT JOIN ehak ON ST_Contains(ehak.geom, elron_rongid._point)) s1
 WHERE ehak.akood::integer = 614 ORDER BY elron_rongid.last_stop, elron_rongi.route LIMIT 2222222222;
