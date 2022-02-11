var casesGraphWidth = window.innerWidth,
   casesGraphHeight = window.innerHeight,
   sens = 75,
   focused;

//Setting projection

var projection = d3
   .geoOrthographic()
   .scale(245)
   .rotate([-127, -37])
   .translate([casesGraphWidth / 2, casesGraphHeight / 2])
   .clipAngle(90);

var nationsPath = d3.geoPath().projection(projection);

//SVG container

var nationsSvg = d3.select("svg#nations");

// 툴팁
var nationsCountryTooltip = d3.select("div#countryTooltip");
var nationsCountryTooltipTitle = nationsCountryTooltip.select(".title");
var nationsCountryTooltipCases = nationsCountryTooltip
   .select(".tooltip-content")
   .select(".cases");

//Adding water
nationsSvg
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

function ready(values) {
   var countryById = {};
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
   nationsSvg
      .selectAll("path.land")
      .data(countriesUnselected)
      .enter()
      .append("path")
      .attr("class", "land")
      .attr("d", nationsPath);

   // 데이터가 존재하는 국가 렌더
   nationsSvg
      .selectAll("path.land")
      .data(countriesSelected)
      .enter()
      .append("path")
      .attr("class", "land-selected")
      .attr("d", nationsPath)

      //Mouse events
      .on("mouseover", function (d) {
         nationsCountryTooltip
            .style("left", d3.event.pageX + 7 + "px")
            .style("top", d3.event.pageY - 15 + "px")
            .style("opacity", 1);
         nationsCountryTooltipTitle.text(countryById[d.id].location);
         nationsCountryTooltipCases.text(countryById[d.id].total_cases);
      })
      .on("mouseout", function (d) {
         nationsCountryTooltip.style("opacity", 0);
      })
      .on("mousemove", function (d) {
         nationsCountryTooltip
            .style("left", d3.event.pageX + 7 + "px")
            .style("top", d3.event.pageY - 15 + "px");
      });

   //Drag event
   nationsSvg.call(
      d3.drag().on("drag", () => {
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
