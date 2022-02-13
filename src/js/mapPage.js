var wuhanLatLng = { lat: 30.550029315281282, lng: 114.30885603433747 };
var wuhanAirportLatLng = { lat: 30.77355186933909, lng: 114.22007780459478 };
var incheonAirportLatLng = { lat: 37.46298629781097, lng: 126.4400117648823 };
var incheonMedicalCenterLatLng = {
   lat: 37.478662845170916,
   lng: 126.6685341094497,
};

var map;
var marker;

function initMap() {
   map = new google.maps.Map(document.getElementById("map"), {
      zoom: 8,
      tilt: 10,
      center: wuhanLatLng,
      disableDefaultUI: true,
      scrollwheel: false,
      draggable: false,
   });

   marker = new google.maps.Marker({
      position: wuhanLatLng,
      map: map,
   });
}

var canTrigger = [true, true, true, true];
var mapLocation = [
   { zoom: 12, latLng: wuhanLatLng, marker: false },
   { zoom: 13, latLng: wuhanAirportLatLng, marker: true },
   { zoom: 13, latLng: incheonAirportLatLng, marker: true },
   { zoom: 14, latLng: incheonMedicalCenterLatLng, marker: true },
];

const mapContainer = document.getElementById("map-container");
var reachLastSlide = false,
   reachFirstSlide = true;

function handleScrollEvent(e) {
   var scrollTop = e.target.scrollTop;
   var wHeight = window.innerHeight;

   for (let i = 0; i < 4; i++) {
      if (
         scrollTop >= i * wHeight + wHeight * 0.2 &&
         scrollTop <= i * wHeight + wHeight * 0.8 &&
         window.canTrigger[i]
      ) {
         map.setZoom(mapLocation[i].zoom - 1);
         map.panTo(mapLocation[i].latLng);
         setTimeout(() => map.setZoom(mapLocation[i].zoom), 500);

         marker.setVisible(false);
         marker = new google.maps.Marker({
            position: mapLocation[i].latLng,
            map: map,
         });

         canTrigger = canTrigger.map((v, idx) => (idx === i ? false : true));

         if (i === 3) {
            reachLastSlide = true;
            reachFirstSlide = false;
         } else if (i === 0) {
            reachFirstSlide = true;
            reachLastSlide = false;
         }
      }
   }
}
mapContainer.addEventListener("scroll", handleScrollEvent);

var root = document.getElementById("root");
root.addEventListener("scroll", handleScrollForMap);

function handleScrollForMap(event) {
   if (event.target.scrollTop > mapContainer.offsetTop && !reachLastSlide) {
      mapContainer.scrollBy(0, event.target.scrollTop - mapContainer.offsetTop);
      root.scrollTo({ top: mapContainer.offsetTop });
   } else if (
      event.target.scrollTop < mapContainer.offsetTop &&
      !reachFirstSlide
   ) {
      mapContainer.scrollBy(
         0,
         -(mapContainer.offsetTop - event.target.scrollTop)
      );
      root.scrollTo({ top: mapContainer.offsetTop });
   }
}
