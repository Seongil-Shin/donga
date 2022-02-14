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
