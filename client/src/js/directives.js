niApp.directive("home", function () {
    return {
        templateUrl: 'home.html',
        controller: 'NIController'
    };
});

niApp.directive("more", function () {
    return {
        templateUrl: 'more.html',
        controller: 'MoreController'
    };
});

niApp.directive("type", function () {
    return {
        templateUrl: 'type.html',
        controller: 'TypeController'
    };
});

niApp.directive("heatmap", function () {
    return {
        templateUrl: 'heatmap.html',
        controller: 'HeatmapController'
    };
});
