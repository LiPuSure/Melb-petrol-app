import findIconUrl from './utils.js'
import getNearbyStations from './searchLocation.js'

const centerCoords = document.querySelector('.center-coords')
const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
const lookupBtn = document.querySelector('.lookup-address-btn')
const centerLocationDiv = document.querySelector('.center-location')

// spotlight code
import { getSpotlight } from './spotlight.js';
const spotlightStation = document.querySelector('.randomStation')
const refreshLink = document.querySelector('.refresh')

refreshLink.addEventListener('click', async () => {
    spotlightData = await getSpotlight()
    spotlightLat = spotlightData.lat
    spotlightLng = spotlightData.lng
})

// data for map coords
let spotlightData
let spotlightLat
let spotlightLng

const form = document.querySelector('.search_location')
// Initialize and add the map
let map;
let markersArray = []

async function initMap(lat, lng) {
  const position = { lat, lng };
  centerCoords.innerHTML = `lat: ${position.lat} <br />lng: ${position.lng}`
  const { Map } = await google.maps.importLibrary("maps");

  // The map
  map = new Map(document.getElementById("map"), {
    zoom: 13,
    minZoom: 8,
    maxZoom: 13,
    center: position,
    mapId: "AUSTRALIA",
  });

  // initial spotlight call
  spotlightData = await getSpotlight()
  spotlightLat = spotlightData.lat
  spotlightLng = spotlightData.lng
  spotlightStation.addEventListener('click', () => goToStation(map,spotlightLat,spotlightLng))
  
  // On Drag End
    google.maps.event.addListener(map, 'dragend', function() { 
        let coord = `lat: ${map.getCenter().toJSON().lat.toFixed(4)} <br />
            lng: ${map.getCenter().toJSON().lng.toFixed(4)}`
        centerCoords.innerHTML = coord
        let addressText = document.querySelector('.center-address')
        if (addressText !== null) {
          addressText.remove()
        }
    });
      
      lookupBtn.addEventListener('click', () => {
        var google_map_position = new google.maps.LatLng( map.getCenter().toJSON().lat.toFixed(4), map.getCenter().toJSON().lng.toFixed(4) );
        var google_maps_geocoder = new google.maps.Geocoder();
        google_maps_geocoder.geocode(
            { 'latLng': google_map_position }, ( results, status ) => {
                let address = results[0].formatted_address
                let addressP = document.createElement('p')
                addressP.className = 'center-address'
                addressP.innerText = address
                centerLocationDiv.appendChild(addressP)
            }
        );
      })
    // initial call to get petrol stations of default bounds
    getMapMarkersAroundPosition(map, position)
    // event listeners for when the map changes by drag
    google.maps.event.addListener(map, 'dragend', () => mapMarkers(map))
    // event listner
    form.addEventListener('submit', getNearbyStations)
}

navigator.geolocation.getCurrentPosition((position) => {
  var lat = position.coords.latitude;
  var lng = position.coords.longitude;
  initMap(lat, lng);
});


function getMapMarkersAroundPosition(map, position) {
  fetch(`/api/stations/nearest/${position.lat}/${position.lng}`)
  .then(res => res.json())
  .then(res => {
    console.log('around',res)
    for (let location of res) {
      let iconImg = document.createElement('img')
      iconImg.classList.add('station_marker')
      iconImg.src = findIconUrl(location.brand_name)
      iconImg.style.width = '40px'
      let position = { lat: location.lat, lng: location.lng}
      let marker = new AdvancedMarkerElement({
          map: map,
          position: position,
          title: location.station_name,
          content: iconImg,
      });
      markersArray.push(marker)
      let contentString = `
        <h1 class="station_name"> ${location.station_name} </h1>
        <p class="content"> ${location.address}, ${location.suburb} <br>
        owner: ${location.brand_name} <br>
        lat: ${location.lat} <br>
        lng: ${location.lng} </p>
        <div class="save">Save star</div>
      `
      const infowindow = new google.maps.InfoWindow({
        content: contentString,
        ariaLabel: location.suburb,
        });
      marker.addListener('click', () => {
        infowindow.open({
          anchor: marker,
          map,
        })
      })
    }
})
}

async function mapMarkers(map) {
  // delete all markers
  for (let marker of markersArray) {
    marker.map = null
  }
  // 

  let topLeft = [map.getBounds().Xh.hi,map.getBounds().Hh.lo]
  let bottomRight = [map.getBounds().Xh.lo,map.getBounds().Hh.hi]

  fetch(`/api/stations/bounds/${topLeft[0]}/${topLeft[1]}/${bottomRight[0]}/${bottomRight[1]}`)
    .then(res => {
      return res.json()})
    .then(res => {
      for (let location of res) {
        let iconImg = document.createElement('img')
        iconImg.classList.add('station_marker')
        iconImg.src = findIconUrl(location.brand_name)
        iconImg.style.width = '40px'
        let position = { lat: location.lat, lng: location.lng}
        let marker = new AdvancedMarkerElement({
            map: map,
            position: position,
            title: location.station_name,
            content: iconImg,
        });
        markersArray.push(marker)
        let contentString = `
          <h1 class="station_name"> ${location.station_name} </h1>
          <p class="content"> ${location.address}, ${location.suburb} <br>
          owner: ${location.brand_name} <br>
          lat: ${location.lat} <br>
          lng: ${location.lng} </p>
          <div class="save">Save star</div>
        `
        const infowindow = new google.maps.InfoWindow({
          content: contentString,
          ariaLabel: location.suburb,
          });
        marker.addListener('click', () => {
          infowindow.open({
            anchor: marker,
            map,
          })
        })
      }
  })
}

