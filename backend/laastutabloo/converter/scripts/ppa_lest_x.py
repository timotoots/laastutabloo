from pyproj import transform, Proj

def ppa_lest_x(data):
        coord_x = data["Lest_X"].split("-")
        coord_x = ( int(coord_x[0]) + int(coord_x[1]) )/2

        coord_y = data["Lest_Y"].split("-")
        coord_y = ( int(coord_y[0]) + int(coord_y[1]) )/2
        
        p1 = Proj(init='epsg:3301')
        p2 = Proj(init='epsg:4326')
        lat, lon = transform(p1,p2,coord_x,coord_y)
        return lon
