BloomLibrary
============

Bloom Library is a single page application built with AngularJS.

This isn't really a c#/asp thing, but it does include a self-hosted REST backend as c# exe for testing.

Prerequisites
=============
1. Visual Studio 2010 or 2012
2. [NuGet](http://docs.nuget.org/docs/start-here/installing-nuget)

Set Up
=============
To use the test backend, you'll need to tell windows to allow this port to be used locally:

    netsh http add urlacl url=http://+:5432/ user=yourwindowsaccountname

Dependencies
=============

* AngularJS
* [Restangular](https://github.com/mgonto/restangular)
* [Router-UI](https://github.com/angular-ui/ui-router)
* Angular-UI
* FancyBox
* Bootstrap
* Underscore
* Lodash
* JQuery
* JQuery-UI

Where possible, use [bower](http://bower.io) to add dependencies, e.g.

    bower the-package-name --save

Be careful about versions... angularjs and many of these related projects we're using are all changing constantly, and updating one of them may break it all.

Copyright and License
=======
Copyright 2013 [SIL International](http://sil.org)
[MIT/X11](http://sil.mit-license.org/)
