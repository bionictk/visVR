var chosen = { label: "name", hData: "", wData: "make", dData: "price" }

AFRAME.registerComponent('barchart', {
  schema: {
    csv: {}
  },
  init: function () {
    var self = this;
    d3.dsv(",", this.data.csv, function(d) {
      return {
        name: d["Vehicle Name"],
        make: d["Vehicle Name"].replace(/ .*/,''),
        key: +d["Len"],
        width: +d["Width"],
        price: +d["Retail Price"]
      };
    }).then(function(data) {
      self.generate(data);
    });
  },

  generate: function (data) {

    var histoWidth = 2.0,
        histoDepth = 2.0,
        histoHeight = 1.5,
        blockHeight = 0.3;  //in meters
    var histoPadding = 0.4;
    // default alpha for bars
    var alpha = 0.6;
    
    var xScale = d3.scaleBand() 
      .range([0, histoWidth])
      .paddingInner(histoPadding);
    
    var zScale = d3.scaleBand() 
      .range([0, -histoDepth])
      .paddingInner(histoPadding);
    
    var el = this.el;
    
    var dataHeightArray = data.map(function(d) {return d[chosen.dData];});
    var widthBins = {}
    data.forEach(function(d) {widthBins[d[chosen.wData]] = widthBins[d[chosen.wData]] ? widthBins[d[chosen.wData]] + 1 : 1;});

    xScale.domain(data.map(function(d) { return d[chosen.wData]; }));
    var hscale = d3.scaleLinear()
      .domain([0, d3.max(dataHeightArray)])
      .range([0, histoHeight]);
    
    var color = d3.scaleLinear().domain(d3.extent(dataHeightArray))
      .interpolate(d3.interpolateHcl).range(['#ffb3ba', '#bae1ff']);

    // Select the current entity object just like an svg
    var currentEntity = d3.select(el);

    console.log(currentEntity)
    currentEntity.attr('position' , -histoWidth / 2 + " 0 " + (-(histoDepth / 2 + 1)))
    // we use d3's enter/update/exit pattern to draw and bind our dom elements
    var bars = currentEntity.selectAll('a-box.bar').data(data);
    // we set attributes on our cubes to determine how they are rendered
    bars.enter().append('a-box').classed('bar', true)
      .attr('position',function (d, i) {
        const x = xScale(d[chosen.wData]);//i * 0.8 - (data.length / 2);
        const y = hscale(d[chosen.dData])/2;
        const z = 0
        return x + " " + y + " " + z   
      })
      .attr('width', function(d) { return xScale.bandwidth(); })
      .attr('depth', function(d) { return 0.5; })
      .attr('height', function(d) { return hscale(d[chosen.dData]); })
      .attr('opacity', alpha)
      .attr('color', function(d) { return color(d[chosen.dData]); })
      .on("mouseenter", function(d,i) {
        d3.select(this).transition().duration(10)
          .attr('opacity', 0.9);

        d3.select(this).append("a-text")
          .attr('color', color(d[chosen.dData]))
          .attr('align', 'center')
          .attr('position', function() { return "0 " + (histoHeight - hscale(d[chosen.dData]) / 2 + 0.2) + " 0"; } )
          .attr('scale', '0.5 0.5 0.5')
          // .attr('look-at', '[camera]') todo
          .attr('value', function() { return d[chosen.label] + "\n" + d[chosen.dData]; });
      })
      .on("mouseleave", function(d,i) {
        d3.select(this).transition().duration(1000)
          .attr('opacity', alpha);

        d3.select(this).select("a-text").remove();
      })
  }
});