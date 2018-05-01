var app = angular.module('WhatsAppData', ['ngMaterial']);

app.controller('numbers', ['$scope', '$http', function ($scope, $http) {
    $scope.totalMessages = 0;


    $http.get('http://localhost:3000/getDataObj')
        .then((result) => {
            $scope.data = result.data;
            console.log($scope.data);
            $scope.totalMessages = $scope.data.totalNumberOfMessages;
            generatePieChart(getPieChartDataMessagesPerPerson($scope.data.people), '#messageChart');
            generatePieChart(getPieChartDataMediaPerPerson($scope.data.people), '#mediaChart');
            generateBarChart(getBarchartDataWordCountPP($scope.data.allWordByPerson), "#wordCount");
            $scope.topTenWordsList = getTop10WordsbyPerson($scope.data.wordFrequencyByPerson);
            generateStackedAreaChart('#dateMsg');
            generateStackedBarChart($scope.data.weekdayMessages,'#weekdayAverage');

        }).catch((err) => {
            console.error(err);
        });

}]);


function generatePieChart(data, chartId) {
    nv.addGraph(function () {
        var chart = nv.models.pieChart()
            .x(function (d) {
                return d.label
            })
            .y(function (d) {
                return d.value;
            })
            .width(900)
            .legendPosition("right")
            .labelType("key")
            .labelsOutside(true)
            .labelThreshold(0)
            .showLabels(true);

        d3.select(chartId + " svg")
            .datum(data)
            .transition().duration(350)
            .call(chart);

        return chart;
    });
}

function getPieChartDataMessagesPerPerson(people) {
    var data = [];
    for (person in people) {
        var tempCount = 0;
        for (date in people[person]) {
            tempCount += people[person][date].length
        }
        data.push({
            "label": person + " - " + tempCount,
            value: tempCount
        });
    }
    return data
}

function getPieChartDataMediaPerPerson(people) {
    var data = [];
    for (person in people) {
        var tempCount = 0;
        for (date in people[person]) {
            for (message of people[person][date]) {
                if (message.message.match(/Media omitted|Media har utelämnats/g)) {
                    tempCount += 1;
                }
            }
        }
        data.push({
            "label": person + " - " + tempCount,
            value: tempCount
        });
    }
    return data
}

function generateBarChart(data, chartId) {
    nv.addGraph(function () {
        var chart = nv.models.discreteBarChart()
            .x(function (d) {
                return d.label
            }) //Specify the data accessors.
            .y(function (d) {
                return d.value
            })
            .showValues(true) //...instead, show the bar value right on top of each bar.
            .valueFormat(d3.format(".0f"))

        d3.select(chartId + ' svg')
            .datum(data)
            .call(chart);

        nv.utils.windowResize(chart.update);

        return chart;
    });

}

function getWeekdayavgData() {
    let data = [{
            key: "Rickard",
            values: [
            { x : "Måndag", y : 40 },
            { x : "B", y : 30 },
            { x : 5,   y : 20 }  ]
        },
        {
            key: "Carro",
            values: [
                { x : "A", y : 60 },
                { x : "B", y : 50 },
                { x : 5,   y : 70 } 
            ]            
        }
    ]

    return data;
}

function generateStackedBarChart(data,chartId) {
    nv.addGraph(function() {
        var chart = nv.models.multiBarChart()
          .reduceXTicks(true)   //If 'false', every single x-axis tick label will be rendered.
          .rotateLabels(0)      //Angle to rotate x-axis labels.
          .showControls(true)   //Allow user to switch between 'Grouped' and 'Stacked' mode.
          .groupSpacing(0.1)    //Distance between each group of bars.
          ;
    
        d3.select(chartId+' svg')
            .datum(data)
            .call(chart);
    
        nv.utils.windowResize(chart.update);
    
        return chart;
    });
}

function generateStackedAreaChart(chartId) {
    d3.json('stream.json', function(data) {
        nv.addGraph(function() {
          var chart = nv.models.stackedAreaChart()
                        .margin({right: 100})
                        .x(function(d) { return d[0] })   //We can modify the data accessor functions...
                        .y(function(d) { return d[1] })   //...in case your data is formatted differently.
                        .useInteractiveGuideline(true)    //Tooltips which show all data points. Very nice!
                        .showControls(true)       //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
                        .clipEdge(true);
      
          //Format x-axis labels with custom function.
          chart.xAxis
              .tickFormat(function(d) { 
                return d3.time.format('%x')(new Date(d)) 
          });
      
          chart.yAxis
              .tickFormat(d3.format(',.2f'));
      
          d3.select(chartId + ' svg')
            .datum(data)
            .call(chart);
      
          nv.utils.windowResize(chart.update);
      
          return chart;
        });
      })
}



function getBarchartDataWordCountPP(people) {
    var data = [{
        key: "Word Count",
        values: []
    }];
    var count = 0;
    for (person in people) {
        count = people[person].length
        data[0].values.push({
            label: person,
            value: count
        });
    }
    return data.sort(function (a, b) {
        return parseFloat(a.value) - parseFloat(b.value);
    });
}



function getTop10WordsbyPerson(people) {
    var data = {};
    let returnObject = [];
    for (person in people) {
        data[person] = {}
        for (var i = 0; i <= 10; i++) {
            var element = people[person][i];
            if (i === 0) {
                data[person] = [element]; 
            } else {
                data[person].push(element);
            }
        }
    }

    for (dataPoints in data) {
        returnObject.push({
            name: dataPoints,
            data: data[dataPoints]
        })
    }
    console.log(returnObject);
    return returnObject;

}