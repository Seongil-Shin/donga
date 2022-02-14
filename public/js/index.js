const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

// 숫자를 받고, 1000단위마다 , 를 추가함
function numberWithCommas(x) {
   return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 8개의 값을 가지는 배열을 받고, 현재 디바이스 사이즈에 맞춰 값을 반환.
function returnVariableByWidth(array) {
   if (matchMedia("screen and (max-width: 450px)").matches) {
      return array[0];
   } else if (matchMedia("screen and (max-width: 640px)").matches) {
      return array[1];
   } else if (matchMedia("screen and (max-width: 768px)").matches) {
      return array[2];
   } else if (matchMedia("screen and (max-width: 1024px)").matches) {
      return array[3];
   } else if (matchMedia("screen and (max-width: 1280px)").matches) {
      return array[4];
   } else if (matchMedia("screen and (max-width: 1546px)").matches) {
      return array[5];
   } else if (matchMedia("screen and (max-width: 1920px)").matches) {
      return array[6];
   } else {
      return array[7];
   }
}

// 객체 깊은 복사를 위한 함수
function deepCopyObject(inObject) {
   var outObject, value, key;
   if (typeof inObject !== "object" || inObject === null) {
      return inObject;
   }
   outObject = Array.isArray(inObject) ? [] : {};
   for (key in inObject) {
      value = inObject[key];
      outObject[key] =
         typeof value === "object" && value !== null
            ? deepCopyObject(value)
            : value;
   }
   return outObject;
}

// 툴팁 밖으로 나갔을때 안으로 넣는 과정 추가
function calcTooltlpLeft(origin) {
   var tooltipLeft = origin;
   if (tooltipLeft + 250 + 2 * rem > window.innerWidth) {
      tooltipLeft -= tooltipLeft + 250 + 2 * rem - window.innerWidth + 10;
   }
   return tooltipLeft;
}

const root = document.getElementById("root");

/* 지도 페이지 */
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

/* 지구본 페이지 */
// 드래그 sensitivity
const sens = 75;

// nations 페이지 상단의 슬라이드 높이
const nations_slideHeight =
   document.querySelector("#nations-container > section.slide").clientHeight +
   20;

// 지구본 확대하는 정도.
var globeScale = returnVariableByWidth([
   150, 200, 250, 200, 200, 250, 300, 350,
]);
// 지구본 확대 정도에 따른 지구본 높이
const globeHeight = {
   150: 300,
   200: 400,
   250: 500,
   300: 600,
   350: 700,
};

// height가 너무 작은 디바이스에서는 적절히 아래로 내림
function getGlobeTranslateYAmount() {
   return (window.innerHeight - globeHeight[globeScale]) / 2 <
      nations_slideHeight
      ? nations_slideHeight + globeHeight[globeScale] / 2
      : window.innerHeight / 2;
}

//Setting projection
var projection = d3
   .geoOrthographic()
   .scale(globeScale)
   .rotate([-127, -37])
   .translate([window.innerWidth / 2, getGlobeTranslateYAmount()])
   .clipAngle(90);

var nationsPath = d3.geoPath().projection(projection);

//SVG container
var nationsSvg = d3.select("svg#nations");

// 툴팁
var nationsCountryTooltip = d3.select("section#countryTooltip");
var nationsCountryTooltipTitle = nationsCountryTooltip.select(".title");
var nationsCountryTooltipCases = nationsCountryTooltip
   .select(".tooltip-content")
   .select(".cases");

// 아이디별로 나눈 나라데이터
var countryById = {};

// 지구본 띄울 그룹 생성
var globeGroup = nationsSvg.append("g");

//Adding water
globeGroup
   .append("path")
   .datum({ type: "Sphere" })
   .attr("class", "water")
   .attr("d", nationsPath);

// 데이터 불러오기
Promise.all([
   fetch("../assets/datas/world-110m.json"),
   fetch("../assets/datas/casesPer1000k.json"),
])
   .then(getCaseDatas)
   .then((res) => ready(res));

async function getCaseDatas(values) {
   return Promise.all([values[0].json(), values[1].json()]);
}

function ready(values) {
   values[1].forEach(function (d) {
      countryById[d.id] = d;
   });

   // 데이터가 없는 국가들
   var countriesUnselectedValues = deepCopyObject(values[0]);
   countriesUnselectedValues.objects.countries.geometries =
      countriesUnselectedValues.objects.countries.geometries.filter(
         (item) => countryById[item.id] === undefined
      );

   // 데이터가 존재하는 국가들
   values[0].objects.countries.geometries =
      values[0].objects.countries.geometries.filter(
         (item) => countryById[item.id] !== undefined
      );

   // 데이터가 존재하는 국가 렌더
   var prevTouchedIdx = 10;
   var countriesSelected = topojson.feature(
      values[0],
      values[0].objects.countries
   ).features;

   globeGroup
      .selectAll("path.land")
      .data(countriesSelected)
      .enter()
      .append("path")
      .attr("class", "land-selected")
      .attr("id", function (d) {
         return "path" + d.id;
      })
      .attr("d", nationsPath)

      //Mouse events
      .on("mouseover", function (d, idx, arr) {
         showNationsTooltip(d);
      })
      .on("mouseout", function (d) {
         hideNationsTooltop();
      })
      .on("mousemove", function (d) {
         nationsCountryTooltip
            .style("left", calcTooltlpLeft(d3.event.pageX + 7) + "px")
            .style("top", d3.event.pageY + 15 + "px");
      })
      .on("touchstart", function (d, touchedIdx, arr) {
         arr[prevTouchedIdx].setAttribute("class", "land-selected");
         arr[touchedIdx].setAttribute(
            "class",
            "land-selected land-selected-fill"
         );
         prevTouchedIdx = touchedIdx;
         showNationsTooltip(d);
      });

   // 데이터가 없는 국가 렌더
   var countriesUnselected = topojson.feature(
      countriesUnselectedValues,
      countriesUnselectedValues.objects.countries
   ).features;

   globeGroup
      .selectAll("path.land")
      .data(countriesUnselected)
      .enter()
      .append("path")
      .attr("class", "land")
      .attr("d", nationsPath);

   //Drag event
   globeGroup.call(
      d3.drag().on("drag", () => {
         hideNationsTooltop();
         const rotate = projection.rotate();
         const k = sens / projection.scale();

         updateProjection(function () {
            projection.rotate([
               rotate[0] + d3.event.dx * k,
               rotate[1] - d3.event.dy * k,
            ]);
         });
      })
   );
}

function showNationsTooltip(data) {
   nationsCountryTooltip
      .style("left", calcTooltlpLeft(d3.event.pageX + 7) + "px")
      .style("top", d3.event.pageY + 15 + "px")
      .style("opacity", 1);
   nationsCountryTooltipTitle.text(countryById[data.id].location);
   nationsCountryTooltipCases.text(countryById[data.id].total_cases);
}

function hideNationsTooltop() {
   nationsCountryTooltip.style("opacity", 0);
}

function updateProjection(updateFunction) {
   updateFunction();
   nationsPath = d3.geoPath().projection(projection);
   nationsSvg.selectAll("path").attr("d", nationsPath);
}

// resize 이벤트 발생시, 지구본 위치 조정
window.addEventListener("resize", nations_handleResize);
function nations_handleResize() {
   updateProjection(function () {
      projection.translate([window.innerWidth / 2, getGlobeTranslateYAmount()]);
   });
}

/* 그래프 페이지 */

// 그래프 마진
const margin = { top: 10, right: 30, bottom: 50, left: 60 };
// 반응형 조절
const casesGraphWidth = returnVariableByWidth([
      window.innerWidth - 100,
      window.innerWidth - 100,
      window.innerWidth - 150,
      window.innerWidth - 250,
      window.innerWidth - 300,
      window.innerWidth - 400,
      window.innerWidth - 600,
      window.innerWidth - 800,
   ]),
   casesGraphHeight = window.innerHeight / 2;

// 그래프 페이지 상단의 슬라이드 높이
const graph_slideHeight =
   document.querySelector("#graph-container > section.slide").clientHeight + 20;

// height가 너무 작은 디바이스에서는 적절히 아래로 내림
function getGraphTranslateYAmount() {
   return (window.innerHeight - casesGraphHeight + margin.top + margin.bottom) /
      2 <
      nations_slideHeight
      ? nations_slideHeight +
           (casesGraphHeight + margin.top + margin.bottom) / 2
      : window.innerHeight / 2;
}

// d3 언어설정
d3.timeFormatDefaultLocale({
   decimal: ".",
   thousands: ",",
   grouping: [3],
   currency: ["$", ""],
   dateTime: "%a %b %e %X %Y",
   date: "%Y/%m/%d",
   time: "%H:%M:%S",
   periods: ["AM", "PM"],
   days: ["일", "월", "화", "수", "목", "금", "토"],
   shortDays: ["일", "월", "화", "수", "목", "금", "토"],
   months: [
      "1월",
      "2월",
      "3월",
      "4월",
      "5월",
      "6월",
      "7월",
      "8월",
      "9월",
      "10월",
      "11월",
      "12월",
   ],
   shortMonths: [
      "1월",
      "2월",
      "3월",
      "4월",
      "5월",
      "6월",
      "7월",
      "8월",
      "9월",
      "10월",
      "11월",
      "12월",
   ],
});

// svg의 너비, 높이 설정하고, g를 붙인 다음 위치를 조정해줌.
d3.select("div.casesGraph-position").attr(
   "style",
   `width:${casesGraphWidth + margin.left + margin.right}px; height:${
      casesGraphHeight + margin.top + margin.bottom
   }px;
   top:${getGraphTranslateYAmount()}px;`
);

var caseGraphSvg = d3
   .select("svg#casesGraph")
   .append("g")
   .attr("transform", `translate(${margin.left}, ${margin.top + 2})`)
   .attr("class", "graphGroup");

// 그래프 조작 설명
d3.select("svg#casesGraph")
   .append("text")
   .text("확대 : 드래그,  초기화 : 더블클릭")
   .attr("x", 10)
   .attr("y", casesGraphHeight + margin.bottom)
   .attr("class", "graphDescription");

// 데이터 선택 옵션

var graphAbsoluteOffset = {
   top:
      window.innerHeight / 2 -
      (casesGraphHeight + margin.top + margin.bottom) / 2 +
      margin.top,
   left:
      window.innerWidth / 2 -
      (casesGraphWidth + margin.left + margin.right) / 2 +
      margin.left,
};

// 옵션 버튼
var selectButton = d3.select("#selectButton");

var casesKoreaPerDay; // 일별 확진자 데이터
var casesKoreaAcc; // 누적 확진자 데이터
var currentData; // 현재 띄우는 데이터
var graph_x, graph_xAxis, graph_y, graph_yAxis, graph_line, graph_brush; // 그래프 축, 라벨, 선, 브러시

//데이터 받아오기
d3.csv(
   "../assets/datas/cases_korea.csv",

   // 받으면, 아래 형식대로 parse하여 넘겨줌.
   function (d) {
      return {
         date: d3.timeParse("%Y-%m-%d")(d.date),
         value: d.value,
         acc: d.acc,
      };
   }
).then(
   // 받은 데이터로 아래 함수 수행
   function (data) {
      // 데이터 저장
      casesKoreaPerDay = data.map((item) => ({
         date: item.date,
         value: item.value,
      }));
      casesKoreaAcc = data.map((item) => ({
         date: item.date,
         value: item.acc,
      }));

      // 맨 처음 데이터는 최근 한달
      currentData = casesKoreaPerDay;

      // x축을 추가
      graph_x = d3.scaleTime().range([0, casesGraphWidth]);
      graph_xAxis = caseGraphSvg
         .append("g")
         .attr("transform", "translate(0," + casesGraphHeight + ")");
      updateXAxis();

      // y축을 추가
      graph_y = d3.scaleLinear().range([casesGraphHeight, 0]);
      graph_yAxis = caseGraphSvg.append("g");
      updateYAxis();

      // 확대시 svg를 벗어나는 그래프가 생기는데, 이를 자르기 위한 clipPath 추가
      caseGraphSvg
         .append("defs")
         .append("svg:clipPath")
         .attr("id", "clip")
         .append("svg:rect")
         .attr("width", casesGraphWidth)
         .attr("height", casesGraphHeight)
         .attr("x", 0)
         .attr("y", 0);

      // 그래프 라인이 들어갈 그룹 추가.
      graph_line = caseGraphSvg
         .append("g")
         .attr("clip-path", "url(#clip)")
         .on("mousemove", mousemove)
         .on("mouseout", mouseout);

      // 그래프 라인 추가
      graph_line
         .append("path")
         .datum(currentData)
         .attr("class", "line")
         .attr("fill", "none")
         .attr(
            "d",
            d3
               .line()
               .x(function (d) {
                  return graph_x(d.date);
               })
               .y(function (d) {
                  return graph_y(d.value);
               })
         )
         .attr("stroke", "#ff6f6e")
         .attr("stroke-width", 2.5);

      // 브러싱 선언.(드래그)
      graph_brush = d3
         .brushX()
         .extent([
            [0, 0],
            [casesGraphWidth, casesGraphHeight],
         ])
         .on("end", updateChart); // 브러싱이 끝날때 chart를 업데이트하여 줌을 구현

      // 선언된 브러시를 그래프에 추가
      graph_line.append("g").attr("class", "brush").call(graph_brush);

      // 드래그 했을시, 선택된 범위로 줌하는 함수
      function updateChart() {
         // 드래그 경계값 가져오기
         extent = d3.event.selection;
         // 드래그 된 곳이 없거나, 0이라면 실행종료
         if (!extent || extent[1] - extent[0] <= 0) {
            return;
         } else {
            mouseout();
            updateXAxis(graph_x.invert(extent[0]), graph_x.invert(extent[1]));
            graph_line.select(".brush").call(graph_brush.move, null); // This remove the grey brush area as soon as the selection has been done
            updateLine(false);
         }
      }

      // 더블클릭되었을때 초기화.
      caseGraphSvg.on("dblclick", initGraph);

      // 터치 이벤트 처리
      graph_line.select(".overlay").on("touchstart", function () {
         mousemove();
         doubletap();
      });

      // hover 시, 그래프에 찍을 점
      var point = caseGraphSvg
         .append("g")
         .append("circle")
         .style("fill", "black")
         .attr("stroke", "black")
         .attr("r", 3)
         .attr("class", "point");

      // hover시, 띄울 엘리먼트
      var caseGraphTooltipContainer = d3.select("div#caseGraphTooltip");
      var caseGraphTooltipTitle = caseGraphTooltipContainer.select(".title");
      var caseGraphTooltipPrefix = caseGraphTooltipContainer.select(".prefix");
      var caseGraphTooltipContent = caseGraphTooltipContainer.select(".cases");

      // 데이터와 x좌표를 받고, 가장 가까운 인덱스를 찾아줌
      var bisect = d3.bisector(function (d) {
         return d.date;
      }).left;

      //마우스 움직임 처리 함수들
      function mousemove() {
         point.style("opacity", 1);
         caseGraphTooltipContainer.style("opacity", 1);

         // 마우스가 올라간 곳의 데이터를 가져옴
         var x0 = graph_x.invert(d3.mouse(d3.event.currentTarget)[0]);
         var i = bisect(currentData, x0, 1);
         selectedData = currentData[i];

         // 가져온 데이터로 툴팁 띄우기
         point
            .attr("cx", graph_x(selectedData.date))
            .attr("cy", graph_y(selectedData.value));
         caseGraphTooltipTitle.text(
            selectedData.date.toISOString().slice(0, 10)
         );
         caseGraphTooltipContent.text(numberWithCommas(selectedData.value));
         caseGraphTooltipContainer
            .style(
               "left",
               calcTooltlpLeft(
                  graphAbsoluteOffset.left + graph_x(selectedData.date)
               ) + "px"
            )
            .style(
               "top",
               graphAbsoluteOffset.top + graph_y(selectedData.value) + 7 + "px"
            );
      }
      function mouseout() {
         point.style("opacity", 0);
         caseGraphTooltipContainer.style("opacity", 0);
      }

      // 옵션이 변경되었을 경우, 이에 반응하는 함수등록
      d3.select("#selectButton").on("change", function () {
         var selectedOption = d3.select(this).property("value");
         updateData(selectedOption);
      });

      // 옵션이 변경되었을 경우, 그래프 업데이트
      function updateData(selectedGroup) {
         if (selectedGroup === "week") {
            currentData = casesKoreaPerDay.slice(-7);
            caseGraphTooltipPrefix.text("국내 일일 확진자 : ");
         } else if (selectedGroup === "month") {
            currentData = casesKoreaPerDay.slice(-30);
            caseGraphTooltipPrefix.text("국내 일일 확진자 : ");
         } else if (selectedGroup === "acc") {
            currentData = casesKoreaAcc.map((item) => item);
            caseGraphTooltipPrefix.text("국내 누적 확진자 : ");
         } else if (selectedGroup === "perDay") {
            currentData = casesKoreaPerDay.map((item) => item);
            caseGraphTooltipPrefix.text("국내 일일 확진자 : ");
         }

         // 새로운 데이터로 축 업데이트
         updateXAxis();
         updateYAxis();

         // 새로운 데이터로 그래프 업데이트
         updateLine(true);
      }
   }
);

function updateXAxis(xmin, xmax) {
   if (xmin && xmax) {
      graph_x.domain([xmin, xmax]);
   } else {
      graph_x.domain([
         currentData[0].date,
         currentData[currentData.length - 1].date,
      ]);
   }
   graph_xAxis
      .transition()
      .call(d3.axisBottom(graph_x).ticks(casesGraphWidth / 70));
}
function updateYAxis() {
   graph_y.domain([
      0,
      d3.max(currentData, function (d) {
         return +d.value;
      }),
   ]);
   graph_yAxis.transition().call(d3.axisLeft(graph_y));
}

// 그래프 라인 업데이트 함수
function updateLine(doDatum) {
   if (doDatum) {
      return graph_line
         .select(".line")
         .datum(currentData)
         .transition()
         .duration(500)
         .attr(
            "d",
            d3
               .line()
               .x(function (d) {
                  return graph_x(d.date);
               })
               .y(function (d) {
                  return graph_y(+d.value);
               })
         );
   } else {
      return graph_line
         .select(".line")
         .transition()
         .duration(500)
         .attr(
            "d",
            d3
               .line()
               .x(function (d) {
                  return graph_x(d.date);
               })
               .y(function (d) {
                  return graph_y(+d.value);
               })
         );
   }
}

// 그래프 초기화 함수
function initGraph() {
   updateXAxis();
   updateLine(false);
}

// 더블 탭했을 시 그래프 초기화하도록 함.
var mylatesttap;
function doubletap() {
   var now = new Date().getTime();
   var timesince = now - mylatesttap;
   if (timesince < 400 && timesince > 0) {
      // double tap
      initGraph();
   }

   mylatesttap = new Date().getTime();
}

/* prevent 페이지 */
const preventImageElements = [
   {
      ele: document.getElementsByClassName("prevent-image-house")[0],
      speed: 1,
      showAt: 1,
      html: "<b>집</b> <br /><br />\
      외출하고 집에 돌아온 뒤에는 손을 씻어야 한다. 흐르는\
      물에 비누로 30초 이상 손을 씻는 것이 좋다. 동거인이\
      감기 증상을 보일 경우 식사를 따로 하고, 수건 등을\
      같이 쓰지 않는 것이 좋다.",
   },
   {
      ele: document.getElementsByClassName("prevent-image-bus")[0],
      speed: 1.4,
      showAt: 26.25,
      html: "<b>대중교통</b> <br /><br />\
      대중교통이 붐비는 출퇴근 시간은 피하고, 가까운 거리를\
      이동할 경우 걷는 것도 좋다. 대중교통을 이용한 뒤에는\
      손소독제를 사용하면 좋다.",
   },
   {
      ele: document.getElementsByClassName("prevent-image-school")[0],
      speed: 1,
      showAt: 54,
      html: "<b>학교</b> <br /><br />\
      등교 전 건강상태를 확인한다. 발열 등 코로나19 의심\
      증상이 있을 경우 등교하지 않는다. 교실에서는 상시\
      마스크를 착용한다. 또한 교실을 수시로 환기하는 것이\
      중요하다.",
   },
];

var pv_lastShowTextIdx = -1;
var prevent_fixedTextEle = document.getElementsByClassName("prevent-fixed")[0];
var prevent_scene = document.getElementsByClassName("prevent-scene")[0];

function handlePreventScroll(e) {
   // 음수면 아직 prevent 페이지보다 위에 있음. 0이상이면 prevent 페이지에 있다는 것.
   const curOffset =
      e.target.scrollTop -
      document.getElementById("prevent-container").offsetTop;

   if (curOffset > 0) {
      // 적절히 이미지를 이동시키고, 텍스트를 띄움.
      preventEntered = true;
      prevent_scene.setAttribute(
         "style",
         `transform: translateX(-${curOffset * 0.2}px)`
      );
      preventImageElements.forEach((item, idx) => {
         item.ele.setAttribute(
            "style",
            `transform: translateX(-${curOffset * item.speed}px)`
         );

         // showAt으로 지정한 위치까지 오면 텍스트를 띄움.
         // 30rem보다 작은 디바이스에서는 fixed 슬라이드에 띄움.
         if (curOffset >= item.showAt * rem && pv_lastShowTextIdx !== idx) {
            if (window.innerWidth <= 30 * rem) {
               prevent_fixedTextEle.innerHTML = item.html;
            } else {
               if (pv_lastShowTextIdx !== -1) {
                  preventImageElements[
                     pv_lastShowTextIdx
                  ].ele.childNodes[1].classList.remove("prevent-show-text");
               }
               item.ele.childNodes[1].classList.add("prevent-show-text");
            }
            pv_lastShowTextIdx = idx;
         }
      });
   } else if (pv_lastShowTextIdx !== -1) {
      // prevent 페이지가 아니면 글자를 지움.
      prevent_fixedTextEle.innerHTML = "";
      preventImageElements[
         pv_lastShowTextIdx
      ].ele.childNodes[1].classList.remove("prevent-show-text");
      pv_lastShowTextIdx = -1;
   }
}

root.addEventListener("scroll", handlePreventScroll);
