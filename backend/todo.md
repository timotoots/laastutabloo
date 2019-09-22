
Querybuilder:
?

Updater:
* live api parameters
* get file preview with truncate function (after unzipping)
* alerting CRITICAL to e-mail

Converter:
* GRIB parser - ilmateenistus
* XLS parser
* converter validate data
* converter check unicode stuff
* merging tables as sql views
* join tables as sql views (elurikkus - itis)

Database:
* postgres internal tables to "internal" schema
* import should remove all tables in "internal"


Backend:
* backend admin functions behind auth



Curator:
?

Other:
* prefix_suffix translation


Later:
* refactor, comment, clean, security
* export should re-create dataset json files (using provider id as filenames)
* export should re-create provider json files (using provider id as filenames)
* export should re-create query json files (using query id as filenames)



DONE: 
* logimise api
* updater manual trigger
* logging broken links
* updater file comparison
* updater file updated comparison
* updater timers
* converter geom, latlon, geojson conversion
* converter csv column names
* converter manual trigger by id
* scrapy run nupp ei tööta
* api call get_updater_log?dataset_id=avalik_1
* api call run_updater?dataset_id=avalik_1
