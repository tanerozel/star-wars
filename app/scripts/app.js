'use strict';

/**
 * @ngdoc overview
 * @name appApp
 * @description
 * # appApp
 *
 * Main module of the application.
 */
angular
    .module('appApp', [
        'ngCookies',
        'ngResource',
        'angularUtils.directives.dirPagination',
        'ui.bootstrap',
        'ui.router'
    ])
    .run(['$rootScope', '$state', '$cookies', '$location', '$cookieStore', '$stateParams',
        function ($rootScope, $state,$cookies ,$location, $cookieStore,$stateParams) {
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
            // keep user logged in after page refresh
            $rootScope.globals = $cookieStore.get('globals') || {};


            $rootScope.$on('$locationChangeStart', function (event, next, current) {
                // redirect to login page if not logged in
                if ($location.path() !== '/login' && !$rootScope.globals.currentUser) {
                    $location.path('/login');
                }
            });
     }])
    .config(['$cookiesProvider', function($cookiesProvider) {
        $cookiesProvider.defaults.path="/";
    }])
    .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('/app/planets');

        $stateProvider
            .state('app', {
                abstract: true,
                url: '/app',
                templateUrl: 'views/tmpl/app.html'
            })
            .state('app.people', {
                url: '/people',
                controller: 'PeopleCtrl',
                templateUrl: 'views/tmpl/people/main.html'
            })
            .state('app.planets', {
                url: '/planets',
                controller: 'PlanetsCtrl',
                templateUrl: 'views/tmpl/Planets/main.html',
                params : { data: null },

            })
            .state('app.planetdetail', {
                url: '/planets/detail',
                controller: 'PlanetsDetailCtrl',
                templateUrl: 'views/tmpl/planets/detail.html',
                params : { data: null },
            })
            .state('login', {
                controller: 'LoginCtrl',
                url: '/login',
                templateUrl: 'views/tmpl/login.html'
            })


    }])
    .controller("MainCtrl",function ($scope) {
        $scope.main={
            "name":"Star Wars Project",
            "version":"1.0.0"
        }
    })

    /**
     * @ngdoc function
     * @name appApp.controller:PeopleCtrl
     * @description
     * # PeopleCtrl
     * Controller of the appApp
     */

    .controller('PeopleCtrl', function ($scope, $http, $uibModal) {

        $scope.data = [];
        $scope.total = 0;
        $scope.limit = 10; // this should match however many results your API puts on one page
        getResultsPage(1);

        $scope.pagination = {
            current: 1
        };

        $scope.pageChanged = function(newPage) {
            getResultsPage(newPage);
        };

        function getResultsPage(pageNumber) {
            // this is just an example, in reality this stuff should be in a service
            $http.get('http://swapi.co/api/people/?page=' + pageNumber)
                .then(function(result) {
                    $scope.data = result.data.results;
                    $scope.total = result.data.count
                    console.log($scope.data);
                });
        }
        $scope.showdetail = function(data) {

            var modalInstance = $uibModal.open({
                templateUrl: 'views/tmpl/people/detail.html',
                controller: function ($scope,$uibModalInstance, items) {
                    $scope.items=items;
                    $scope.ok = function () {

                        $uibModalInstance.dismiss('cancel');
                    };

                },
                resolve: {
                    items: function () {
                        return data;
                    }
                }
            });

            modalInstance.result.then(function (selectedItem) {
                $scope.selected = selectedItem;
            }, function () {

            });

        };
    })
    /**
     * @ngdoc function
     * @name appApp.controller:PlanetsCtrl
     * @description
     * # PlanetsCtrl
     * Controller of the appApp
     */

    .controller('PlanetsCtrl', function ($scope, $http,$rootScope,$state, $stateParams) {

        $scope.data = [];
        $scope.total = 0;
        $scope.limit = 10; // this should match however many results your API puts on one page
        getResultsPage(1);

        $scope.pagination = {
            current: 1
        };

        $scope.pageChanged = function(newPage) {
            getResultsPage(newPage);
        };

        function getResultsPage(pageNumber) {
            // this is just an example, in reality this stuff should be in a service
            $http.get('http://swapi.co/api/planets/?page=' + pageNumber)
                .then(function(result) {
                    $scope.data = result.data.results;
                    $scope.total = result.data.count
                    console.log($scope.data);
                });
        }
        $scope.showdetail = function(data) {
            $rootScope.$stateParams = data ;
             console.log(data);
             $state.go("app.planetdetail")
        };
    })
    /**
     * @ngdoc function
     * @name appApp.controller:PlanetsDetailCtrl
     * @description
     * # PlanetsDetailCtrl
     * Controller of the appApp
     */

    .controller('PlanetsDetailCtrl', function ($scope,$state,$stateParams,$rootScope) {
       $scope.data=$rootScope.$stateParams
    })
    /**
     * @ngdoc function
     * @name appApp.controller:LoginCtrl
     * @description
     * # LoginCtrl
     * Controller of the appApp
     */
    .controller('LoginCtrl', function ($scope, $rootScope, $location, aut) {
        // reset login status
        aut.ClearCredentials();
        $scope.login = function () {
            $scope.dataLoading = true;
            aut.Login($scope.username, $scope.password, function(response) {
                if(response.success) {
                    aut.SetCredentials($scope.username, $scope.password);
                    $location.path('/');
                } else {
                    $scope.error = response.message;
                    $scope.dataLoading = false;
                }
            });
        };
    })
    .factory('aut',
        ['Base64', '$http', '$cookieStore', '$rootScope', '$timeout',
            function (Base64, $http, $cookieStore, $rootScope, $timeout) {
                var service = {};

                service.Login = function (username, password, callback) {
                    $timeout(function(){
                        var response = { success: username === 'demo' && password === 'demo' };
                        if(!response.success) {
                            response.message = 'Username or password is incorrect';
                        }
                        callback(response);
                    }, 1000);

                };

                service.SetCredentials = function (username, password) {
                    var authdata = Base64.encode(username + ':' + password);

                    $rootScope.globals = {
                        currentUser: {
                            username: username,
                            authdata: authdata
                        }
                    };

                    $cookieStore.put('globals', $rootScope.globals);
                };

                service.ClearCredentials = function () {
                    $rootScope.globals = {};
                    $cookieStore.remove('globals');
                };

                return service;
            }])

    .factory('Base64', function () {
        /* jshint ignore:start */

        var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

        return {
            encode: function (input) {
                var output = "";
                var chr1, chr2, chr3 = "";
                var enc1, enc2, enc3, enc4 = "";
                var i = 0;

                do {
                    chr1 = input.charCodeAt(i++);
                    chr2 = input.charCodeAt(i++);
                    chr3 = input.charCodeAt(i++);

                    enc1 = chr1 >> 2;
                    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                    enc4 = chr3 & 63;

                    if (isNaN(chr2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(chr3)) {
                        enc4 = 64;
                    }

                    output = output +
                        keyStr.charAt(enc1) +
                        keyStr.charAt(enc2) +
                        keyStr.charAt(enc3) +
                        keyStr.charAt(enc4);
                    chr1 = chr2 = chr3 = "";
                    enc1 = enc2 = enc3 = enc4 = "";
                } while (i < input.length);

                return output;
            },

            decode: function (input) {
                var output = "";
                var chr1, chr2, chr3 = "";
                var enc1, enc2, enc3, enc4 = "";
                var i = 0;

                // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
                var base64test = /[^A-Za-z0-9\+\/\=]/g;
                if (base64test.exec(input)) {
                    window.alert("There were invalid base64 characters in the input text.\n" +
                        "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                        "Expect errors in decoding.");
                }
                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

                do {
                    enc1 = keyStr.indexOf(input.charAt(i++));
                    enc2 = keyStr.indexOf(input.charAt(i++));
                    enc3 = keyStr.indexOf(input.charAt(i++));
                    enc4 = keyStr.indexOf(input.charAt(i++));

                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;

                    output = output + String.fromCharCode(chr1);

                    if (enc3 != 64) {
                        output = output + String.fromCharCode(chr2);
                    }
                    if (enc4 != 64) {
                        output = output + String.fromCharCode(chr3);
                    }

                    chr1 = chr2 = chr3 = "";
                    enc1 = enc2 = enc3 = enc4 = "";

                } while (i < input.length);

                return output;
            }
        };

        /* jshint ignore:end */
    });