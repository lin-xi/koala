(function(window){

	var app = window.app = think.module('ugc');

	var res = window.resource;

    app.config({
		router: res.ROUTER,
		view: 'main-content',
		plugins: []
	});

})(window);
