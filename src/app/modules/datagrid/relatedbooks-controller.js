(function () { // to wrap use strict
    'use strict';

    angular.module('BloomLibraryApp.relatedbooks', ['ui.router', "restangular", 'ngTagsInput'])
        .config(function config($urlRouterProvider, $stateProvider, $compileProvider) {
        });

    angular.module('BloomLibraryApp.relatedbooks').controller('relatedbooks', ['$scope', '$state', '$stateParams', '$q', '$modal', 'bookService', '$location', '$modalInstance', 'book', 'booksData',
        function ($scope, $state, $stateParams, $q, $modal, bookService, $location, $modalInstance, book, booksData) {
            $scope.books = [];

            function getArrayMemberByProperty(ar, key, value) {
                return ar.filter(function(item) {
                    return item[key] == value;
                })[0];
            }

            function addBooksRelatedTo(id) {
                var isNewRelationship = $scope.books.length == 1;
                return bookService.getRelatedBooks(id).then(function (results) {
                    if (results.length > 0) {
                        var relatedBooks = results[0].books;
                        for (var i = 0; i < relatedBooks.length; i++) {
                            //Don't add this book
                            if(id != relatedBooks[i].objectId) {
                                $scope.books.push(getArrayMemberByProperty($scope.reducedBooksData, 'objectId', relatedBooks[i].objectId));
                            }
                        }
                    }
                    if(!isNewRelationship) {
                        $scope.saveCurrentRelationship();
                    }
                }, function(error) { console.log("error with addBooksRelatedTo" + error); });
            }

            $scope.showConfirmRelateDialog = function (book, relatedBooks) {
                var confirmModalInstance = $modal.open({
                    templateUrl: 'modules/datagrid/confirmRelateDialog.tpl.html',
                    controller: 'confirmRelateDialog',
                    //windowClass: 'ccmodal deleteConfirm',
                    // this defines the value of 'book' as something that is injected into the BloomLibraryApp.deleteDialog's
                    // controller, thus giving it access to the book whose license we want details about.
                    resolve: {relatedBooks: function() {return relatedBooks;}}
                });

                confirmModalInstance.result.then(function(result) {
                    if (result) {
                        addBooksRelatedTo(book.objectId);
                    }
                    else {
                        $scope.books.length--;
                    }
                });
            };

            $scope.onTagAdded = function(book) {
                bookService.getRelatedBooks(book.objectId).then(function (results) {
                    if(results.length > 0) {
                        var relatedBooks = results[0].books.map(function(item) {
                            return getArrayMemberByProperty($scope.reducedBooksData, 'objectId', item.objectId);
                        });
                        $scope.showConfirmRelateDialog(book, relatedBooks);
                    }
                    else {
                        $scope.saveCurrentRelationship();
                    }
                });
            };

            $scope.saveCurrentRelationship = function() {
                bookService.relateBooksById.apply(this, $scope.books.sort(function (a, b) {
                    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
                }).map(function (item) {
                    return item.objectId;
                }));
            };

            $scope.reducedBooksData = booksData.map(function(bookItem) {
                var book = {};
                book.objectId = bookItem.objectId;
                book.imgUrl = bookItem.baseUrl + "thumbnail-70.png";
                book.title = bookItem.title;
                book.languages = bookItem.langPointers ? bookItem.langPointers.map(function (langItem) {
                    var output = '';
                    output += langItem.name;
                    if (langItem.englishName && langItem.name != langItem.englishName) {
                        output += ' (' + langItem.englishName + ')';
                    }
                    return output;
                }).toString() : '';
                book.uploader = bookItem.uploader.email;
                book.copyright = bookItem.copyright;
                book.text = bookItem.title + " (" + bookItem.objectId + ")";
                return book;
            });

            $scope.autoCompleteBook = function(query) {
                var deferred = $q.defer();
                var regex = new RegExp(query, 'i');
                var matches = $scope.reducedBooksData.filter(function(book) {
                    for(var prop in book) {
                        if(regex.test(book[prop])) {
                            return true;
                        }
                    }
                    return false;
                });
                deferred.resolve(matches);
                return deferred.promise;
            };

            $scope.books.push(getArrayMemberByProperty($scope.reducedBooksData, 'objectId', book.objectId));
            addBooksRelatedTo(book.objectId);

            $scope.book = book;

            $scope.close = function () {
                $modalInstance.close();
            };

            // This is so the dialog closes when the back button in the browser is used.
            $scope.$on('$locationChangeSuccess', function (event) {
                $modalInstance.close();
            });
        } ]);
} ());  // end wrap-everything function