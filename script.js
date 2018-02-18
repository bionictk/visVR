var chosen = { label: "Vehicle Name", wData: "make", dData: "Cyl" }
var d3 = d3, AFRAME = AFRAME;
AFRAME.registerComponent('barchart', {
  schema: {
    csv: {}
  },
  init: function () {
    var self = this;
    d3.dsv(",", this.data.csv, function(d) {
      d['make'] = d["Vehicle Name"].replace(/ .*/,'');
      Object.keys(d).forEach(function(key) {
        if (!isNaN(d[key])) d[key] = +d[key];
      });
      // there are "*" values that should be ignored
      return d;
    }).then(function(data) {
      self.generate(data);
    });
  },

  generate: function (data) {
    
    var histoWidth = 4.0,
        histoDepth = 2.0,
        histoHeight = 1.5;
    
    var depthBinNum = 10;
    
    var histoPadding = 0.4, //not in meters
        blockHeightPadding = 0.01,
        blockDepthPadding = 0.5 / depthBinNum;
    
    var zTickFormat = ",";

    //// End of configurations
    
    var xScale = d3.scaleBand() 
      .range([0, histoWidth])
      .paddingInner(histoPadding * 2)
      .paddingOuter(histoPadding);
    
    var zScale = d3.scaleBand() 
      .range([0, -histoDepth])
      .paddingInner(histoPadding * 2)
      .paddingOuter(histoPadding);
    // var zScale = d3.scaleLinear() 
    //   .range([0, -histoDepth]);
    // zScale.step = function() { return zScale(zScale.ticks()[1]) - zScale(zScale.ticks()[0]); };
    
    var el = this.el;
    
    var depthDataArray = data.map(function(d) { return d[chosen.dData]; });
    // var dDataExtent = d3.extent(depthDataArray);
    var widthDataArray = data.map(function(d) { return d[chosen.wData]; });
    
    xScale.domain(widthDataArray);
    zScale.domain(depthDataArray);
    // var zScaleTicks = zScale.domain(dDataExtent).ticks(depthBinNum);
    
    // add start and end values
    // zScaleTicks.unshift(zScaleTicks[0] - zScaleTicks[1] + zScaleTicks[0]);
    // zScaleTicks.push(zScaleTicks[zScaleTicks.length - 1] + zScaleTicks[1] - zScaleTicks[0]);

    // var getBin = function(d) {
    //   var i;
    //   for (i = 0; i < zScaleTicks.length; i++) {
    //     if (d < zScaleTicks[i]) break;
    //   }
    //   // console.log(d)
    //   return {i: i, x0: zScaleTicks[i]};
    // }
    
    
    var bins = {}
    var maxBinHeight = -1;
    data.forEach(function(d) {
      if (!bins[d[chosen.wData]]) bins[d[chosen.wData]] = {};
      var wbin = bins[d[chosen.wData]];
      // var dbin = getBin(d[chosen.dData]);
      // const z = zScale(dbin.x0);
      // console.log(dbin,z)
      if (!wbin[d[chosen.dData]]) wbin[d[chosen.dData]] = 0;
      wbin[d[chosen.dData]] += 1
      if (wbin[d[chosen.dData]] > maxBinHeight) maxBinHeight = wbin[d[chosen.dData]];
    });

    var yScale = d3.scaleLinear()
      .domain([0, maxBinHeight])
      .range([0, histoHeight]);

    // var color = d3.scaleLinear().domain(dDataExtent)
    //   .interpolate(d3.interpolateHcl).range(['#77ffd1', '#e0282b']);
    var color = d3.scaleOrdinal(d3.schemeCategory10).domain(depthDataArray)

    var blockHeight = histoHeight / maxBinHeight - blockHeightPadding;
    // var blockDepth = histoDepth / (zScaleTicks.length + 1) - blockDepthPadding;
    var blockDepth = zScale.bandwidth();
    var blockWidth = xScale.bandwidth();
    // Select the current entity object just like an svg
    var chartEntity = d3.select(el);
    var chartHolderEntity = d3.select(el.parentNode);
    
    chartHolderEntity.attr('position' , "0 0 -3");
    chartEntity.attr('position' , -histoWidth / 2 + " 0.002 " + ((histoDepth / 2)));
    chartHolderEntity.attr('geometry' , "width: " + (histoWidth + 1.3) + "; height: 0.004; depth: " + (histoDepth + 1));

    var blocks = chartEntity.selectAll('a-box.bar').data(data);
    blocks.enter().append('a-box').classed('bar', true)
      .attr('position',function (d, i) {
        const x = xScale(d[chosen.wData]) + blockWidth / 2;
        // const dbin = getBin(d[chosen.dData]);
        // const z = zScale(dbin.x0);
        const z = zScale(d[chosen.dData]) - blockDepth / 2;
        // bins[d[chosen.wData]][dbin.i] -= 1
        bins[d[chosen.wData]][chosen.dData] -= 1;
        var hval = bins[d[chosen.wData]][chosen.dData]
        const y = yScale(hval) + blockHeight / 2;        
        return x + " " + y + " " + z   
      })
      .attr('width', blockWidth)
      .attr('depth', blockDepth)
      .attr('height', blockHeight)
      // .attr('opacity', alpha)
      .attr('color', function(d) { return color(d[chosen.dData]); })
      // .attr('shadow', "cast: true")
      .on("mouseenter", function(d,i) {
        d3.select(this).transition().duration(10)
           .attr('color', "#ffed2d");

        d3.select(this).append("a-text")
          .attr('color', 'orange')
          .attr('align', 'center')
          .attr('position', function() { return "0 " + 0 + " 0.1"; } )
          .attr('scale', '0.5 0.5 0.5')
          // .attr('look-at', '[camera]') todo
          .attr('value', function() { return d[chosen.label] + "\n" + d[chosen.dData]; });
      })
      .on("mouseleave", function(d,i) {
        d3.select(this).transition().duration(300)
          .attr('color', color(d[chosen.dData]))

        d3.select(this).select("a-text").remove();
      })
    
    d3.select("#axes").attr('position', "0 0.002 0")
    var xAxis = d3.select("#x-axis");
    var xLabels = xAxis.append("a-entity").classed("labels", true).selectAll("a-text.axis").data(xScale.domain());
    xLabels.enter().append("a-text").classed("axis", true)
      .attr('color', '#FFF')
      .attr('align', 'right')
      .attr('position', function(d, i) { return (xScale(d) + xScale.bandwidth() / 2) + " 0 " + (0.05); })
      .attr('rotation', '-90 90 0')
      .attr('scale', '0.5 0.5 0.5')
      .attr('value', function(d) { return d; })
    var xLines = xAxis.append("a-entity").classed("lines", true).selectAll("a-box.axis").data(xScale.domain());
    xLines.enter().append("a-box")
      .attr('width', 0.005)
      .attr('depth', histoDepth - zScale.step() / 1.1)
      .attr('height', 0.002)
      .attr('color', '#FFF')
      .attr('position', function(d) {return (xScale(d) + xScale.bandwidth() / 2) + ' 0 ' + (-histoDepth / 2 + zScale.step() / 2.3);});
    // var xAxisLine = xAxis.append("a-box")
    //   .attr('width', 0.005)
    //   .attr('depth', histoDepth - zScale.step() / 1.1)
    //   .attr('height', 0.002)
    //   .attr('color', '#FFF')
    //   .attr('position', (xScale.step() / -2) + ' 0 ' + (-histoDepth / 2 + zScale.step() / 2.3));

//     var zAxisArrayFormatted = zScaleTicks.map(zScale.tickFormat())

//     var zAxis = d3.select("#z-axis");
//     var zLabels = zAxis.append("a-entity").classed("labels", true).selectAll("a-text.axis").data(zScaleTicks);
//     zLabels.enter().append("a-text").classed("axis", true)
//       .attr('color', '#FFF')
//       .attr('align', 'right')
//       .attr('position', function(d) { return (-0.1) + " 0 " + (zScale(d) + zScale.step() / 2); })
//       .attr('rotation', '-90 0 0')
//       .attr('scale', '0.5 0.5 0.5')
//       .attr('value', function(d, i) { return "$" + zAxisArrayFormatted[i]; })
//     var zLines = zAxis.append("a-entity").classed("lines", true).selectAll("a-box.axis").data(zScaleTicks);
//     zLines.enter().append("a-box")
//       .attr('width', histoWidth + xScale.step() / 2)
//       .attr('depth', 0.005)
//       .attr('height', 0.002)
//       .attr('color', '#FFF')
//       .attr('position', function(d) {return (histoWidth / 2 - xScale.step() / 3) + ' 0 ' + (zScale(d) + zScale.step() / 2);});

  }
});