const gulp = require('gulp')
const terser = require('gulp-terser')
const clean = require('gulp-clean')
const eslint = require('gulp-eslint')

gulp.task('build', ['clean'], () => {
  return gulp.src('src/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(terser())
    .pipe(gulp.dest('dist'))
})

gulp.task('clean', () => {
  return gulp.src('dist', {force: true})
    .pipe(clean())
})

gulp.task('default', ['build'])
