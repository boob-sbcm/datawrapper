
(function(){
    // Simple perfect bar chart
    // -------------------------

    var BarChart = Datawrapper.Visualizations.BarChart = function() {

    };

    _.extend(BarChart.prototype, Datawrapper.Visualizations.RaphaelChart.prototype, {

        render: function(el) {
            el = $(el);

            this.setRoot(el);

            var me = this,
            sortBars = me.get('sort-values'),
            c = me.initCanvas({}),
            chart_width = c.w - c.lpad - c.rpad,
            series_gap = 0.05, // pull from theme
            row_gap = 0.01,
            row = 0; // pull from theme
            if (!_.isUndefined(me.get('selected-row'))) {
                row = me.get('selected-row');
            }
            if (row > me.chart.numRows() || row === undefined) row = 0;
            me.chart.filterRow(row);

            me.init();
            me.initDimensions(0);

            $('.tooltip').hide();

            _.each(me.chart.dataSeries(sortBars), function(series, s) {
                _.each(series.data, function(val, r) {
                    var d = me.barDimensions(series, s, r);
                    var fill = me.getSeriesColor(series, r),
                        stroke = d3.cie.lch(d3.rgb(fill)).darker(0.6).toString();
                    me.registerSeriesElement(c.paper.rect(d.x, d.y, d.w, d.h).attr({
                        'stroke': stroke,
                        'fill': fill
                    }).data('strokeCol', stroke), series);

                    var lbl_x = val > 0 ?
                            c.zero - c.maxValueLabelWidth[0] - 10
                            : c.zero + c.maxValueLabelWidth[1] + 10,
                        val_x = val > 0 ?
                            c.zero - c.maxValueLabelWidth[0]
                            : c.zero + c.maxValueLabelWidth[1];
                    me.registerSeriesLabel(me.label(val_x, d.y + d.h * 0.5, me.chart.formatValue(series.data[r], s === 0),{
                        w: 40,
                        align: val <= 0 ? 'right' : 'left',
                        cl: 'value'
                    }), series);

                    // add series label
                    me.registerSeriesLabel(me.label(lbl_x , d.y + d.h * 0.5, series.name,{
                        w: 160,
                        align: val <= 0 ? 'left' : 'right',
                        cl: me.chart.isHighlighted(series) ? 'series highlighted' : 'series'
                    }), series);

                });
            });

            if (me.__domain[0] < 0) {
                var x = c.lpad + c.zero ;
                me.path([['M', x, c.tpad], ['L', x, c.h - c.bpad]], 'axis')
                    .attr(me.theme.yAxis);
            }

            // enable mouse events
            el.mousemove(_.bind(me.onMouseMove, me));
        },

        initDimensions: function(r) {
            //
            var me = this, c = me.__canvas,
                dMin = 0, dMax = 0, w = c.w - c.lpad - c.rpad - 30;
            _.each(me.chart.dataSeries(), function(series) {
                dMin = Math.min(dMin, series._min());
                dMax = Math.max(dMax, series._max());
            });
            me.__domain = [dMin, dMax];
            me.__scales = {
                y: d3.scale.linear().domain([dMin, dMax])
            };
            var maxw = [0, 0, 0, 0, 0, 0], ratio;
            _.each(me.chart.dataSeries(), function(series, s) {
                var t = series.data[r] < 0 ? 3 : 0;
                maxw[t] = Math.max(maxw[t], me.labelWidth(series.name, 'series') + 20);
                maxw[t+1] = Math.max(maxw[t+1], me.labelWidth(me.chart.formatValue(series.data[r], s === 0), 'value') + 10);
                maxw[t+2] = Math.max(maxw[t+2], Math.abs(series.data[r]));
            });
            c.left = 0;
            c.right = 0;
            c.zero = 10 + maxw[5] / (maxw[2] + maxw[5]) * w;

            if (!me.get('labels-inside-bars')) {

                c.left = Math.max(maxw[0] + maxw[1] - c.zero, 0);
                c.right = Math.max((maxw[3] + maxw[4]) - (w - c.zero), 0);

                w -= c.left + c.right;

                c.zero = c.left + maxw[5] / (maxw[2] + maxw[5]) * w;
            }
            c.maxSeriesLabelWidth = [maxw[0], maxw[3]];
            c.maxValueLabelWidth = [maxw[1], maxw[4]];

            me.__scales.y.rangeRound([c.lpad, w]);
            console.log(c.left, c.right, c.zero, w);
        },

        barDimensions: function(series, s, r) {
            var me = this, w, h, x, y, i, cw, n = me.chart.dataSeries().length,
                sc = me.__scales, c = me.__canvas, bw, pad = 0.35, vspace = 0.1,
                val = series.data[r];

            //
            cw = c.h - c.bpad - c.tpad;
            //
            bw = Math.min(24, cw / (n + (n-1) * pad));
            w = sc.y(val) - sc.y(0);
            h = bw;
            if (w > 0) {
                x = c.lpad + c.zero;
            } else {
                x = c.lpad + c.zero + w;
                w *= -1;
            }
            y = Math.round(c.tpad + s * (bw + bw * pad));
            return { w: w, h: h, x: x, y: y };
        },

        getDataRowByPoint: function(x, y) {
            return 0;
        },

        showTooltip: function() {

        },

        hideTooltip: function() {
            
        },

        hoverSeries: function(series) {
            var me = this;
            _.each(me.chart.dataSeries(), function(s) {
                _.each(me.__seriesLabels[s.name], function(lbl) {
                    if (series !== undefined && s.name == series.name) {
                        lbl.addClass('hover');
                    } else {
                        lbl.removeClass('hover');
                    }
                    _.each(me.__seriesElements[s.name], function(el) {
                        var fill = me.getSeriesColor(s, 0), stroke;
                        if (series !== undefined && s.name == series.name) fill = d3.cie.lch(d3.rgb(fill)).darker(0.6).toString();
                        stroke = d3.cie.lch(d3.rgb(fill)).darker(0.6).toString();
                        if (el.attrs.fill != fill || el.attrs.stroke != stroke)
                            el.animate({ fill: fill, stroke: stroke }, 50);
                    });
                });
            });
        },

        unhoverSeries: function() {
            this.hoverSeries();
        }
    });

}).call(this);