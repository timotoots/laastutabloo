


def get_wms_url(wms_url, service, layer, count = 0):

    if wms_url and service and layer:
        
        if service=="wms":

            url = wms_url
            url += "?service=WMS"
            url += "&version=1.3.0"
            url += "&request=GetMap"
            url += "&layers=" + layer
            url += "&styles="
            # url += "&bbox=57.47267905667945,21.45187502623414,59.84501069564773,28.45838952388184"
            url += "&bbox=57.9227248,25.82223,58.4651218,27.038981"


            url += "&width=1200&height=300"
            url += "&srs=EPSG:4326"
            url += "&format=application/json;type=geojson"
            if count > 0:
                url += "&feature_count=" + str(count)
            return url

        elif service=="wfs":
            
            url = wms_url
            url += "?service=WFS&version=2.0.0"
            url += "&request=GetFeature"
            url += "&typeName=" + layer
            url += "&srsName=EPSG:4326"
            url += "&outputFormat=application/json"
            if count > 0:
                url += "&count=" + str(count)
            
            return url

    return False

def wms_get_capabilities(url,service):
    import requests
    from lxml import etree
    from json import dumps
    from xmljson import badgerfish as bf

    url = url + "?service=" + service + "&version=2.0.0&request=GetCapabilities"
    r = requests.get(url)
    return dumps(bf.data(etree.fromstring(r.text.encode("utf-8"))))



    

if __name__ == '__main__':
    url = get_wms_url("www.ee","wms","test",0)
    print (url)
