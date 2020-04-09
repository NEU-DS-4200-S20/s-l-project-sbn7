// Immediately Invoked Function Expression to limit access to our 
// variables and prevent 
((() => {

  const dispatchString = "selectionUpdated"

  // set general variable for the map
  var width = 950;
  var height = 500;
  var scale = 5500;

  // select the map svg
  var svg = d3.select("#map-svg")
    .attr("width", width)
    .attr("height", height);

  // make the projection for the map
  var projection = d3.geoAlbers()
    .translate([width/2, height/2])
    .center( [24.25, 43] )
    .scale(scale);

  var path = d3.geoPath().projection(projection)

  // read the json data for states and zip codes, read csv vendor data
  d3.json("data/states.geojson", function(states) {
    d3.json("data/zips.geojson", function(zips) {
      d3.csv("data/vendors.csv", function(vendors) {
        drawMap(states, zips, vendors);
        initialTable(vendors);
      });
    });
  });
  

  // draw the map
  function drawMap(states, zips, vendors) {

    var mapGroup = svg.append("g").attr("class", "mapGroup")

    // draw the states
    mapGroup.append("g")
      .selectAll("path")
      .data(states.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr( "fill", "#ccc" )
      .attr( "stroke", "#333")

    // determines if the given zip code has a vendor in it
    let hasVendor = function(d) {
      let vendorZips = vendors.map(function (s) { return s.ZIP} );
      let isVendor = vendorZips.includes(d.properties.ZCTA5CE10);
      return(isVendor)
    }

    // adds the zip codes containing vendors to the map
    mapGroup.append("g")
      .attr("id", "zips")
      .selectAll("path")
      .data(zips.features)
      .enter()
      .append("path")
      .attr("fill", "none")
      .classed("zips", hasVendor)
      .attr("d", path)

  }

  // adds a brush to the map
  var brush = d3.brush()
    .on("start brush", highlight)
    .on("end", brushend);

  svg.append("g").call(brush)

  // determines what to do when the brush is started
  function highlight() {

    // remove any current selection
    d3.selectAll(".zips.final").classed("final", false);

    // if nothing is selected don't do anything else
    if (d3.event.selection == null) {
      return;
    }

    // get the bounds of the selection
    let [[x0, y0], [x1, y1]] = d3.event.selection
    let all_zips = d3.selectAll(".zips")

    // select the zips within the bounds
    all_zips.classed("selected",
      d =>
        x0 <= projection([d.properties.lon, d.properties.lat])[0] &&
        x1 >= projection([d.properties.lon, d.properties.lat])[0] &&
        y0 <= projection([d.properties.lon, d.properties.lat])[1] &&
        y1 >= projection([d.properties.lon, d.properties.lat])[1]
    );
  }

  // determines what to do when the brush ends
  function brushend() {

    // get all the zips current selected and make it a final selection
    let selection = d3.selectAll(".zips.selected")
    selection.classed("selected", false)
    selection.classed("final", true)

    d3.csv("data/vendors.csv", function(vendors) {

      let vendors_selc = vendors.filter(function (d) {
        let vendorZip = d.ZIP;
        zips_selected = d3.selectAll(".zips.final").data()
        .map(function (s) { return s.properties.ZCTA5CE10} );
        let isSelected = zips_selected.includes(vendorZip);
        return isSelected;
      });

      drawTable(vendors_selc)

    });

  }

  
  function initialTable(data) {

    console.log("drawing table")

    let table = d3.select("#table-div")
      .append("table")
      .classed("my-table", true);

    let tableHeaders = Object.keys(data[0]);

    let thead = table.append('thead');

    thead.append('tr')
    .selectAll('th')
    .data(tableHeaders).enter()
    .append('th')
    .text(function (column) { return column; })

  }



  function drawTable(data) {

    console.log("drawing table")

    let table = d3.select("#table-div")
    .append("table")
    .classed("my-table", true);

    d3.select("#table-div tbody").remove();

    let tbody = table.append('tbody');

    let tableHeaders = d3.selectAll("th").data()

    console.log(data)

    tbody.selectAll('tr')
      .data(data)
      .enter()
      .append('tr')
      .selectAll('td')
      .data(function (row) {
        return tableHeaders.map(function (column) {
         return { column: column, value: row[column] };
        });
      })
      .enter()
      .append('td')
      .text(function (d) { return d.value; });

  };
  // set the dimensions and margins of the graph
var margin = {top: 10, right: 10, bottom: 10, left: 10},
  width = 950 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#tree-div")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Read data
d3.csv('data/vendors_old_treemap.csv', function(data) {
  var myColor = d3.scaleOrdinal().domain(function(d) { return d.Business_Type })
    .range(d3.schemeSet3);
  // stratify the data: reformatting for d3.js
  var root = d3.stratify()
    .id(function(d) { return d.Index; })   // Name of the entity (column name is name in csv)
    .parentId(function(d) { return d.Parent; })   // Name of the parent (column name is parent in csv)
    (data)
    .sum(function(d) { return +d.Wholesale_Perc })   // Compute the numeric value for each entity
    .sort(function(a, b) { return b.Wholesale_Perc - a.Wholesale_Perc; });
  // Then d3.treemap computes the position of each element of the hierarchy
  // The coordinates are added to the root object above
  d3.treemap()
    .size([width, height])
    .padding(4)
    (root)

console.log(root.leaves())
  // use this information to add rectangles:
  svg
    .selectAll("rect")
    .data(root.leaves())
    .enter()
    .append("rect")
      .attr('x', function (d) { return d.x0; })
      .attr('y', function (d) { return d.y0; })
      .attr('width', function (d) { return d.x1 - d.x0; })
      .attr('height', function (d) { return d.y1 - d.y0; })
      .style("stroke", "black")
      .style("fill", function(d){return myColor(d) });

  // and to add the text labels
  svg
    .selectAll("text")
    .data(root.leaves())
    .enter()
    .append("text")
    .selectAll("tspan")
    .data( d => {
      return d.data.Index.split(/(?=[A-Z][^A-Z])/g) // split the name of movie
              .map(v => {
                  return {
                      text: v,
                      x0: d.x0,                        // keep x0 reference
                      y0: d.y0                         // keep y0 reference
                  }
              });
    })
      .enter()
      .append('tspan')
      .attr("x", (d) => d.x0 + 5)
      .attr("y", (d, i) => d.y0 + 15 + (i * 10))       // offset by index 
      .text((d) => d.text)
      .attr("font-size", "0.6em")
      .attr("fill", "black");
})

})());