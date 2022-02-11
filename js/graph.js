var margin = { top: 10, right: 30, bottom: 50, left: 60 };
var casesGraphWidth = window.innerWidth / 2,
   casesGraphHeight = window.innerHeight / 2; // 반응형 조절

// append the svg object to the body of the page
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

var selectButton = d3
   .select("#selectButton")
   .style("left", graphAbsoluteOffset.left + "px")
   .style("top", graphAbsoluteOffset.top + "px");

var casesKoreaPerDay;
var casesKoreaAcc;

//Read the data
d3.csv(
   "../assets/datas/cases_korea.csv",

   // When reading the csv, I must format variables:
   function (d) {
      return {
         date: d3.timeParse("%Y-%m-%d")(d.date),
         value: d.value,
         acc: d.acc,
      };
   }
).then(
   // Now I can use this dataset:
   function (data) {
      casesKoreaPerDay = data.map((item) => ({
         date: item.date,
         value: item.value,
      }));
      casesKoreaAcc = data.map((item) => ({
         date: item.date,
         value: item.acc,
      }));
      var currentData = casesKoreaPerDay.map((item) => item);
      // Add X axis --> it is a date format
      var x = d3
         .scaleTime()
         .domain(
            d3.extent(currentData, function (d) {
               return d.date;
            })
         )
         .range([0, casesGraphWidth]);
      var xAxis = caseGraphSvg
         .append("g")
         .attr("transform", "translate(0," + casesGraphHeight + ")")
         .attr("class", "myXaxis")
         .call(d3.axisBottom(x));

      // Add Y axis
      var y = d3
         .scaleLinear()
         .domain([
            0,
            d3.max(currentData, function (d) {
               return +d.value;
            }),
         ])
         .range([casesGraphHeight, 0]);
      var yAxis = caseGraphSvg
         .append("g")
         .attr("class", "myYaxis")
         .call(d3.axisLeft(y));

      // Add a clipPath: everything out of this area won't be drawn.
      var clip = caseGraphSvg
         .append("defs")
         .append("svg:clipPath")
         .attr("id", "clip")
         .append("svg:rect")
         .attr("width", casesGraphWidth)
         .attr("height", casesGraphHeight)
         .attr("x", 0)
         .attr("y", 0);

      // Add brushing
      var brush = d3
         .brushX() // Add the brush feature using the d3.brush function
         .extent([
            [0, 0],
            [casesGraphWidth, casesGraphHeight],
         ]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
         .on("end", updateChart); // Each time the brush selection changes, trigger the 'updateChart' function

      // Create the line variable: where both the line and the brush take place
      var line = caseGraphSvg
         .append("g")
         .attr("clip-path", "url(#clip)")
         .on("mouseover", mouseover)
         .on("mousemove", mousemove)
         .on("mouseout", mouseout);

      // Add the line
      line
         .append("path")
         .datum(currentData)
         .attr("class", "line") // I add the class line to be able to modify this line later on.
         .attr("fill", "none")
         .attr("stroke", "#ff6f6e")
         .attr("stroke-width", 2.5)
         .attr(
            "d",
            d3
               .line()
               .x(function (d) {
                  return x(d.date);
               })
               .y(function (d) {
                  return y(d.value);
               })
         );

      // Add the brushing
      line.append("g").attr("class", "brush").call(brush);

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
            x.domain([4, 8]);
         } else {
            x.domain([x.invert(extent[0]), x.invert(extent[1])]);
            line.select(".brush").call(brush.move, null); // This remove the grey brush area as soon as the selection has been done
         }

         // Update axis and line position
         xAxis.transition().duration(1000).call(d3.axisBottom(x));
         line
            .select(".line")
            .transition()
            .duration(1000)
            .attr(
               "d",
               d3
                  .line()
                  .x(function (d) {
                     return x(d.date);
                  })
                  .y(function (d) {
                     return y(d.value);
                  })
            );
      }

      // If user double click, reinitialize the chart
      caseGraphSvg.on("dblclick", function () {
         x.domain(
            d3.extent(currentData, function (d) {
               return d.date;
            })
         );
         xAxis.transition().call(d3.axisBottom(x));
         line
            .select(".line")
            .transition()
            .attr(
               "d",
               d3
                  .line()
                  .x(function (d) {
                     return x(d.date);
                  })
                  .y(function (d) {
                     return y(d.value);
                  })
            );
      });

      // This allows to find the closest X index of the mouse:
      var bisect = d3.bisector(function (d) {
         return d.date;
      }).left;

      // Create the circle that travels along the curve of chart
      var point = caseGraphSvg
         .append("g")
         .append("circle")
         .style("fill", "black")
         .attr("stroke", "black")
         .attr("r", 3)
         .attr("class", "point");

      // Create the text that travels along the curve of chart
      var caseGraphTooltipContainer = d3.select("div#caseGraphTooltip");
      var caseGraphTooltipTitle = caseGraphTooltipContainer.select(".title");
      var caseGraphTooltipContent = caseGraphTooltipContainer.select(".cases");

      // What happens when the mouse move -> show the annotations at the right positions.
      function mouseover() {
         point.style("opacity", 1);
         caseGraphTooltipContainer.style("opacity", 1);
      }
      function mousemove() {
         // recover coordinate we need
         var x0 = x.invert(d3.mouse(this)[0]);
         var i = bisect(currentData, x0, 1);
         selectedData = currentData[i];
         point
            .attr("cx", x(selectedData.date))
            .attr("cy", y(selectedData.value));
         caseGraphTooltipTitle.text(
            selectedData.date.toISOString().slice(0, 10)
         );
         caseGraphTooltipContent.text(numberWithCommas(selectedData.value));

         caseGraphTooltipContainer
            .style(
               "left",
               graphAbsoluteOffset.left + x(selectedData.date) + "px"
            )
            .style(
               "top",
               graphAbsoluteOffset.top + y(selectedData.value) + "px"
            )
            .style("transform", `translate(-55%, -110%)`);
      }
      function mouseout() {
         point.style("opacity", 0);
         caseGraphTooltipContainer.style("opacity", 0);
      }

      d3.select("#selectButton").on("change", function (d) {
         // recover the option that has been chosen
         var selectedOption = d3.select(this).property("value");
         updateData(selectedOption);
      });

      // A function that update the chart
      function updateData(selectedGroup) {
         var dataFilter;
         // Create new data with the selection?
         if (selectedGroup === "week") {
            dataFilter = casesKoreaPerDay.slice(-7);
            currentData = casesKoreaPerDay.slice(-7);
         } else if (selectedGroup === "month") {
            dataFilter = casesKoreaPerDay.slice(-30);
            currentData = casesKoreaPerDay.slice(-30);
         } else if (selectedGroup === "acc") {
            dataFilter = casesKoreaAcc;
            currentData = casesKoreaAcc.map((item) => item);
         } else {
            dataFilter = casesKoreaPerDay;
            currentData = casesKoreaPerDay.map((item) => item);
         }

         x.domain(
            d3.extent(dataFilter, function (d) {
               return d.date;
            })
         );
         caseGraphSvg.selectAll(".myXaxis").transition().duration(2000);

         // create the Y axis
         y.domain([
            0,
            d3.max(dataFilter, function (d) {
               return +d.value;
            }),
         ]);
         caseGraphSvg.selectAll(".myYaxis").transition().duration(2000);

         // Give these new data to update line
         line
            .select(".line")
            .datum(dataFilter)
            .transition()
            .duration(1000)
            .attr(
               "d",
               d3
                  .line()
                  .x(function (d) {
                     return x(d.date);
                  })
                  .y(function (d) {
                     return y(+d.value);
                  })
            )
            .attr("stroke", "#ff6f6e")
            .attr("stroke-width", 2.5);
      }
   }
);
