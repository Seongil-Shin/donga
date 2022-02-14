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

// 맵 초기화
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

   // 맵에 띄울 overlay 정보를 가져오고, 맵에 오버레이를 추가한다.
   fetch("../assets/datas/polygons.json").then(async function (data) {
      const res = await data.json();
      // 가장 바깥쪽 오버레이는 한국, 중국을 모두 포함하도록 크게 그리고,
      // 나머지는 해당하는 곳만 그려서 hole를 만든다.
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

// 같은 이벤트가 같은 페이지에서 여러번 연속으로 발동하지 않도록 함.
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

// 맵 페이지 스크롤 이벤트 처리 함수
// 해당하는 슬라이드마다 적절한 위치로 이동시키며 줌한다.
function handleMapScrollEvent(e) {
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

            // 기존 마커 지우기
            marker.setVisible(false);
            // 새로운 마커 등록
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

root.addEventListener("scroll", handleMapScrollEvent);
