niApp.config(function ($routeProvider) {
    $routeProvider.
    when('/', {
        templateUrl: 'home/home.html'
    }).
    when('/more', {
    	templateUrl: 'more/more.html'
    }).
    when('/type', {
    	templateUrl: 'type/type.html'
    }).
    when('/heatmap', {
    	templateUrl: 'heatmap/heatmap.html'
    }).
    otherwise('/');
});
