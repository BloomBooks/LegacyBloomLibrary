A web site for sharing literacy materials, especially templates for translation into minority languages.

---

## Quick Start

Make sure you have [yarn](https://yarnpkg.com). Look in packages.json under the "engines" key. Get that version of [Nodejs](http://nodejs.org/download/).

```sh
git clone  https://github.com/BloomBooks/BloomLibrary.git
cd BloomLibrary
yarn
```

In one terminal (e.g. in vscode), run

```sh
yarn watch
```

In another terminal (e.g. to its side, in vscode), run

```sh
yarn serve
```

That should open a web browser page at localhost:3000.

## Important Notes about S3 Setup

The router we use makes all pages have a hash before the final part of the url. e.g. bloomlibrary.org/#/browse.

When navigating within the site internally, the router happily deals with this. When navigating to a particular page directly via a url, we would prefer to not include the hash. e.g. bloomlibrary.org/browse.

To date, we have accomplished this by two different methods on S3.
1) Routing Rules
  * In AWS, navigate to the bucket (bloomlibrary.org or dev.bloomlibrary.org)
  * Properties
  * Static website hosting
  * Redirection rules
  * something like
  ```
<RoutingRules>
  <RoutingRule>
    <Condition>
      <KeyPrefixEquals>about</KeyPrefixEquals>
    </Condition>
    <Redirect>
      <ReplaceKeyPrefixWith>#/about</ReplaceKeyPrefixWith>
    </Redirect>
  </RoutingRule>
<RoutingRules>
  ```
  * We recently discovered these don't work on Safari (or iOS Chrome)
  
2) An empty file with redirect rules
  * In AWS, navigate to the bucket (bloomlibrary.org or dev.bloomlibrary.org)
  * Upload an empty file for your page. e.g. browse
  * Click on that file
  * Properties
  * Metadata
  * Add key=Website-Redirect-Location, value=/#/page-name, e.g. /#/browse
  
  Careful! Method 2 won't work if you have implemented method 1.
  
  Note: Method 2 doesn't work with urls containing information after the would-be file name, e.g. https://bloomlibrary.org/readBook/jnG2YFeIIG

## About the grunt files

We built these using [ngBoilerplate](https://github.com/ngbp/ngbp). Read the build.config.js file to see most of what is going on. See the readme of ngBoilerplate for more information. Here are key things:

Grunt merges many vendor and app-specific less files together into the bloom_xyz.css file. The list of these files is main.less.
If you have a css file to load separately, list that in build.config.js.

Normally we have tests run via the offscreen browser phantomjs. If you want to debug using a normal browser, you'll find that setting in karma/X:\dev\BloomLibrary\karma\karma-unit.tpl.js.

### Search Engine Optimization

A problem with the current approach is that Google and other web crawlers
don't see anything more than our home page. This is discussed at length
at https://docs.google.com/document/d/1XAJRmQoJHYkwkf4CVW_OWiBkRT1jqufKF2rJajcnxIw/edit?usp=sharing.

### SIL Build Agent Setup

#### AWS Credentials

The credentials needed to upload the content to the S3 bucket must be supplied in the AWS credential store. On current agents, this can be found at c:\users\bob\\.aws\credentials. When running the build, pass the profile name as the ProfileName parameter of the Upload target.

#### Install on machine

7zip must be accessible in the PATH.

## Copyright and License

Copyright 2013-2018 [SIL International](https://www.sil.org/)
[MIT/X11](https://sil.mit-license.org/)
