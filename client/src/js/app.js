var niApp = angular.module('niApp', [])
  .config(['$httpProvider', function ($httpProvider) {
    // Intercept POST requests, convert to standard form encoding
    $httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
    $httpProvider.defaults.transformRequest.unshift(function (data, headersGetter) {
      var key, result = [];

      if (typeof data === "string")
        return data;

      for (key in data) {
        if (data.hasOwnProperty(key))
          result.push(encodeURIComponent(key) + "=" + encodeURIComponent(data[key]));
      }
      return result.join("&");
    });
  }]);
niApp.controller('NIController', function NIController($scope) {
	$scope.address = {
		block: '600 block',
		street: '6908 E Thomas Rd',
		city: 'Scottsdale',
		zip: '85251'
	},
	$scope.risk = {
		level: ['High', 'Medium', 'Low']
	}
});
