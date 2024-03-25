<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue"
import L from "leaflet"
import "leaflet-search"
import "leaflet/dist/leaflet.css"
import "leaflet-search/dist/leaflet-search.min.css"

L.Icon.Default.imagePath =
  process.env.NODE_ENV === "production"
    ? "/images/leaflet/"
    : "/node_modules/leaflet/dist/images/"

const mapContainer = ref(null)
let mymap = null

onMounted(() => {
  mymap = L.map(mapContainer.value).setView([32.3314, -117.0504], 15)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(mymap)

  // Add search control
  const searchControl = new L.Control.Search({
    url: "http://nominatim.openstreetmap.org/search?format=json&q={s}",
    jsonpParam: "json_callback",
    propertyName: "display_name",
    propertyLoc: ["lat", "lon"],
    marker: L.marker([0, 0]),
    autoCollapse: true,
    autoType: false,
    minLength: 2,
  })
  mymap.addControl(searchControl)

  mymap.on("moveend", searchInView)

  searchInView()
})

function getPaymentMethods(element) {
  let methods = []
  if (element.tags["payment:hive"] === "yes") methods.push("Hive")
  if (element.tags["payment:hbd"] === "yes") methods.push("HBD")
  if (element.tags["payment:lightning"] === "yes") methods.push("BTC Lightning")
  return methods.join(", ")
}

function searchInView() {
  const bounds = mymap.getBounds()
  const overpassUrl = "https://overpass-api.de/api/interpreter"
  const overpassQuery = `
    [out:json];
    (
      node["payment:hive"="yes"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
      node["payment:hbd"="yes"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
      node["payment:lightning"="yes"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
    );
    out body;
  `

  fetch(overpassUrl + "?data=" + encodeURIComponent(overpassQuery))
    .then((response) => response.json())
    .then((data) => {
      for (let element of data.elements) {
        if (element.lat && element.lon) {
          const marker = L.marker([element.lat, element.lon]).addTo(mymap)
          const name = element.tags.name || "Unnamed"
          const type = element.tags.amenity
            ? capitalizeFirstLetter(element.tags.amenity)
            : "Unknown"
          const url = `https://www.openstreetmap.org/node/${element.id}`
          const paymentMethods = getPaymentMethods(element)
          marker.bindPopup(
            `<b>${name}</b><br>${type}<br>Accepts: ${paymentMethods}<br><a href="${url}" target="_blank">View on OpenStreetMap</a>`
          )
        }
      }
    })
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
}

onUnmounted(() => {
  mymap.off("moveend", searchInView)
  mymap.remove()
})
</script>

<style scoped>
.map-container {
  height: 100vh; /* Adjust as needed */
  width: 100%;
}
</style>
