var rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

function numberWithCommas(x) {
   return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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

/* 맵 화면 자바스크립트 */

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

function handleScrollEvent(e) {
   var scrollTop = e.target.scrollTop;
   var wHeight = window.innerHeight;

   if (scrollTop >= wHeight && scrollTop <= wHeight * 6) {
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
      map.setZoom(8);
   }
}

function addScrollEvent() {
   var root = document.getElementById("root");
   root.addEventListener("scroll", handleScrollEvent);
}

window.addEventListener("load", addScrollEvent);

/* 지구본 화면 자바스크립트 */

var sens = 75,
   focused;

var globeScale = returnVariableByWidth([
   150, 200, 250, 200, 200, 250, 300, 350,
]);

//Setting projection
var projection = d3
   .geoOrthographic()
   .scale(globeScale)
   .rotate([-127, -37])
   .translate([window.innerWidth / 2, window.innerHeight / 2])
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

   var countriesSelected = topojson.feature(
      values[0],
      values[0].objects.countries
   ).features;
   var countriesUnselected = topojson.feature(
      countriesUnselectedValues,
      countriesUnselectedValues.objects.countries
   ).features;

   //Drawing countries on the globe
   // 데이터가 없는 국가 렌더
   globeGroup
      .selectAll("path.land")
      .data(countriesUnselected)
      .enter()
      .append("path")
      .attr("class", "land")
      .attr("d", nationsPath);

   // 데이터가 존재하는 국가 렌더
   var prevTouchedIdx = 10;
   globeGroup
      .selectAll("path.land")
      .data(countriesSelected)
      .enter()
      .append("path")
      .attr("class", "land-selected")
      .attr("d", nationsPath)

      //Mouse events
      .on("mouseover", function (d) {
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

   //Drag event
   globeGroup.call(
      d3.drag().on("drag", () => {
         hideNationsTooltop();
         const rotate = projection.rotate();
         const k = sens / projection.scale();
         projection.rotate([
            rotate[0] + d3.event.dx * k,
            rotate[1] - d3.event.dy * k,
         ]);
         nationsPath = d3.geoPath().projection(projection);
         nationsSvg.selectAll("path").attr("d", nationsPath);
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

/* 그래프 화면 자바스크립트*/

var margin = { top: 10, right: 30, bottom: 50, left: 60 };
var casesGraphWidth = returnVariableByWidth([
      window.innerWidth - 100,
      window.innerWidth - 100,
      window.innerWidth - 150,
      window.innerWidth - 250,
      window.innerWidth - 300,
      window.innerWidth - 400,
      window.innerWidth - 600,
      window.innerWidth - 800,
   ]),
   casesGraphHeight = window.innerHeight / 2; // 반응형 조절

// svg의 너비, 높이 설정하고, g를 붙인 다음 위치를 조정해줌.
var caseGraphSvg = d3
   .select("svg#casesGraph")
   .attr("width", casesGraphWidth + margin.left + margin.right)
   .attr("height", casesGraphHeight + margin.top + margin.bottom)
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
var selectButton = d3
   .select("#selectButton")
   .style("left", graphAbsoluteOffset.left + 10 + "px")
   .style("top", graphAbsoluteOffset.top + "px");

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

      // Add brushing
      graph_brush = d3
         .brushX() // Add the brush feature using the d3.brush function
         .extent([
            [0, 0],
            [casesGraphWidth, casesGraphHeight],
         ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
         .on("end", updateChart); // Each time the brush selection changes, trigger the 'updateChart' function

      // Create the line variable: where both the line and the brush take place
      graph_line = caseGraphSvg
         .append("g")
         .attr("clip-path", "url(#clip)")
         .on("mouseover", mouseover)
         .on("mousemove", mousemove)
         .on("mouseout", mouseout);

      // Add the line
      graph_line
         .append("path")
         .datum(currentData)
         .attr("class", "line") // I add the class line to be able to modify this line later on.
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

      // Add the brushing
      graph_line.append("g").attr("class", "brush").call(graph_brush);

      // A function that update the chart for given boundaries
      function updateChart() {
         // What are the selected boundaries?
         extent = d3.event.selection;
         // If no selection, back to initial coordinate. Otherwise, update X axis domain
         if (!extent || extent[1] - extent[0] <= 0) {
            return;
         } else {
            mouseout();
            updateXAxis(graph_x.invert(extent[0]), graph_x.invert(extent[1]));
            graph_line.select(".brush").call(graph_brush.move, null); // This remove the grey brush area as soon as the selection has been done
         }

         updateLine(false);
      }

      // 더블클릭되었을때 초기화.
      caseGraphSvg.on("dblclick", initGraph);

      // 터치 이벤트 처리
      graph_line.select(".overlay").on("touchstart", function () {
         mouseover();
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
      function mouseover() {
         point.style("opacity", 1);
         caseGraphTooltipContainer.style("opacity", 1);
      }

      function mousemove() {
         // recover coordinate we need
         var x0 = graph_x.invert(d3.mouse(d3.event.currentTarget)[0]);
         var i = bisect(currentData, x0, 1);
         selectedData = currentData[i];

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

         updateXAxis();
         updateYAxis();

         // Give these new data to update line
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
   graph_xAxis.transition().call(d3.axisBottom(graph_x));
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

function initGraph() {
   updateXAxis();
   updateLine(false);
}

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
