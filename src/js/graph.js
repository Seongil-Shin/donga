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
