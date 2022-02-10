var width = window.innerWidth,
   height = window.innerHeight,
   sens = 75,
   focused;

//Setting projection

var projection = d3
   .geoOrthographic()
   .scale(245)
   .rotate([-127, -37])
   .translate([width / 2, height / 2])
   .clipAngle(90);

var path = d3.geoPath().projection(projection);

//SVG container

var svg = d3.select("svg#nations");

// 툴팁
var countryTooltip = d3.select("div#countryTooltip");
var countryTooltipTitle = countryTooltip.select(".title");
var countryTooltipCases = countryTooltip
   .select(".tooltip-content")
   .select(".cases");

//Adding water
svg.append("path")
   .datum({ type: "Sphere" })
   .attr("class", "water")
   .attr("d", path);

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
   svg.selectAll("path.land")
      .data(countriesUnselected)
      .enter()
      .append("path")
      .attr("class", "land")
      .attr("d", path);

   // 데이터가 존재하는 국가 렌더
   svg.selectAll("path.land")
      .data(countriesSelected)
      .enter()
      .append("path")
      .attr("class", "land-selected")
      .attr("d", path)

      //Mouse events
      .on("mouseover", function (d) {
         countryTooltip
            .style("left", d3.event.pageX + 7 + "px")
            .style("top", d3.event.pageY - 15 + "px")
            .style("display", "block")
            .style("opacity", 1);
         countryTooltipTitle.text(countryById[d.id].location);
         countryTooltipCases.text(countryById[d.id].total_cases);
      })
      .on("mouseout", function (d) {
         countryTooltip.style("opacity", 0).style("display", "none");
      })
      .on("mousemove", function (d) {
         countryTooltip
            .style("left", d3.event.pageX + 7 + "px")
            .style("top", d3.event.pageY - 15 + "px");
      });

   //Drag event
   svg.call(
      d3.drag().on("drag", () => {
         const rotate = projection.rotate();
         const k = sens / projection.scale();
         projection.rotate([
            rotate[0] + d3.event.dx * k,
            rotate[1] - d3.event.dy * k,
         ]);
         path = d3.geoPath().projection(projection);
         svg.selectAll("path").attr("d", path);
      })
   );
}
