niApp.config(function ($routeProvider) {
    $routeProvider.
    when('/', {
        templateUrl: 'home.html'
    }).
    when('/more', {
    	templateUrl: 'more.html'
    }).
    when('/type', {
    	templateUrl: 'type.html'
    }).
    when('/heatmap', {
    	templateUrl: 'heatmap.html'
    }).
    otherwise('/');
});
