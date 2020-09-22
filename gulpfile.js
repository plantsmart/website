'use strict';

// Load plugins
const autoprefixer = require('gulp-autoprefixer');
const browsersync = require('browser-sync').create();
const cleanCSS = require('gulp-clean-css');
const del = require('del');
const gulp = require('gulp');
const header = require('gulp-header');
const merge = require('merge-stream');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');

// Load package.json for banner
const pkg = require('./package.json');

// Set the banner content
const banner = ['/*!\n',
  ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license %> (https://github.com/StartBootstrap/<%= pkg.name %>/blob/master/LICENSE)\n',
  ' */\n',
  '\n'
].join('');

// Set path
const paths = {
  input: 'src/',
  output: 'docs/',
  scripts: {
		input: 'src/js/*',
		output: 'docs/js/'
	},
	styles: {
		input: 'src/scss/**/*.{scss,sass}',
		output: 'docs/css/'
	}
}

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: paths.output
    },
    port: 3000
  });
  done();
}

// BrowserSync reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean vendor
function clean() {
  return del(paths.output);
}

// Bring third party dependencies from node_modules into vendor directory
function modules() {
  // Bootstrap
  var bootstrap = gulp.src('./node_modules/bootstrap/dist/**/*')
    .pipe(gulp.dest(paths.output + 'vendor/bootstrap'));
  // Font Awesome CSS
  var fontAwesomeCSS = gulp.src('./node_modules/@fortawesome/fontawesome-free/css/**/*')
    .pipe(gulp.dest(paths.output + 'vendor/fontawesome-free/css'));
  // Font Awesome Webfonts
  var fontAwesomeWebfonts = gulp.src('./node_modules/@fortawesome/fontawesome-free/webfonts/**/*')
    .pipe(gulp.dest(paths.output + 'vendor/fontawesome-free/webfonts'));
  // jQuery
  var jquery = gulp.src([
      './node_modules/jquery/dist/*',
      '!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest(paths.output + 'vendor/jquery'));
  return merge(bootstrap, fontAwesomeCSS, fontAwesomeWebfonts, jquery);
}

// CSS task
function css() {
  return gulp
    .src(paths.styles.input)
    .pipe(plumber())
    .pipe(sass({
      outputStyle: 'expanded',
      includePaths: './node_modules',
    }))
    .on('error', sass.logError)
    .pipe(autoprefixer({
      cascade: false
    }))
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest(paths.styles.output))
    .pipe(browsersync.stream());
}

// JS task
function js() {
  return gulp
    .src(paths.scripts.input)
    .pipe(uglify())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(paths.scripts.output))
    .pipe(browsersync.stream());
}

// Media task
function media() {
  return gulp.src([
    paths.input + 'img/*',
    paths.input + 'mp4/*'
  ], {base: paths.input})
  .pipe(gulp.dest(paths.output))
}

// HTML task
function html() {
  return gulp.src([
    paths.input + '**/*.html'
  ], {base: paths.input})
  .pipe(gulp.dest(paths.output))
}

// Watch files
function watchFiles() {
  gulp.watch(paths.styles.input, css);
  gulp.watch(paths.scripts.input, js);
  gulp.watch(paths.input + '**/*.html', browserSyncReload);
}

// Define complex tasks
const vendor = gulp.series(clean, modules);
const build = gulp.series(vendor, gulp.parallel(css, js, media, html));
const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));

// Export tasks
exports.css = css;
exports.js = js;
exports.clean = clean;
exports.vendor = vendor;
exports.build = build;
exports.watch = watch;
exports.default = build;
