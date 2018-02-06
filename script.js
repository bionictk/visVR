var chosen = { hData: "width", wData: "make", dData: "
}
AFRAME.registerComponent('barchart', {
  schema: {
    csv: {}
  },
  init: function () {
    var self = this;
    d3.dsv(",", this.data.csv, function(d) {
      return {
        name: d["Vehicle Name"],
        make: name.replace(/ .*/,''),
        key: +d["Len"],
        width: +d["Width"]
      };
    }).then(function(data) {
      self.generate(data);
    });
  },

  generate: function (data) {
    var chosenHeightData = "width"
    var chosen
    var histoWidth = 2,
        histoDepth = 2,
        histoHeight = 1.5,
        histoPadding = 0.1; //in meters
    // default alpha for bars
    var alpha = 0.6;
    
    var xScale = d3.scaleBand() 
      .rangeRound([0, histoWidth])
      .paddingInner(histoPadding);
    
    var zScale = d3.scaleBand() 
      .rangeRound([0, -histoDepth])
      .paddingInner(histoPadding);
    
    var el = this.el;
    var dataHeightArray = data.map(function(d) {return d[chosenHeightData];});
    console.log(d3.extent(dataHeightArray));
    // Scale the height of our bars using d3's linear scale
    
    xScale.domain(data.map(function(d) { return d[chosen.hData]; }));
    var hscale = d3.scaleLinear()
      .domain([0, d3.max(dataHeightArray)])
      .range([0, histoHeight]);

    var color = d3.scaleLinear().domain(d3.extent(dataHeightArray))
      .interpolate(d3.interpolateHcl).range(['#ffb3ba', '#bae1ff']);

    // Select the current entity object just like an svg
    var currentEntity = d3.select(el);

    // we use d3's enter/update/exit pattern to draw and bind our dom elements
    var bars = currentEntity.selectAll('a-box.bar').data(data);
    // we set attributes on our cubes to determine how they are rendered
    bars.enter().append('a-box').classed('bar', true)
      .attr('position',function (d, i) {
        const x =  i * 0.8 - (data.length / 2);
        const y = hscale(d[chosenHeightData])/2;
        const z = 0
        return x + " " + y + " " + z   
      })
      .attr('width', function(d) { return 0.5; })
      .attr('depth', function(d) { return 0.5; })
      .attr('height', function(d) { return hscale(d[chosenHeightData]); })
      .attr('opacity', alpha)
      .attr('color', function(d) { return color(d[chosenHeightData]); })
      .on("mouseenter", function(d,i) {
        d3.select(this).transition().duration(10)
          .attr('opacity', 0.9);

        d3.select(this).append("a-text")
          .attr('color', color(d[chosenHeightData]))
          .attr('align', 'center')
          .attr('position', function() { return "0 " + hscale(d[chosenHeightData]) + " 0"; } )
          .attr('scale', '1 1 1')
          .attr('value', function() { return d.name; });
      })
      .on("mouseleave", function(d,i) {
        d3.select(this).transition().duration(1000)
          .attr('opacity', alpha);

        d3.select(this).select("a-text").remove();
      })
  }
});