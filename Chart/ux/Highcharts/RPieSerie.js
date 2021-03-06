function initHighchartsRPieSerie(){
	(function() {
	    var
		    UNDEFINED,
		    math = Math,
		    mathRound = math.round,
		    mathFloor = math.floor,
		    mathCeil = math.ceil,
		    mathMax = math.max,
		    mathMin = math.min,
		    mathAbs = math.abs,
		    mathCos = math.cos,
		    mathSin = math.sin,
		    mathPI = math.PI,
		    deg2rad = mathPI * 2 / 360,
		    // some constants for frequently used strings
		    DIV = 'div',
		    ABSOLUTE = 'absolute',
		    RELATIVE = 'relative',
		    HIDDEN = 'hidden',
		    PREFIX = 'highcharts-',
		    VISIBLE = 'visible',
		    PX = 'px',
		    NONE = 'none',
		    M = 'M',
		    L = 'L';
	    
	    /**
	     * Set the default options for pie
	     */
	    Highcharts.getOptions().plotOptions.rpie= Highcharts.merge(Highcharts.getOptions().plotOptions.pie, {
		borderColor: '#FFFFFF',
		borderWidth: 1,
		center: ['50%', '50%'],
		colorByPoint: true, // always true for pies
		dataLabels: {
			// align: null,
			// connectorWidth: 1,
			// connectorColor: point.color,
			// connectorPadding: 5,
			distance: 30,
			enabled: true,
			formatter: function () {
				return this.point.name;
			}
			// softConnector: true,
			//y: 0
		},
		//innerSize: 0,
		legendType: 'point',
		marker: null, // point options are specified in the base options
		size: '75%',
		showInLegend: false,
		slicedOffset: 10,
		states: {
			hover: {
				brightness: 0.1,
				shadow: false
			}
		}
	});

	    /**
	     * The Pie series class
	     */
	    var RPieSeries = {
		type: 'rpie',
		radiusValued: false,
		minRadius: 40,
		init: function(chart, options) {
		    Highcharts.seriesTypes.pie.prototype.init.apply(this,arguments);
		    //Highcharts.Series.prototype.init.apply(this, arguments);
		    this.radiusValued = options.radiusValued || true;
		    this.minRadius = options.minRadius || 40;
		},
		/**
		 * Do translation for pie slices
		 */
		translate: function() {
		    this.generatePoints();

		    var total = 0,
			    maxR = 0,
			    rappR = 0,
			    radius = 0,
			    series = this,
			    minRadius,
			    radiusValued,
			    cumulative = 0,
			    precision = 1000, // issue #172
			    options = series.options,
			    slicedOffset = options.slicedOffset,
			    connectorOffset = slicedOffset + options.borderWidth,
			    positions,
			    chart = series.chart,
			    start,
			    end,
			    angle,
			    startAngleRad = series.startAngleRad = mathPI / 180 * ((options.startAngle || 0) % 360 - 90),
			    points = series.points,
			    circ = 2 * mathPI,
			    fraction,
			    radiusX, // the x component of the radius vector for a given point
			    radiusX2,
			    radiusY,
			    radiusY2,
			    labelDistance = options.dataLabels.distance,
			    ignoreHiddenPoint = options.ignoreHiddenPoint,
			    i,
			    len = points.length,
			    point;

		    radiusValued = this.radiusValued;
		    minRadius = this.minRadius;

		    // get positions - either an integer or a percentage string must be given
		    series.center = positions = series.getCenter();

		    // utility for getting the x value from a given y, used for anticollision logic in data labels
		    series.getX = function(y, left) {

			angle = math.asin((y - positions[1]) / (positions[2] / 2 + labelDistance));

			return positions[0] +
				(left ? -1 : 1) *
				(mathCos(angle) * (positions[2] / 2 + labelDistance));
		    };
		    // get the total sum
		    for (i = 0; i < len; i++) {
			point = points[i];
			total += (ignoreHiddenPoint && !point.visible) ? 0 : point.y;
			if (radiusValued === true) {
			    if ((ignoreHiddenPoint && !point.visible) ? 0 : point.r > maxR) {
				maxR = point.r;
			    }
			}
		    }
		    if (radiusValued === true) {
			rappR = 0;
			if (maxR > 0) {
			    rappR = minRadius / maxR;
			} else {
			    minRadius = 0;
			}

		    }

		    // Calculate the geometry for each point
		    for (i = 0; i < len; i++) {

			point = points[i];

			// set start and end angle
			fraction = total ? point.y / total : 0;
			start = mathRound((startAngleRad + (cumulative * circ)) * precision) / precision;
			if (!ignoreHiddenPoint || point.visible) {
			    cumulative += fraction;
			}
			end = mathRound((startAngleRad + (cumulative * circ)) * precision) / precision;

			angle = (end + start) / 2;
			if (angle > 0.75 * circ) {
			    angle -= 2 * mathPI;
			}

			if (radiusValued === true) {
			    radius = (((rappR * point.r) + (100 - minRadius)) * (positions[2] / 2)) / 100;
			    radiusX2 = mathCos(angle) * positions[2] / 2;
			    radiusY2 = mathSin(angle) * positions[2] / 2;
			} else {
			    radius = positions[2] / 2;
			    radiusX2 = mathCos(angle) * radius;
			    radiusY2 = mathSin(angle) * radius;
			}
			radiusX = mathCos(angle) * radius;
			radiusY = mathSin(angle) * radius;

			// set the shape
			point.shapeType = 'arc';
			point.shapeArgs = {
			    x: positions[0],
			    y: positions[1],
			    //r: positions[2] / 2,
			    r: radius,
			    innerR: positions[3] / 2,
			    start: start,
			    end: end
			};

			// center for the sliced out slice
			point.slicedTranslation = Highcharts.map([
			    mathCos(angle) * slicedOffset + chart.plotLeft,
			    mathSin(angle) * slicedOffset + chart.plotTop
			], mathRound);

			// set the anchor point for tooltips
			point.tooltipPos = [
			    positions[0] + radiusX2 * 0.7,
			    positions[1] + radiusY2 * 0.7
			];

			point.half = angle < circ / 4 ? 0 : 1;
			point.angle = angle;

			// set the anchor point for data labels
			point.labelPos = [
			    positions[0] + radiusX2 + mathCos(angle) * labelDistance, // first break of connector
			    positions[1] + radiusY2 + mathSin(angle) * labelDistance, // a/a
			    positions[0] + radiusX2 + mathCos(angle) * connectorOffset, // second break, right outside pie
			    positions[1] + radiusY2 + mathSin(angle) * connectorOffset, // a/a
			    positions[0] + radiusX2, // landing point for connector
			    positions[1] + radiusY2, // a/a
			    positions[0] + radiusX, // landing point for connector
			    positions[1] + radiusY, // a/a
			    labelDistance < 0 ? // alignment
				    'center' :
				    point.half ? 'right' : 'left', // alignment
			    angle // center angle
			];

			// API properties
			point.percentage = fraction * 100;
			point.total = total;

		    }


		    this.setTooltipPoints();
		},
		
		/**
		 * Override the base drawDataLabels method by pie specific functionality
		 */
		drawDataLabels: function() {
		    var series = this,
			    data = series.data,
			    point,
			    chart = series.chart,
			    options = series.options.dataLabels,
			    connectorPadding = Highcharts.pick(options.connectorPadding, 10),
			    connectorWidth = Highcharts.pick(options.connectorWidth, 1),
			    connector,
			    connectorPath,
			    softConnector = Highcharts.pick(options.softConnector, true),
			    distanceOption = options.distance,
			    seriesCenter = series.center,
			    radius = seriesCenter[2] / 2,
			    centerY = seriesCenter[1],
			    outside = distanceOption > 0,
			    dataLabel,
			    labelPos,
			    labelHeight,
			    halves = [// divide the points into right and left halves for anti collision
				[], // right
				[]  // left
			    ],
			    x,
			    y,
			    visibility,
			    rankArr,
			    i = 2,
			    j,
			    sort = function(a, b) {
			return b.y - a.y;
		    },
			    sortByAngle = function(points, sign) {
			points.sort(function(a, b) {
			    return (b.angle - a.angle) * sign;
			});
		    };

		    // get out if not enabled
		    if (!options.enabled && !series._hasPointLabels) {
			return;
		    }

		    // run parent method
		    Highcharts.Series.prototype.drawDataLabels.apply(series);

		    // arrange points for detection collision
		    Highcharts.each(data, function(point) {
			if (point.dataLabel) { // it may have been cancelled in the base method (#407)
			    halves[point.half].push(point);
			}
		    });

		    // assume equal label heights
		    labelHeight = halves[0][0] && halves[0][0].dataLabel && (halves[0][0].dataLabel.getBBox().height || 21); // 21 is for #968

		    /* Loop over the points in each half, starting from the top and bottom
		     * of the pie to detect overlapping labels.
		     */
		    while (i--) {

			var slots = [],
				slotsLength,
				usedSlots = [],
				points = halves[i],
				pos,
				length = points.length,
				slotIndex;

			// Sort by angle
			sortByAngle(points, i - 0.5);

			// Only do anti-collision when we are outside the pie and have connectors (#856)
			if (distanceOption > 0) {

			    // build the slots
			    for (pos = centerY - radius - distanceOption; pos <= centerY + radius + distanceOption; pos += labelHeight) {
				slots.push(pos);
				// visualize the slot
				/*
				 var slotX = series.getX(pos, i) + chart.plotLeft - (i ? 100 : 0),
				 slotY = pos + chart.plotTop;
				 if (!isNaN(slotX)) {
				 chart.renderer.rect(slotX, slotY - 7, 100, labelHeight)
				 .attr({
				 'stroke-width': 1,
				 stroke: 'silver'
				 })
				 .add();
				 chart.renderer.text('Slot '+ (slots.length - 1), slotX, slotY + 4)
				 .attr({
				 fill: 'silver'
				 }).add();
				 }
				 */
			    }
			    slotsLength = slots.length;

			    // if there are more values than available slots, remove lowest values
			    if (length > slotsLength) {
				// create an array for sorting and ranking the points within each quarter
				rankArr = [].concat(points);
				rankArr.sort(sort);
				j = length;
				while (j--) {
				    rankArr[j].rank = j;
				}
				j = length;
				while (j--) {
				    if (points[j].rank >= slotsLength) {
					points.splice(j, 1);
				    }
				}
				length = points.length;
			    }

			    // The label goes to the nearest open slot, but not closer to the edge than
			    // the label's index.
			    for (j = 0; j < length; j++) {

				point = points[j];
				labelPos = point.labelPos;

				var closest = 9999,
					distance,
					slotI;

				// find the closest slot index
				for (slotI = 0; slotI < slotsLength; slotI++) {
				    distance = mathAbs(slots[slotI] - labelPos[1]);
				    if (distance < closest) {
					closest = distance;
					slotIndex = slotI;
				    }
				}

				// if that slot index is closer to the edges of the slots, move it
				// to the closest appropriate slot
				if (slotIndex < j && slots[j] !== null) { // cluster at the top
				    slotIndex = j;
				} else if (slotsLength < length - j + slotIndex && slots[j] !== null) { // cluster at the bottom
				    slotIndex = slotsLength - length + j;
				    while (slots[slotIndex] === null) { // make sure it is not taken
					slotIndex++;
				    }
				} else {
				    // Slot is taken, find next free slot below. In the next run, the next slice will find the
				    // slot above these, because it is the closest one
				    while (slots[slotIndex] === null) { // make sure it is not taken
					slotIndex++;
				    }
				}

				usedSlots.push({i: slotIndex, y: slots[slotIndex]});
				slots[slotIndex] = null; // mark as taken
			    }
			    // sort them in order to fill in from the top
			    usedSlots.sort(sort);
			}

			// now the used slots are sorted, fill them up sequentially
			for (j = 0; j < length; j++) {

			    var slot, naturalY;

			    point = points[j];
			    labelPos = point.labelPos;
			    dataLabel = point.dataLabel;
			    visibility = point.visible === false ? HIDDEN : VISIBLE;
			    naturalY = labelPos[1];

			    if (distanceOption > 0) {
				slot = usedSlots.pop();
				slotIndex = slot.i;

				// if the slot next to currrent slot is free, the y value is allowed
				// to fall back to the natural position
				y = slot.y;
				if ((naturalY > y && slots[slotIndex + 1] !== null) ||
					(naturalY < y && slots[slotIndex - 1] !== null)) {
				    y = naturalY;
				}

			    } else {
				y = naturalY;
			    }

			    // get the x - use the natural x position for first and last slot, to prevent the top
			    // and botton slice connectors from touching each other on either side
			    x = options.justify ?
				    seriesCenter[0] + (i ? -1 : 1) * (radius + distanceOption) :
				    series.getX(slotIndex === 0 || slotIndex === slots.length - 1 ? naturalY : y, i);

			    // move or place the data label
			    dataLabel
				    .attr({
				visibility: visibility,
				// align: labelPos[6]
				align: labelPos[8]
			    })[dataLabel.moved ? 'animate' : 'attr']({
				x: x + options.x +
					//({ left: connectorPadding, right: -connectorPadding }[labelPos[6]] || 0),
						({left: connectorPadding, right: -connectorPadding}[labelPos[8]] || 0),
					y: y + options.y - 10 // 10 is for the baseline (label vs text)
				    });
			    dataLabel.moved = true;

			    // draw the connector
			    if (outside && connectorWidth) {
				connector = point.connector;

				connectorPath = softConnector ? [
				    M,
				    //x + (labelPos[6] === 'left' ? 5 : -5), y, // end of the string at the label
				    x + (labelPos[8] === 'left' ? 5 : -5), y, // end of the string at the label
				    'C',
				    x, y, // first break, next to the label
				    2 * labelPos[2] - labelPos[4], 2 * labelPos[3] - labelPos[5],
				    labelPos[2], labelPos[3], // second break
				    L,
				    labelPos[4], labelPos[5],
				    L,
				    labelPos[6], labelPos[7]
				] : [
				    M,
				    x + (labelPos[8] === 'left' ? 5 : -5), y, // end of the string at the label
				    L,
				    labelPos[2], labelPos[3], // second break
				    L,
				    labelPos[4], labelPos[5], // base
				    L,
				    labelPos[6], labelPos[7] // base
				];

				if (connector) {
				    connector.animate({d: connectorPath});
				    connector.attr('visibility', visibility);

				} else {
				    point.connector = connector = series.chart.renderer.path(connectorPath).attr({
					'stroke-width': connectorWidth,
					stroke: options.connectorColor || point.color || '#606060',
					visibility: visibility,
					zIndex: 3
				    })
					    .translate(chart.plotLeft, chart.plotTop)
					    .add();
				}
			    }
			}
		    }
		}
	    };
	    RPieSeries = Highcharts.extendClass(Highcharts.seriesTypes.pie, RPieSeries);
	    Highcharts.seriesTypes.rpie = RPieSeries;
	}).call(Highcharts);
}
if(typeof(Highcharts) !== "undefined"){
    initHighchartsRPieSerie();
}
/**
 * # Plotting Pie Series
 * There are two ways to plot pie chart from record data: a data point per record and
 * total values of all the records
 *
 * ## Data point per record
 * Pie series uses two options for mapping category name and data fields: 
 * *categoryField* and *dataField*, (This is historical reason instead of 
 * using *xField* and *dataIndex*). Suppose we have data model in the following format:
 *
 * <table>
 *    <tbody>
 *       <tr><td>productName</td><td>production</td><td>sold</td></tr>
 *       <tr><td>Product A</td><td>100</td><td>15,645,242</td></tr>
 *       <tr><td>Product B</td><td>200</td><td>22,642,358</td></tr>
 *       <tr><td>Product C</td><td>50</td><td>21,432,330</td></tr>
 *    </tbody>
 * </table>
 * Then we can define the series data as:
 * 
 *     series: [{
 *        type: 'rpie',
 *        categoryField: 'productName',
 *        dataField: 'sold',
 *        radiusField: 'production'
 *     }]
 */
Ext.define('Chart.ux.Highcharts.RPieSerie', {
    extend: 'Chart.ux.Highcharts.Serie',
    alternateClassName: ['highcharts.rpie'],
    type: 'rpie',
    /***
     * @cfg xField
     * @hide
     */

    /***
     * @cfg yField
     * @hide
     */

    /***
     * @cfg dataIndex
     * @hide
     */

    /**
     * @cfg {String} categorieField
     * the field name mapping to store records for pie category data 
     */
    categorieField: null,
    /**
     * @cfg {Boolean} totalDataField
     * See above. This is used for producing donut chart. Bascially informs
     * getData method to take the total sum of dataField as the data point value
     * for those records with the same matching string in the categorieField.
     */
    totalDataField: false,
    /**
     * @cfg {String} dataField
     * the field name mapping to store records for value data 
     */
    dataField: null,
    /**
     * @cfg {String} radiusField
     * the field name mapping to store records for radius data 
     */
    radiusField: null,
    /***
     * @cfg {Boolean} useTotals
     * use the total value of a categorie of all the records as a data point
     */
    useTotals: false,
    /***
     * @cfg {Array} columns
     * a list of category names that match the record fields
     */
    columns: [],
    constructor: function(config) {
	this.callParent(arguments);
	if (this.useTotals) {
	    this.columnData = {};
	    var length = this.columns.length;
	    for (var i = 0; i < length; i++) {
		this.columnData[this.columns[i]] = 100 / length;
	    }
	}
    },
    buildInitData:function(items){
	// Summed up the category among the series data
	var record;
	var data = this.config.data = [];
	if (this.config.totalDataField) {
	    for (var x = 0; x < items.length; x++) {
		record = items[x];
		this.getData(record,data);
	    }
	} else {
	    for (var x = 0; x < items.length; x++) {
		record = items[x];
		data.push(this.getData(record));
	    }
	}
    },	        
    //private
    addData: function(record) {
	for (var i = 0; i < this.columns.length; i++) {
	    var c = this.columns[i];
	    this.columnData[c] = this.columnData[c] + record.data[c];
	}
    },
    //private
    update: function(record) {
	for (var i = 0; i < this.columns.length; i++) {
	    var c = this.columns[i];
	    if (record.modified[c])
		this.columnData[c] = this.columnData[c] + record.data[c] - record.modified[c];
	}
    },
    //private
    removeData: function(record, index) {
	for (var i = 0; i < this.columns.length; i++) {
	    var c = this.columns[i];
	    this.columnData[c] = this.columnData[c] - record.data[c];
	}
    },
    //private
    clear: function() {
	for (var i = 0; i < this.columns.length; i++) {
	    var c = this.columns[i];
	    this.columnData[c] = 0;
	}
    },
    /***
     * As the implementation of pie series is quite different to other series types,
     * it is not recommended to override this method
     */
    getData: function(record, seriesData) {
	var _this = (Chart.ux.Highcharts.sencha.product == 't') ? this.config : this;
	// Summed up the category among the series data
	if (this.totalDataField) {
	    var found = null;
	    for (var i = 0; i < seriesData.length; i++) {
		if (seriesData[i].name == record.data[_this.categorieField]) {
		    found = i;
		    seriesData[i].y += record.data[_this.dataField];
		    break;
		}
	    }
	    if (found === null) {
		if (_this.colorField && record.data[_this.colorField]) {
		    seriesData.push({
			name: record.data[_this.categorieField],
			y: record.data[_this.dataField],
			r: record.data[_this.radiusField],
			color: record.data[_this.colorField],
			record: this.bindRecord ? record : null
		    });
		} else {
		    seriesData.push({
			name: record.data[_this.categorieField],
			y: record.data[_this.dataField],
			r: record.data[_this.radiusField],
			record: this.bindRecord ? record : null
		    });
		}
		i = seriesData.length - 1;
	    }
	    return seriesData[i];
	}

	if (this.useTotals) {
	    this.addData(record);
	    return [];
	}

	if (_this.colorField && record.data[_this.colorField]) {
	    return {
		name: record.data[_this.categorieField],
		y: record.data[_this.dataField],
		r: record.data[_this.radiusField],
		color: record.data[_this.colorField],
		record: this.bindRecord ? record : null
	    };
	} else {
	    return {
		name: record.data[_this.categorieField],
		y: record.data[_this.dataField],
		r: record.data[_this.radiusField],
		record: this.bindRecord ? record : null
	    };
	}
    },
    getTotals: function() {
	var a = new Array();
	for (var i = 0; i < this.columns.length; i++) {
	    var c = this.columns[i];
	    a.push([c, this.columnData[c]]);
	}
	return a;
    }

});

