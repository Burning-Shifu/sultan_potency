//Переменные  ////////////////////////////////////////////////////////////////
const { src, dest, watch, series, parallel } = require('gulp'),
			scss = require('gulp-sass'),
			autoprefixer = require('gulp-autoprefixer'),
			cssmin = require('gulp-cssmin'),
			concat = require('gulp-concat'),
			browsersync = require('browser-sync').create(),
			group_media = require('gulp-group-css-media-queries'),
			fileInclude = require('gulp-file-include'),
			uglify = require('gulp-uglify-es').default,
			babel = require('gulp-babel'),
			del = require('del'),
			ttf2woff = require('gulp-ttf2woff'),
			ttf2woff2 = require('gulp-ttf2woff2'),
			imagemin = require("gulp-imagemin"),
			webp = require('gulp-webp'),
			webphtml = require('gulp-webp-html'),
			fonter = require('gulp-fonter');
let fs = require('fs');

//Подключаем автообновление браузера ///////////////////////////////////////////////////////////
function browserSync() {
	browsersync.init({
		server: {
			baseDir: 'dist/'
		},
		port: 3000,
		notify: false
	});
}

//Следим за html, обрабатываем и выкидываем файлы в папку dist //////////////////////////////////////
function html() {
	return src(['app/**/*.html', '!app/**/_*.html'])
		.pipe(fileInclude())
		.pipe(webphtml())
		.pipe(dest('dist/'))
		.pipe(browsersync.stream())
}

//Следим за нашим файлом style.scss, конвертируем из него 2 файла css, один обычный, другой минифицированный и закидываем их в папку dist/css///////////////////////////////////////////////////
function styles() {
	return src('app/scss/style.scss')
		.pipe(scss({
			outputStyle: 'expanded'
		}))
		.pipe(group_media())
		.pipe(autoprefixer({
			overrideBrowserslist: ['last 5 version'],
			cascade: false,
			grid: true
		}))
		.pipe(dest('dist/css/'))
		.pipe(scss({
			outputStyle: 'compressed'
		}))
		.pipe(concat('style.min.css'))
		.pipe(dest('dist/css/'))
		.pipe(browsersync.stream())
}

//Следим за нашим файлом script.js, конвертируем из него 2 файла js, один обычный, другой минифицированный и закидываем их в папку dist/js///////////////////////////////////////////////////////
function scripts() {
	return src('app/js/**/*.js')
		.pipe(dest('dist/js/'))
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(uglify())
		.pipe(concat('script.min.js'))
		.pipe(dest('dist/js/'))
		.pipe(browsersync.stream())
}

//Собираем все css файлы подключаемых плагинов, конкатинируем их в 1 минифицированный файл css и закидываем его в папку dist/css с именем libs.min.css//////////////////////////////////////////////
function stylesLibs() {
	return src([
		'node_modules/normalize.css/normalize.css'
	])
		.pipe(autoprefixer({
			overrideBrowserslist: ['last 5 versions'],
			cascade: false,
			grid: true
		}))
		.pipe(cssmin())
		.pipe(concat('libs.min.css'))
		.pipe(dest('dist/css/'))
		.pipe(browsersync.stream())
}

//Собираем все js файлы подключаемых плагинов, конкатинируем их в 1 минифицированный файл js и закидываем его в папку dist/js с именем libs.min.js//////////////////////////////////////////////////
// function scriptsLibs() {
// 	return src([
// 		'node_modules/swiper/swiper-bundle.js',
// 	])
// 		.pipe(uglify())
// 		.pipe(concat('libs.min.js'))
// 		.pipe(dest('dist/js/'))
// 		.pipe(browsersync.stream())
// }

//Следим за всеми файлами jpg, png, svg, gif, ico, webp в папке app/img, конвертируем их в формат webp со сжатием в 70% и закидываем их в папку dist/img. Так же Оригинальные файлы сжимаем до 3 уровня из доступных 7 и отправляем сжатые оригиналы в папку dist/img.///////////////////////////
function images() {
	return src('app/img/**/*.{jpg,png,svg,gif,ico,webp}')
		.pipe(webp({
			quality: 70
		}))
		.pipe(dest('dist/img/'))
		.pipe(src('app/img/**/*.{jpg,png,svg,gif,ico,webp}'))
		.pipe(
			imagemin({
				progressive: true,
				svgoPlugins: [{ removeViewBox: false }],
				interlaced: true,
				optimizationLevel: 3 // 0 to 7
			})
		)
		.pipe(dest('dist/img/'))
		.pipe(browsersync.stream())
}

//Функция слежки за файлами в папке app.////////////////////////////////////////////////////
function watching() {
	watch(['app/scss/**/*.scss'], styles);
	watch(['app/**/*.html'], html);
	watch(['app/js/**/*.js'], scripts);
	watch(['app/img/**/*.{jpg,png,svg,gif,ico,webp}'], images);
}

//Функция удаления папки dist.//////////////
function clear() {
	return del('dist/');
}

//Конвертация и подключение шрифтов.////////////////////////////////////////////////////////////
function fonts() {
	src('app/fonts/*.ttf')
		.pipe(ttf2woff())
		.pipe(dest('dist/fonts/'));
	return src('app/fonts/*.ttf')
		.pipe(ttf2woff2())
		.pipe(dest('dist/fonts/'));
};

function otf2ttf() {
	return src(['app/fonts/*.otf'])
		.pipe(fonter({
			formats: ['ttf']
		}))
		.pipe(dest('app/fonts/'))
}

async function  fontsStyle() {
	let file_content = fs.readFileSync('app/scss/_fonts.scss');
	if (file_content == '') {
		fs.writeFile('app/scss/_fonts.scss', '', cb);
		return fs.readdir('dist/fonts/', function (err, items) {
			if (items) {
				let c_fontname;
				for (var i = 0; i < items.length; i++) {
					let fontname = items[i].split('.');
					fontname = fontname[0];
					if (c_fontname != fontname) {
						fs.appendFile('app/scss/_fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
					}
					c_fontname = fontname;
				}
			}
		})
	}
}

function cb() {

}

//Включаем все в работу///////////////////////////////////////////////////////////////////
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.otf2ttf = otf2ttf;
exports.images = images;
exports.html = html;
exports.styles = styles;
exports.stylesLibs = stylesLibs;
exports.scripts = scripts;
// exports.scriptsLibs = scriptsLibs;
exports.watching = watching;
exports.browserSync = browserSync;
exports.clear = clear;


exports.default = series(clear, stylesLibs, styles, html, scripts, images, fonts, parallel(watching, browserSync));