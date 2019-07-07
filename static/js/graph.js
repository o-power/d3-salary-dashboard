queue()
    .defer(d3.csv, "data/Salaries.csv")
    .await(makeGraphs);

function makeGraphs(error, salaryData) {
    // Crossfilter.js is a JavaScript plug-in used to slice and dice JavaScript arrays. T
    var ndx = crossfilter(salaryData);
    
    // size
    //console.log(ndx.size());
    
    // salaryData is an array of objects
    // {"": "1", rank: "Prof", discipline: "B", yrs.since.phd: "19", yrs.service: "18", sex: "Male", salary: "139750"}
    // note that numbers are stored as strings
    //console.log(salaryData[0]);
    //console.log(salaryData[0].salary);
    
    // The forEach() method calls a function once for each element in an array, in order.
    salaryData.forEach(function(d) {
        d.salary = parseInt(d.salary);
    });
    
    //console.log(salaryData[0]);
    
    show_gender_balance(ndx);
    
    dc.renderAll();
}


function show_gender_balance(ndx) {
    // A Crossfilter dimension represents a property of the data, be it an existing property or a derived property. (
    // same as var dim = ndx.dimension(function(d) {return d.sex;});
    var dim = ndx.dimension(dc.pluck('sex'));
    var group = dim.group();
    
    // top 3
    //console.log(dim.top(3));
    
    // With the grouping operations, our result set is an array of groups where each group has a key (the thing we’re grouping by) and a value such as the count or sum.
    //console.log(group.all());
    //0: {key: "Female", value: 39}
    //1: {key: "Male", value: 358}
    
    var gender_balance = dc.barChart("#gender-balance")
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(dim)
        .group(group)
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .xAxisLabel("Gender");
   
    // Set a custom tick format. Both .yAxis() and .xAxis() return an axis object, so any additional method chaining applies to the axis, not the chart.
    gender_balance.yAxis().ticks(20);
}


// function makeGraphs(error, salaryData) {
//     var ndx = crossfilter(salaryData);
    
//     salaryData.forEach(function(d){
//         d.salary = parseInt(d.salary);
//     })
    
//     show_discipline_selector(ndx);
//     show_gender_balance(ndx);
//     show_average_salary(ndx);
    
//     dc.renderAll();
// }

// function show_discipline_selector(ndx) {
//     var dim = ndx.dimension(dc.pluck('discipline'));
//     var group = dim.group();
    
//     dc.selectMenu("#discipline-selector")
//         .dimension(dim)
//         .group(group);
// }


// function show_gender_balance(ndx) {
//     var dim = ndx.dimension(dc.pluck('sex'));
//     var group = dim.group();
    
//     dc.barChart("#gender-balance")
//         .width(400)
//         .height(300)
//         .margins({top: 10, right: 50, bottom: 30, left: 50})
//         .dimension(dim)
//         .group(group)
//         .transitionDuration(500)
//         .x(d3.scale.ordinal())
//         .xUnits(dc.units.ordinal)
//         .xAxisLabel("Gender")
//         .yAxis().ticks(20);
// }


// function show_average_salary(ndx) {
//     var dim = ndx.dimension(dc.pluck('sex'));
    
//     function add_item(p, v) {
//         p.count++;
//         p.total += v.salary;
//         p.average = p.total / p.count;
//         return p;
//     }

//     function remove_item(p, v) {
//         p.count--;
//         if(p.count == 0) {
//             p.total = 0;
//             p.average = 0;
//         } else {
//             p.total -= v.salary;
//             p.average = p.total / p.count;
//         }
//         return p;
//     }
    
//     function initialise() {
//         return {count: 0, total: 0, average: 0};
//     }

//     var averageSalaryByGender = dim.group().reduce(add_item, remove_item, initialise);

//     dc.barChart("#average-salary")
//         .width(400)
//         .height(300)
//         .margins({top: 10, right: 50, bottom: 30, left: 50})
//         .dimension(dim)
//         .group(averageSalaryByGender)
//         .valueAccessor(function(d){
//             return d.value.average.toFixed(2);
//         })
//         .transitionDuration(500)
//         .x(d3.scale.ordinal())
//         .xUnits(dc.units.ordinal)
//         .elasticY(true)
//         .xAxisLabel("Gender")
//         .yAxis().ticks(4);   
// }