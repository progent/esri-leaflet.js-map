var marker = null;
var mymap;

mymap = L.map('map', {
    keyboard: false
}).setView([18.4821132, -69.9141826], 18);

L.esri.basemapLayer('Imagery').addTo(mymap);

mymap.setMaxZoom(19);
mymap.options.minZoom = 8;

mymap.on('click', function (e) {
    addMarker(e);
});

addMarker = function addMarker(e, callback) {
    if (marker === null) {
        var redIcon = new L.Icon({
            iconUrl: '../resources/icons/marker.png',
            iconSize: [41, 41],
            iconAnchor: [12, 41],
            popupAnchor: [9, -24],
            shadowSize: [41, 41]
        });

        marker = new L.marker(e.latlng, {
            icon: redIcon, draggable: true
        }).addTo(mymap);

        if (e.latlng.lng !== undefined) {
            marker.bindPopup(e.latlng.lat + " , " + e.latlng.lng);
            marker.openPopup();
        }

        mymap.setView(e.latlng, 18);

        marker.on('dragend', function (e) {
            var newPosition = e.target.getLatLng();
            marker.bindPopup(newPosition.lat + " , " + newPosition.lng );
            marker.openPopup();
        });
        if (callback) {
            var lon = e.latlng.lon === undefined ? e.latlng.lng : e.latlng.lon;
            callback(e.latlng.lat, lon);
        }
    } else {
        removeMarker()
    }
}

removeMarker = function removeMarker() {
    if (marker !== null) {
        mymap.removeLayer(marker);
        marker = null;
    }
}
