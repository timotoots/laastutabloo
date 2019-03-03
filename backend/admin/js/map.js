	
	var start_geojson = {
            "geometry": {
                "type": "Point",
                "coordinates": [
                   25.238651,
                    58.6072058 
                ]
            },
            "type": "Feature",
            "properties": {
                "popupContent": "This is a B-Cycle Station. Come pick up a bike and pay by the hour. What a deal!"
            },
            "id": 74
        };//////////////////////////////////////////////////////////

        

	var map = L.map('map').setView([58.6072058,25.238651], 7);

	//////////////////////////////////////////////////////////

	L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox.light'
	}).addTo(map);

    L.Control.boxzoom({ position:'topleft' }).addTo(map);

	//////////////////////////////////////////////////////////

	var baseballIcon = L.icon({
		iconUrl: 'baseball-marker.png',
		iconSize: [32, 37],
		iconAnchor: [16, 37],
		popupAnchor: [0, -28]
	});

	//////////////////////////////////////////////////////////

	function onEachFeature(feature, layer) {


		var popupContent = "";
		for(var key in feature.properties){
			popupContent += "<b>" + key + ":</b> " + feature.properties[key] + "<br/>";
		}

		layer.bindPopup(popupContent);
	}

	//////////////////////////////////////////////////////////

	var layer = "";

	function addGeoJSON(data){

		if(layer == ""){

			layer = L.geoJSON(data, {

				style: function (feature) {
					return feature.properties && feature.properties.style;
				},

				onEachFeature: onEachFeature,

				pointToLayer: function (feature, latlng) {
					return L.circleMarker(latlng, {
						radius: 6,
						fillColor: "#ff7800",
						color: "#000",
						weight: 1,
						opacity: 1,
						fillOpacity: 0.8
					});
				}
			}).addTo(map);
		} else {
			layer.addData(data);
		}

		map.fitBounds(layer.getBounds());

	}

	//////////////////////////////////////////////////////////

	function loadGeoJson(url){

		// var url = "eelis-pk_objekt_metsas.json";
		// var url = "http://www.laastutabloo.ee:5000/run_query_geojson?query_id=geojson_from_ehak&val1='animi,onimi'&val2=1586"
		// var url = "http://www.laastutabloo.ee:5000/run_query_geojson?query_id=geojson_from_avalik&val1='SyndmusLiik,JuhtumId'&val2=1586"
		// var url = "http://www.laastutabloo.ee:5000/run_query_geojson?query_id=geojson_from_avalik&val1='SyndmusLiik,JuhtumId'&val2=8151"
		// url = 'leaflet_example.json';

 		$.getJSON(url, function(data) {
          	console.log(data);
			addGeoJSON(data);
		});
					
	}


	