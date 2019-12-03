
* Query:
** TODO output=geojson

* Updater:
** TODO #3 live api parameters
** TODO get file preview with truncate function (after unzipping), api endpoint: /get_dataset_raw
** TODO alerting CRITICAL to e-mail, push notification

* Converter:
** TODO spider timeout per dataset
*** new conf option 'timeout_min', config/timeout_conf.json
** TODO GRIB parser - ilmateenistus
** TODO url build script, make starting url dynamic
** TODO XLS parser
** TODO converter check unicode stuff
** TODO converter validate data, compare with previous version, check against schema
** TODO merging tables as sql views
** TODO join tables as sql views (elurikkus - itis)

* Database:
** TODO postgres internal tables to "internal" schema, data in "data"
** TODO import should remove all tables in "data"


* Backend:
** TODO backend admin functions behind auth
** TODO #1 catch 500 internal error


* Curator:
 ?

* Other:
** TODO prefix_suffix translation


* Later:
** TODO refactor, comment, clean, security
** TODO export should re-create dataset json files (using provider id as filenames)
** TODO export should re-create provider json files (using provider id as filenames)
** TODO export should re-create query json files (using query id as filenames)



* DONE: 
** logimise api
** updater manual trigger
** logging broken links
** updater file comparison
** updater file updated comparison
** updater timers
** converter geom, latlon, geojson conversion
** converter csv column names
** converter manual trigger by id
** scrapy run nupp ei tööta
** api call get_updater_log?dataset_id=avalik_1
** api call run_updater?dataset_id=avalik_1

