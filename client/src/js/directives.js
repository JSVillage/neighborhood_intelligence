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