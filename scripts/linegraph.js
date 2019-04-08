var TRANSITION_TIME = 200;
var DOT_SIZE = 4;
var margin = {top: 25, right: 35, bottom: 90, left: 30};
var width = 800 - margin.left - margin.right;
var height = 500 - margin.left - margin.right;

var cValue = function(d) { return d.year; };
var color = d3.scale.category10();

// load data
d3.json("../files/years_since_birth.json", function(error, data) {


  data.forEach(function(d) {
    d.year = new Date(d['year'])
    d.yearsPassed = d['years_passed'];
  });
  data.sort(function(a,b) { return b.year - a.year; });

  console.log(data)

  // don't want dots overlapping axis, so add in buffer to data domain
  linegraph.xRange.domain([d3.min(data, linegraph.x), d3.max(data, linegraph.x)]);
  linegraph.y1Range.domain([0, d3.max(data, linegraph.y1)+1]);
  linegraph.y2Range.domain([0, 100]);
  linegraph.y3Range.domain([0, 100]);

  linegraph.drawXAxis();
  linegraph.drawY1Axis();
  linegraph.drawGraph1(data);

});


var linegraph = {

  x : function(d) { return d.year; },
  y1 : function(d) { return d.yearsPassed; },
  y2 : function(d) { return d.metascore; },
  y3 : function(d) { return d.myScore; },

  xRange : d3.time.scale().range([0, width]),
  y1Range : d3.scale.linear().range([height, 0]),
  y2Range : d3.scale.linear().range([height, 0]),
  y3Range : d3.scale.linear().range([height, 0]),

  tooltip : d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0),

  tip : d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function (d) {
      return "<strong>" + d.year + ":</strong> <span></span>";
    }),

  graph :
    d3.select(".linegraph").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
  ,

  drawGraph1 : function(data) {

    this.graph.call(this.tip);

    var lines = d3.svg.line()
      .x(function(d) {
        return this.xRange(this.x(d));
      }.bind(this))
      .y(function(d) {
        return this.y1Range(this.y1(d));
      }.bind(this))
      .interpolate('linear');

    this.graph.append("g")
      .attr("class", "linegraph1").append("path")
        .attr("d", lines(data))
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("fill", "none");

    this.graph.select(".linegraph1")
      .selectAll()
        .data(data)
      .enter().append("circle")
        .attr("class", "dot dot1")
        .attr("fill", "white")
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("r", DOT_SIZE)
        .attr("cx", function(d) { return this.xRange(this.x(d)); }.bind(this))
        .attr("cy", function(d) { return this.y1Range(this.y1(d)); }.bind(this))
        .on("mouseover", function(d) {

            this.tooltip.html("<strong>" + d.fullTitle + "</strong><br/>"
                + "IMDb Rating: " + this.y1(d))
              .style("left", (d3.event.pageX + 5) + "px")
              .style("top", (d3.event.pageY - 31) + "px")
              .transition()
              .duration(200)
              .style("opacity", .75);

            this.focusDot(d.year);

            this.tip.show();

        }.bind(this))
        .on("mouseout", function(d) {

          this.tooltip.transition()
            .duration(200)
            .style("opacity", 0);

          this.unfocusDot(d.year);

          this.tip.hide();
        }.bind(this));
  },

  drawGraph2 : function(data) {
    var lines = d3.svg.line()
      .x(function(d) {
        return this.xRange(this.x(d));
      }.bind(this))
      .y(function(d) {
        return this.y2Range(this.y2(d));
      }.bind(this))
      .interpolate('linear');

    this.graph.append("path")
        .attr("d", lines(data))
        .attr("stroke", "green")
        .attr("stroke-width", 1)
        .attr("fill", "none");
    this.graph.selectAll()
        .data(data)
      .enter().append("circle")
        .attr("class", "dot dot2")
        .attr("fill", "green")
        .attr("r", 3)
        .attr("cx", function(d) { return this.xRange(this.x(d)); }.bind(this))
        .attr("cy", function(d) { return this.y2Range(this.y2(d)); }.bind(this))
        .on("mouseover", function(d) {

            this.tooltip.html("<strong>" + d.fullTitle + "</strong><br/>"
                + "Metascore: " + this.y2(d))
              .style("left", (d3.event.pageX + 5) + "px")
              .style("top", (d3.event.pageY - 31) + "px")
              .transition()
              .duration(200)
              .style("opacity", .75);

            this.focusDot(d.fullTitle);

        }.bind(this))
        .on("mouseout", function(d) {
          this.tooltip.transition()
            .duration(200)
            .style("opacity", 0);
        }.bind(this));
  },

  drawGraph3 : function(data) {
    var lines = d3.svg.line()
      .x(function(d) {
        return this.xRange(this.x(d));
      }.bind(this))
      .y(function(d) {
        return this.y3Range(this.y3(d));
      }.bind(this))
      .interpolate('linear');

    this.graph.append("path")
        .attr("d", lines(data))
        .attr("stroke", "red")
        .attr("stroke-width", 1)
        .attr("fill", "none");
    this.graph.selectAll()
        .data(data)
      .enter().append("circle")
        .attr("class", "dot dot3")
        .attr("fill", "red")
        .attr("r", 3)
        .attr("cx", function(d) { return this.xRange(this.x(d)); }.bind(this))
        .attr("cy", function(d) { return this.y3Range(this.y3(d)); }.bind(this))
        .on("mouseover", function(d) {

            this.tooltip.html("<strong>" + d.fullTitle + "</strong><br/>"
                + "My Score: " + this.y3(d))
              .style("left", (d3.event.pageX + 5) + "px")
              .style("top", (d3.event.pageY - 31) + "px")
              .transition()
              .duration(200)
              .style("opacity", .75);

            this.focusDot(d.fullTitle);

        }.bind(this))
        .on("mouseout", function(d) {
          this.tooltip.transition()
            .duration(200)
            .style("opacity", 0);
        }.bind(this));
  },

  drawXAxis : function() {
    this.graph.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.svg.axis().scale(this.xRange).orient("bottom"));
  },

  drawY1Axis : function() {
    this.graph.append("g")
        .attr("class", "y1 axis")
        .call(d3.svg.axis().scale(this.y1Range).orient("left"))
      .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Years Passed");
  },

  drawY2Axis : function() {
    this.graph.append("g")
        .attr("class", "y2 axis")
        .attr("transform", "translate(" + width + ", 0)")
        .call(d3.svg.axis().scale(this.y2Range).orient("right"))
      .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(90)")
        .attr("y", 13)
        .style("text-anchor", "start")
        .text("Metascore");
  },

  focusDot : function(year) {
    this.graph.selectAll(".dot")
        .filter(function(d) { return d.year === year; })
        .transition()
        .duration(TRANSITION_TIME)
        .attr("r", 6);
  },

  unfocusDot : function(year) {
    this.graph.selectAll(".dot")
        .filter(function(d) { return d.year === year; })
        .transition()
        .duration(TRANSITION_TIME)
        .attr("r", DOT_SIZE);
  }

};
