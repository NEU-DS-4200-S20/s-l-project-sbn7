// Immediately Invoked Function Expression to limit access to our 
// variables and prevent 
((() => {

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

  }

})());
