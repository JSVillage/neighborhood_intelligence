angular.module('niApp').service('userService', function(NavigatorGeolocation, $http) {
  var _user = {};

  var getUser = function(){
    return _user;
  };

  var setUser = function(user){
    _user = user;
  };

  var getGeoData = function(callback, q){

    $http.get('https://maps.googleapis.com/maps/api/geocode/json?' + q + '&sensor=true').then(function(res){
      var isPhoenix = false;
      angular.forEach(res.data.results[0].address_components, function(item){
        if(item.short_name == 'Phoenix'){
          isPhoenix = true;
        }
      });
      _user.isPhoenix = isPhoenix;
      _user.formattedAddress = res.data.results[0].formatted_address;
      _user.lat = res.data.results[0].geometry.location.lat;
      _user.lng = res.data.results[0].geometry.location.lng;

      //console.log("getGeoData: isPhoenix = " + isPhoenix);

      if(typeof callback === 'function'){
        //console.log("getGeoData: Calling callback");
        callback();
      }

    });

  };

  var setUserLocation = function(callback){
    NavigatorGeolocation.getCurrentPosition()
      .then(function(position) {
        _user.lat = position.coords.latitude;
        _user.lng = position.coords.longitude;
        getGeoData(callback, 'latlng=' + _user.lat + ',' + _user.lng);
      },
      function(err){
        console.log('Error getting location ...');
        console.log(err);
        _user.declinedLocation = true;
        if(typeof callback === 'function'){
          callback();
        }
      });
  };

  return {
    getUser : getUser,
    setUser : setUser,
    setUserLocation : setUserLocation,
    getGeoData : getGeoData
  }
});

angular.module('niApp').service('timeService', function() {
  var _time = new Date();

  var getTime = function(){
    return _time;
  };

  var setTime = function(time){
    _time = time;
  };

  return {
    getTime : getTime,
    setTime : setTime
  }
});

angular.module('niApp').service('navService', function() {
  var currentIndex = 0;

  var navigate = function(i,$location){
    console.log(i);
    currentIndex = i = i < 0 ? 3 : i > 3 ? 0 : i;
    switch (i) {
      case 1:
        $location.url("/more");
        break;
      case 2:
        $location.url("/type");
        break;
      case 3:
        $location.url("/heatmap");
        break;
      default:
        $location.url("/");
        break;
    }
  };

  return {
    currentIndex : currentIndex,
    navigate : navigate
  }
});