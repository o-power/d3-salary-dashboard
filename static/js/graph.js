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
        d["yrs.service"] = parseInt(d["yrs.service"]);
        d.yrs_since_phd = parseInt(d["yrs.since.phd"]);
    });
    
    //console.log(salaryData[0]);
    
    show_discipline_selector(ndx);
    show_gender_balance(ndx);
    show_average_salary(ndx);
    show_rank_distribution(ndx);
    show_percent_that_are_professors(ndx, "Female", "#percent-of-female-professors");
    show_percent_that_are_professors(ndx, "Male", "#percent-of-men-professors");
    show_service_to_salary_correlation(ndx);
    show_phd_to_salary_correlation(ndx);
    
    dc.renderAll();
}


function show_gender_balance(ndx) {
    // A Crossfilter dimension represents a property of the data, be it an existing property or a derived property. (
    // same as var dim = ndx.dimension(function(d) {return d.sex;});
    var dim = ndx.dimension(dc.pluck('sex'));
    
    // top 3
    //console.log(dim.top(3)[0]);
    // {"": "265", rank: "Prof", discipline: "A", yrs.since.phd: "37", yrs.service: 35, yrs.since.phd: "37"}
    //console.log(dim.top(3)[0].discipline);
    //A
    
    var group = dim.group();
    // With the grouping operations, our result set is an array of groups where each group has a key (the thing we’re grouping by) and a value such as the count or sum.
    //console.log(group.all());
    //0: {key: "Female", value: 39}
    //1: {key: "Male", value: 358}

    var genderBalanceChart = dc.barChart("#gender-balance")
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
    genderBalanceChart.yAxis().ticks(20);
}

function show_discipline_selector(ndx) {
    var dim = ndx.dimension(dc.pluck('discipline'));
    var group = dim.group();
    
    dc.selectMenu("#discipline-selector")
        .dimension(dim)
        .group(group);
        
    // the option text can be set via the title() function
    // by default the option text is '`key`: `value`'
    //select.title(function (d){
    //    return 'STATE: ' + d.key;
    //});
}


function show_average_salary(ndx) {
    var dim = ndx.dimension(dc.pluck('sex'));
    
    // add (for when records are added to the filtered selection)
    // p is an object that keeps a track of the sum or count for you and thus represents your end goal (the accumulator)
    // v represents a record of the input data. It is replaced by a new line of data every time you call the function.
    function add_item(p, v) {
        p.count++;
        p.total += v.salary;
        p.average = p.total / p.count;
        return p;
    }
    
    // remove (for when records are removed from the filtered selection)
    function remove_item(p, v) {
        p.count--;
        if(p.count == 0) {
            p.total = 0;
            p.average = 0;
        } else {
            p.total -= v.salary;
            p.average = p.total / p.count;
        }
        return p;
    }
    
    // initial (provides the start value)
    // initialises the p object by defining its components
    function initialise() {
        return {count: 0, total: 0, average: 0};
    }
    
    // calculate the average salary by sex
    var averageSalaryByGender = dim.group().reduce(add_item, remove_item, initialise);
    
    //console.log(averageSalaryByGender.all());
    //0: {key: "Female", value: {count: 39, total: 3939094, average: 101002.41025641025}}
    //1: {key: "Male", value: {count: 358, total: 41202370, average: 115090.41899441341}}
    
    var averageSalaryChart = dc.barChart("#average-salary")
        .width(400)
        .height(300)
        .margins({top: 10, right: 50, bottom: 30, left: 50})
        .dimension(dim)
        .group(averageSalaryByGender)
        // averageSalaryByGender is multi-value
        // we have count, total, average so we need to tell dc which one we want
        // converting here to 2 decimal places as well
        .valueAccessor(function(d) {
            return d.value.average.toFixed(2);
        })
        .transitionDuration(500)
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel("Gender");
    
    averageSalaryChart.yAxis().ticks(4);
}

function show_rank_distribution(ndx) {
    var dim = ndx.dimension(dc.pluck('sex'));
    
    // var profByGender = dim.group().reduce(
    //         function(p, v) {
    //             p.total++;
    //             if (v.rank == "Prof") {
    //                 p.match++;
    //             }
    //             return p;
    //         },
    //         function(p, v) {
    //             p.total--;
    //             if (v.rank == "Prof") {
    //                 p.match--;
    //             }
    //             return p;
    //         },
    //         function() {
    //             return {total: 0, match: 0};
    //         }
    //     );
    
    //0: {key: "Female", value: {total: 39, match: 18}}
    //1: {key: "Male", value: {total: 358, match: 248}}
    //console.log(profByGender.all();
    
    function rankByGender(dimension, rank) {
        return dimension.group().reduce(
            function(p, v) {
                p.total++;
                if (v.rank == rank) {
                    p.match++;
                }
                return p;
            },
            function(p, v) {
                p.total--;
                if (v.rank == rank) {
                    p.match--;
                }
                return p;
            },
            function() {
                return {total: 0, match: 0};
            }
        );
    }
    
    var asstProfByGender = rankByGender(dim,"AsstProf");
    var assocProfByGender = rankByGender(dim,"AssocProf");
    var profByGender = rankByGender(dim,"Prof");
    
    //console.log(profByGender.all());
    //console.log(asstProfByGender.all());
    
    dc.barChart("#rank-distribution")
        .width(400)
        .height(300)
        .dimension(dim)
        .group(profByGender, "Prof")
        .stack(asstProfByGender, "Asst Prof")
        .stack(assocProfByGender, "Assoc Prof")
        .valueAccessor(function(d) {
            if(d.value.total > 0) {
                return (d.value.match / d.value.total) * 100;
            } else {
                return 0;
            }
        })
        .x(d3.scale.ordinal())
        .xUnits(dc.units.ordinal)
        .legend(dc.legend().x(320).y(20).itemHeight(15).gap(5))
        .margins({top: 10, right: 100, bottom: 30, left: 30});
} 

function show_percent_that_are_professors(ndx, gender, element) {
    // .groupAll() is a convenience function for grouping all records and reducing to a single value. 
    var percentageThatAreProf = ndx.groupAll().reduce(
        function(p, v) {
            if (v.sex === gender) {
                p.count++;
                if(v.rank === "Prof") {
                    p.are_prof++;
                }
            }
            return p;
        },
        function(p, v) {
            if (v.sex === gender) {
                p.count--;
                if(v.rank === "Prof") {
                    p.are_prof--;
                }
            }
            return p;
        },
        function() {
            return {count: 0, are_prof: 0};    
        },
    );
    
    dc.numberDisplay(element)
        .formatNumber(d3.format(".2%"))
        .valueAccessor(function (d) {
            if (d.count == 0) {
                return 0;
            } else {
                return (d.are_prof / d.count);
            }
        })
        .group(percentageThatAreProf)
}

function show_service_to_salary_correlation(ndx) {
    var genderColors = d3.scale.ordinal()
                                .domain(["Male","Female"])
                                .range(["blue","pink"]);
    
    var eDim = ndx.dimension(dc.pluck("yrs.service"));
    // top 5 records by years of service
   //console.log(eDim.top(5));
    //console.log(eDim.top(5)[0].salary);
    //console.log(eDim.top(5)[0]["yrs.service"]);
    
    var experienceDim = ndx.dimension(function(d) {
        return [d["yrs.service"], d.salary, d.rank, d.sex];
    });
    var experienceSalaryGroup = experienceDim.group();
    
    //console.log(experienceDim.top(3)[0]);
    // {"": "322", rank: "AssocProf", discipline: "B", yrs.since.phd: "9", yrs.service: 9, yrs.since.phd: "9"}
    
    console.log(experienceSalaryGroup.top(1)[0]);
    //{key: [4, 92000, "AsstProf", "Male"], value: 3}
    //console.log(experienceSalaryGroup.top(1)[0].key)
    //[4, 92000, "AsstProf", "Male"]
    
    var minExperience = eDim.bottom(1)[0]["yrs.service"];
    var maxExperience = eDim.top(1)[0]["yrs.service"];
    
    dc.scatterPlot("#service-salary")
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minExperience, maxExperience]))
        .brushOn(false)
        .symbolSize(8)
        .clipPadding(10)
        .xAxisLabel("Years of Service")
        .yAxisLabel("Salary")
        .title(function(d) {
           return d.key[3] + " " + d.key[2] + " earned " + d.key[1];
        })
        .colorAccessor(function (d) {
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(experienceDim)
        .group(experienceSalaryGroup)
        .margins({top: 10, right: 50, bottom: 75, left: 75});
}

function show_phd_to_salary_correlation(ndx) {
    var genderColors = d3.scale.ordinal()
                                .domain(["Male","Female"])
                                .range(["blue","pink"]);
    
    var pDim = ndx.dimension(dc.pluck("yrs_since_phd"));
    
    var phdDim = ndx.dimension(function(d) {
        return [d.yrs_since_phd, d.salary, d.rank, d.sex];
    });
    var phdSalaryGroup = phdDim.group();

    console.log(phdSalaryGroup.top(1)[0]);
    
    var minPhd = pDim.bottom(1)[0].yrs_since_phd;
    var maxPhd = pDim.top(1)[0].yrs_since_phd;
    
    dc.scatterPlot("#phd-salary")
        .width(800)
        .height(400)
        .x(d3.scale.linear().domain([minPhd, maxPhd]))
        .brushOn(false)
        .symbolSize(8)
        .clipPadding(10)
        .xAxisLabel("Years of Service")
        .yAxisLabel("Years since PhD")
        .title(function(d) {
           return d.key[3] + " " + d.key[2] + " earned " + d.key[1];
        })
        .colorAccessor(function (d) {
            return d.key[3];
        })
        .colors(genderColors)
        .dimension(pDim)
        .group(phdSalaryGroup)
        .margins({top: 10, right: 50, bottom: 75, left: 75});
}