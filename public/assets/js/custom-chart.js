(function ($) {
    "use strict";

    if ($('#myChart').length) {
        var ctx = document.getElementById('myChart').getContext('2d');
        var monthlySalesData = JSON.parse(document.getElementById('monthlySales').value);
        var allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        var totalOrdersMap = Object.fromEntries(allMonths.map(month => [month, 0]));
        monthlySalesData.forEach(entry => {
            var monthName = allMonths[entry.month - 1];
            totalOrdersMap[monthName] = entry.totalOrders;
        });
        var totalOrders = allMonths.map(month => totalOrdersMap[month]);

        const thisWeekData = JSON.parse(document.getElementById('currentWeekSales').value);
        var allDaysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var weeklySales = allDaysOfWeek.map(function (day, index) {
            var revenue = 0;
            if (thisWeekData.length > index) {
                revenue = thisWeekData[index].totalRevenue || 0;
            }
            return {
                day: day,
                sales: revenue
            };
        });

        var monthlyProductDetails = JSON.parse(document.getElementById('monthlyproducts').value);
        var totalProductsMap = Object.fromEntries(allMonths.map(month => [month, 0]));
        monthlyProductDetails.forEach(entry => {
            var monthName = allMonths[entry.month - 1];
            totalProductsMap[monthName] = entry.total;
        });
        var totalProducts = allMonths.map(month => totalProductsMap[month]);

        var totalSalesMap = Object.fromEntries(allMonths.map(month => [month, 0]));
        monthlySalesData.forEach(entry => {
            var monthName = allMonths[entry.month - 1];
            totalSalesMap[monthName] = entry.total;
        });
        var totalSales = allMonths.map(month => totalSalesMap[month]);

        var chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Sales',
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(44, 120, 220, 0.2)',
                    borderColor: 'rgba(44, 120, 220)',
                    data: totalOrders
                },
                {
                    label: 'Products',
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(380, 200, 230, 0.2)',
                    borderColor: 'rgb(380, 200, 230)',
                    data: totalProducts
                }]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true,
                        },
                    }
                }
            }
        });
    }

    if ($('#myChart2').length) {
        var ctx = document.getElementById("myChart2");
        var myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                datasets: [
                    {
                        label: "Month",
                        backgroundColor: ["#5897fb", "#7bcf86", "#ff9076", "#d595e5", "#5897fb", "#7bcf86", "#ff9076", "#d595e5", "#5897fb", "#7bcf86", "#ff9076", "#d595e5"],
                        barThickness: 10,
                        data: totalSales
                    }
                ]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true,
                        },
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    if ($('#myChart3').length) {
        let ctx3 = document.getElementById("myChart3");
        let myChart = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                datasets: [
                    {
                        label: "Week",
                        backgroundColor: ["#5897fb", "#7bcf86", "#ff9076", "#d595e5", "#ffcc00", "#FF5733", "#33FFBD"],
                        barThickness: 10,
                        data: weeklySales.map(entry => entry.sales)
                    }
                ]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true,
                        },
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
})(jQuery);
