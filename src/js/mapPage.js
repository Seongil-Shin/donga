const wuhanLatLng = { lat: 30.59647608061125, lng: 114.30766435550818 };
const wuhanAirportLatLng = { lat: 30.77355186933909, lng: 114.22007780459478 };
const incheonAirportLatLng = { lat: 37.46298629781097, lng: 126.4400117648823 };
const incheonMedicalCenterLatLng = {
   lat: 37.478662845170916,
   lng: 126.6685341094497,
};
30.59647608061125, 114.30766435550818;
var map;
var marker;

function initMap() {
   map = new google.maps.Map(document.getElementById("map"), {
      zoom: 8,
      tilt: 10,
      center: wuhanLatLng,
      disableDefaultUI: true,
      draggable: false,
      scrollable: false,
   });

   marker = new google.maps.Marker({
      position: wuhanLatLng,
      map: map,
   });

   fetch("../assets/datas/polygons.json").then(async function (data) {
      const res = await data.json();
      const bermudaTriangle = new google.maps.Polygon({
         paths: [
            [
               { lat: 39.2269791853057, lng: 101.5990105417349 },
               { lat: 41.31746965387336, lng: 136.73888720227237 },
               { lat: 24.588422898812478, lng: 136.8194832496589 },
               { lat: 24.588422898812478, lng: 100.55126192570971 },
            ],
            // 우한시
            res.wuhan,
            res.wuhanAirport,
            res.incheonAirport,
            [
               // 인천 병원
               { lat: 37.478488733535436, lng: 126.66753531892762 },
               { lat: 37.47784831453108, lng: 126.66878887168434 },
               { lat: 37.47824319804417, lng: 126.66910784185147 },
               { lat: 37.47820016596777, lng: 126.66918758439323 },
               { lat: 37.47872667437579, lng: 126.66961181471548 },
               { lat: 37.47942783606341, lng: 126.66828808852199 },
            ],
         ],
         strokeColor: "black",
         strokeOpacity: 0.33,
         strokeWeight: 1,
         fillColor: "black",
         fillOpacity: 0.33,
      });

      bermudaTriangle.setMap(map);
   });
}

var canTrigger = [true, true, true, true];
var mapLocation = [
   { zoom: 12, latLng: wuhanLatLng, marker: false },
   {
      zoom: 13,
      latLng: wuhanAirportLatLng,
      marker: true,
   },
   { zoom: 13, latLng: incheonAirportLatLng, marker: true },
   { zoom: 16, latLng: incheonMedicalCenterLatLng, marker: true },
];

function handleScrollEvent(e) {
   var scrollTop = e.target.scrollTop;
   var wHeight = window.innerHeight;

   if (scrollTop < wHeight) {
      canTrigger = canTrigger.map((v) => true);
      map.setZoom(8);
   } else if (scrollTop >= wHeight && scrollTop < wHeight * 6) {
      for (let i = 0; i < 4; i++) {
         if (
            scrollTop >= (i + 1) * wHeight + wHeight * 0.2 &&
            scrollTop <= (i + 1) * wHeight + wHeight * 0.8 &&
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
         }
      }
   } else {
      canTrigger = canTrigger.map((v) => true);
      map.setZoom(15);
   }
}

root.addEventListener("scroll", handleScrollEvent);
