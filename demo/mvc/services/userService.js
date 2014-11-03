app.service('userService', function(){

	var res = window.resource;
	this.resetUerInfo = function(func, error){
		$.get(res.URL.resetInfo, {t: new Date().getTime()}, function(result){
            if(result.info.errno == 0){
            	func();
            }else{
            	error(result.info);
            }
    	}, 'json');
    };

});