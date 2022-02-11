var margin = { top: 10, right: 30, bottom: 50, left: 60 };
var casesGraphWidth = window.innerWidth / 2,
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
   .style("left", graphAbsoluteOffset.left + "px")
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

      // A function that set idleTimeOut to null
      var idleTimeout;
      function idled() {
         idleTimeout = null;
      }

      // A function that update the chart for given boundaries
      function updateChart() {
         // What are the selected boundaries?
         extent = d3.event.selection;

         // If no selection, back to initial coordinate. Otherwise, update X axis domain
         if (!extent) {
            if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350)); // This allows to wait a little bit
            graph_x.domain([4, 8]);
            updateXAxis(4, 8);
         } else {
            updateXAxis(graph_x.invert(extent[0]), graph_x.invert(extent[1]));
            graph_line.select(".brush").call(graph_brush.move, null); // This remove the grey brush area as soon as the selection has been done
         }

         updateLine(false);
      }

      // 더블클릭되었을때 초기화.
      caseGraphSvg.on("dblclick", function () {
         updateXAxis();
         updateLine(false);
      });

      // 마우스가 그래프 위에 있을때, 가장 가까운 x를 찾아줌
      var bisect = d3.bisector(function (d) {
         return d.date;
      }).left;

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

      //마우스 움직임 처리 함수들
      function mouseover() {
         point.style("opacity", 1);
         caseGraphTooltipContainer.style("opacity", 1);
      }
      function mousemove() {
         // recover coordinate we need
         var x0 = graph_x.invert(d3.mouse(this)[0]);
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
               graphAbsoluteOffset.left + graph_x(selectedData.date) + "px"
            )
            .style(
               "top",
               graphAbsoluteOffset.top + graph_y(selectedData.value) + "px"
            )
            .style("transform", `translate(-55%, -110%)`);
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
