/**
 * This file/module contains all configuration for the build process.
 */
module.exports = {
  /**
   * The `build_dir` folder is where our projects are compiled during
   * development and the `compile_dir` folder is where our app resides once it's
   * completely built.
   */
  build_dir: 'build',
  compile_dir: 'bin',

  /**
   * This is a collection of file patterns that refer to our app code (the
   * stuff in `src/`). These file paths are used in the configuration of
   * build tasks. `js` is all project javascript, less tests. `ctpl` contains
   * our reusable components' (`src/common`) template HTML files, while
   * `atpl` contains the same, but for our app's code. `html` is just our
   * main HTML file, `less` is our main stylesheet, and `unit` contains our
   * app's unit tests.
   */
  app_files: {
    js: [ 'src/**/*.js', '!src/**/*.spec.js', '!src/assets/**/*.js' ],
    jsunit: [ 'src/**/*.spec.js' ],
    
    coffee: [ 'src/**/*.coffee', '!src/**/*.spec.coffee' ],
    coffeeunit: [ 'src/**/*.spec.coffee' ],

    atpl: [ 'src/app/**/*.tpl.html' ],
    ctpl: [ 'src/common/**/*.tpl.html' ],

    html: [ 'src/index.html' ],
    less: 'src/less/main.less'
  },

  /**
   * This is a collection of files used during testing only.
   */
  test_files: {
    js: [
      'vendor/angular-mocks/angular-mocks.js'
    ]
  },

  /**
   * This is the same as `app_files`, except it contains patterns that
   * reference vendor code (`vendor/`) that we need to place into the build
   * process somewhere. While the `app_files` property ensures all
   * standardized files are collected for compilation, it is the user's job
   * to ensure non-standardized (i.e. vendor-related) files are handled
   * appropriately in `vendor_files.js`.
   *
   * The `vendor_files.js` property holds files to be automatically
   * concatenated and minified with our project source files.
   *
   * The `vendor_files.css` property holds any CSS files to be automatically
   * included in our app.
   *
   * The `vendor_files.assets` property holds any assets to be copied along
   * with our app's assets. This structure is flattened, so it is not
   * recommended that you use wildcards.
   */
  vendor_files: {
    js: [
      'vendor/angular/angular.js',
      'vendor-patches/angular-bootstrap/ui-bootstrap-tpls.min.js',
      'vendor/placeholders/angular-placeholders-0.0.1-SNAPSHOT.min.js',
      'vendor/angular-ui-router/release/angular-ui-router.js',
      'vendor/angular-ui-utils/modules/route/route.js',
	  'vendor/jquery/jquery.js',
	  'vendor/jquery-ui/ui/jquery-ui.js',
	  'vendor/angular-route/angular-route.js',
	  'vendor/restangular/dist/restangular.js',
	  'vendor/underscore/underscore.js',
	  'vendor/angular-ui-router/release/angular-ui-router.js',
	  'vendor/fancybox/source/jquery.fancybox.js',
	  'vendor/ng-grid/ng-grid-2.0.7.debug.js',
	  'vendor/angular-cookies/angular-cookies.js',
      'vendor/bootstrap-modal/js/*.js'
    ],
    css: [
        /* most/all of our stylesheets are compiled into on file from less files.
         The list of those is kept in src/main.less */
        // This one file does not work when included in main.less. I have not been able to figure out why.
        // What fails (among other things, possibly) is the tooltips in the detail view, e.g., on the
        // flag and delete icons and the Open in Bloom button. If bootstrap.css is included instead of linked to,
        // these tooltips display embedded in the detail view and mess up its layout; they don't look like tooltips.
        'vendor/bootstrap-css/css/bootstrap.min.css'
    ],
    assets: [
		'vendor/fancybox/source/fancybox_sprite.png',
        'vendor/fancybox/source/fancybox*.gif',
         'vendor/bootstrap-css/img/*.png' //for glyphicons-halflings.png
    ]
  }
};
