niApp.config(function ($routeProvider) {
    $routeProvider.
    when('/', {
        templateUrl: 'home.html'
    }).
    when('/more', {
    	templateUrl: 'more.html'
    }).
    otherwise('/');
});
