app.controller('TaskController', 'taskService', function(taskService){
	var scope = this;

	var CONST_TASK_COUNT = [3, 15, 30];

	var page = 1,  //当前页码
		recordCount = 10, //一页显示的记录条数
		pageSize = 10,  //一页显示的页码数
		totalPage = 0;  //总页码数

	var param = null;

	var table = new Table({
		node: '#taskTable',
		template: 'task'
	});

	var TASK_COUNT = 3;
	if(userInfo){
		var uInfo = $.parseJSON(userInfo);
		TASK_COUNT = CONST_TASK_COUNT[uInfo.level]
	}

	$('input[placeholder]').simplePlaceholder();

	function getData(func){
		taskService.getData(page, recordCount, function(data){
			func(data);
			rebuildUI();
		}, function(error){
			$('#taskTable').html('<div class="alert bg-gray-light">'+error.errmessage+'</div>');
		});
	}

	function renderTable(){
		getData(function(data){
			totalPage = Math.ceil(data.totalCount/recordCount);
			var pg = computePage();
			table.render({
				data: data.data,
				page: pg
			});
		});
	}

	function renderSearchTable(){
		taskService.searchData(param, page, recordCount, function(data){
			totalPage = Math.ceil(data.totalCount/pageSize);
			var pg = computePage();
			table.render({
				data: data.data,
				page: pg
			});

			rebuildUI();
		}, function(err){
			Dialog.error(err.errmessage);
		});
	}

	renderTable();

	table.on('prev', function(e){
		if(page>1){
			page = page-1;
			if(param){
				renderSearchTable();
			}else{
				renderTable();
			}
		}
	});

	table.on('next', function(e){
		if(page<totalPage){
			page = parseInt(page)+1;
			if(param){
				renderSearchTable();
			}else{
				renderTable();
			}
		}
	});

	table.on('pageChange', function(data){
		if(data != page){
			page = data;
			if(param){
				renderSearchTable();
			}else{
				renderTable();
			}
		}
	});
	
	scope.doSearch = function(){
		var city = $('#cityInput').val();
		city == '任务所在地' && (city = '');
		if(!city){ return; }

		param = {};
		param.city = city;

		page = 1;

		renderSearchTable();
	};

	function rebuildUI(){
		$('.icheck').iCheck({
	        checkboxClass: 'icheckbox_flat-blue',
	        radioClass: 'iradio_flat-blue'
	    });

	    $('#checkTask').on('click', function(e){
			var sd = table.getSelectedItem();

			var datas = [];
			$.each(sd, function(key, value){
				datas.push(value);
			});

			if(datas.length == 0){
				Dialog.alert('没有选中任何项');
			}else if(datas.length <= TASK_COUNT){
				var ids = [];
				$.each(datas, function(idx, item){
					ids.push(item.jobId);
				});
				taskService.checkTask(ids.join(','), function(result){
					
					Dialog.alert('领取成功');
					app.redirect('/mytask');
					$('#sidemenu-task').removeClass('in');
					$('#sidemenu-task li:first').removeClass('current').removeClass('active');
					$('#sidemenu-mytask').addClass('in');
					$('#sidemenu-mytask li:first').addClass('current').addClass('active');
					
				}, function(error){
					Dialog.error(error.errmessage);
				});
			}else{
				Dialog.alert('您最多能领取'+TASK_COUNT+'项任务');
			}

		});
	}

	var city = new City({
		holder: '#cityInput'
	});

	function computePage(){
		var st = page-pageSize/2>0 ? page-pageSize/2 : 1;
		var ed;
		if(st+pageSize-1 >= totalPage){
			ed = totalPage;
			st = ed-pageSize+1 > 0 ? ed-pageSize+1 : 1;
		} else{
			ed = st+pageSize-1;
		}
		return {
			start: st,
			end: ed,
			current: page
		}
	}

	//析构函数
	scope.finalize = function(){
		$('._placeholder').remove();
	};
});