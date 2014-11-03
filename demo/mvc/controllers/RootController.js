app.controller('RootController', 'myTaskService, userService', function(myTaskService, userService){
	var scope = this;

	var CONST_TASK_COUNT = [3, 15, 30];

	function displayView(){
		if(userInfo){
			var info = $.parseJSON(userInfo);
			scope.userName = info.name;

			var res = window.resource;
			switch(info.status){
				case "-2":
					app.loadView(res.VIEW.forbidden);
					$(".controll_menu").remove();
				break;
				case "-1":
					app.loadView(res.VIEW.unlicensed);
					$(".controll_menu").remove();
				break;
				case "1":
					app.loadView(res.VIEW.auditing, function(){
						$('#resetInfo').on('click', function(){
							userService.resetUerInfo(function(){
								location.reload();
							}, function(err){
								Dialog.error(err.errmessage);
							});
						});
					});
					$(".controll_menu").remove();
				break;
				case "2":
					app.loadView(res.VIEW.wellcome, function(){

						myTaskService.getData(1, 1000, function(data){
							var fail=0;
							for(var i=0, len=data.totalCount; i<len; i++){
								var item = data.data[i];
								if(item.state == '审核不通过'){
									fail++;
								}
							}

							$('#taskNumber').text(data.totalCount);
							if(data.totalCount >= 3){
								$('#gotoTask').hide();
							}
							var total = data.totalCount, suc, fai;
							if(total>0){
								var rate = Math.round((total-fail)*100/total);
								Morris.Donut({
								  	element: 'task-donut',
								  	data: [
								    	{label: "成功率", value: rate},
								    	{label: "打回率", value: 100-rate}
								  	]
								});
								$('#sucessRate').text(rate+'%');
							}else{
								$('#rateDesc').text('未领取任务');
							}
						});

						$('#user-level').text(info.level-0+1);
						$('#user-taskCount').text(CONST_TASK_COUNT[info.level]);

						$('#gotoTask').on('click', function(){
							app.redirect('/task');
							$('#sidemenu-task').addClass('in');
							$('#sidemenu-task li:first').addClass('current').addClass('active');
							$('#sidemenu-index').removeClass('current').removeClass('active');
						});

					});

				break;
			}
		}
	}

	displayView();

	//菜单点击事件
	this.onMenuClick = function(e){
		var route = e.data;
		if(route == 'root'){
			displayView();
		}else{
			app.redirect(route);
		}
	};
});