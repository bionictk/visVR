var chosen = { label: "name", hData: "", wData: "make", dData: "price" }
var d3 = d3;
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
    
    var histoWidth = 4.0,
        histoDepth = 4.0,
        histoHeight = 1.5; //in meters
    var histoPadding = 0.4;
    
    var depthBinNum = 20;
    // default alpha for bars
    var alpha = 0.6;
    
    var blockDepth = histoDepth / histoWidth,
        blockHeight = histoHeight / histoWidth;
    
    var xScale = d3.scaleBand() 
      .range([0, histoWidth])
      .paddingInner(histoPadding);
    
    var zScale = d3.scaleLinear() 
      .range([0, -histoDepth]);

    var el = this.el;
    
    var depthDataArray = data.map(function(d) { return d[chosen.dData]; });
    var dDataExtent = d3.extent(depthDataArray);
    var widthDataArray = data.map(function(d) { return d[chosen.wData]; });
    
    xScale.domain(widthDataArray);
    zScale.domain(dDataExtent);
    var zScaleTicks = zScale.ticks(depthBinNum);
        
    var getBin = function(d) {
      var i;
      for (i = 0; i < zScaleTicks.length; i++) {
        if (d < zScaleTicks[i]) break;
      }
      return {i: i, x0: zScaleTicks[i]};
    }
    
    var bins = {}
    var maxBinHeight = -1;
    data.forEach(function(d) {
      if (!bins[d[chosen.wData]]) bins[d[chosen.wData]] = {};
      var wbin = bins[d[chosen.wData]];
      var dbin = getBin(d[chosen.dData]);
      const z = zScale(dbin.x0);
      if (!wbin[dbin.i]) wbin[dbin.i] = 0;
      wbin[dbin.i] += 1
      if (wbin[dbin.i] > maxBinHeight) maxBinHeight = wbin[dbin.i];
    });
    
    var dHisto = d3.histogram()
      .thresholds(zScaleTicks)
      (depthDataArray);

    var yScale = d3.scaleLinear()
      .domain([0, maxBinHeight])
      .range([0, histoHeight]);

    var color = d3.scaleLinear().domain(dDataExtent)
      .interpolate(d3.interpolateHcl).range(['#77ffd1', '#e0282b']);

    // Select the current entity object just like an svg
    var chartEntity = d3.select(el);
    var chartHolderEntity = d3.select(el.parentNode);
    chartHolderEntity.attr('position' , "0 -0.002 -3");
    chartEntity.attr('position' , -histoWidth / 2 + " 0.002 " + ((histoDepth / 2)));
    chartHolderEntity.attr('geometry' , "width: " + (histoWidth + 0.5) + "; height: 0.006; depth: " + (histoDepth + 0.5));
    // we use d3's enter/update/exit pattern to draw and bind our dom elements
    var bars = chartEntity.selectAll('a-box.bar').data(data);
    // we set attributes on our cubes to determine how they are rendered

    bars.enter().append('a-box').classed('bar', true)
      .attr('position',function (d, i) {
        const x = xScale(d[chosen.wData]);
        const dbin = getBin(d[chosen.dData]);
        const z = zScale(dbin.x0);
        const y = yScale(bins[d[chosen.wData]][dbin.i]) + (xScale.bandwidth() * blockHeight / 2);
        bins[d[chosen.wData]][dbin.i] -= 1;
        return x + " " + y + " " + z   
      })
      .attr('width', function(d) { return xScale.bandwidth(); })
      .attr('depth', function(d) { return xScale.bandwidth() * blockDepth; })
      .attr('height', function(d) { return histoHeight / maxBinHeight - 0.01; })
      .attr('opacity', 1)
      .attr('color', function(d) { return color(d[chosen.dData]); })
      .attr('shadow', "cast: true")
      .on("mouseenter", function(d,i) {
        d3.select(this).transition().duration(10)
          .attr('opacity', 0.9);

        d3.select(this).append("a-text")
          .attr('color', color(d[chosen.dData]))
          .attr('align', 'center')
          .attr('position', function() { return "0 " + 0 + " 0"; } )
          .attr('scale', '0.5 0.5 0.5')
          // .attr('look-at', '[camera]') todo
          .attr('value', function() { return d[chosen.label] + "\n" + d[chosen.dData]; });
      })
      .on("mouseleave", function(d,i) {
        d3.select(this).transition().duration(1000)
          .attr('opacity', alpha);

        d3.select(this).select("a-text").remove();
      })
    
      var axes = chartEntity.append('g').classed('axes')
    // add x-axis
    // x - lines
    // d3.select(this).append("a-box")
    //       .attr('color', "#FFF"))
    //       .attr('position', function() { return "0 " + 0 + " 0"; } )
    //       .attr('rotation', '-45 0 0')
    //       .attr('scale', function() { return '3 0.5 0.5';} )
    // labels
    // d3.select(this).append("a-text")
    //       .attr('color', "#FFF"))
    //       .attr('align', 'center')
    //       .attr('position', function() { return "0 " + 0 + " 0"; } )
    //       .attr('scale', '0.5 0.5 0.5')
    //       .attr('rotation', '-45 0 0')
    //       .attr('value', function() { return d[chosen.wData]; });
    // add y-axis
  }
});