from pyproj import transform, Proj

def ppa_lest_y(data):
	coord_x = data["lest_x"].split("-")
	coord_x = ( int(coord_x[0]) + int(coord_x[1]) )/2

	coord_y = data["lest_y"].split("-")
	coord_y = ( int(coord_y[0]) + int(coord_y[1]) )/2
	
	p1 = Proj(init='epsg:3301')
	p2 = Proj(init='epsg:4326')
	lat, lon = transform(p1,p2,coord_x,coord_y)
	print lat
	
	return lat
