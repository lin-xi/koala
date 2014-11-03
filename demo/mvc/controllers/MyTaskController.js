app.controller('MyTaskController', 'myTaskService', function(myTaskService){
	var scope = this;

	var page = 1,  //当前页码
		recordCount = 10, //一页显示的记录条数
		pageSize = 10,  //一页显示的页码数
		totalPage = 0,  //总页码数
		panelState = 0;  //panel状态

	var param = null;

	var table = new Table({
		node: '#myTaskTable',
		template: 'mytask'
	});

	$('input[placeholder]').simplePlaceholder();
	$('#searchState').selectpicker();

	function getData(func){
		myTaskService.getData(page, recordCount, function(data){
			func(data);
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
		myTaskService.searchData(param, page, recordCount, function(data){
			totalPage = Math.ceil(data.totalCount/recordCount);
			var pg = computePage();
			table.render({
				data: data.data,
				page: pg
			});
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

	table.on('preview', function(data){
		if(panelState) return;
		var panel = $('#popPanel');
		showPanel();
		panel.html('<div id="preview-wraper1"></div>');
		
		myTaskService.getTaskDetail(data.jobId, function(taskInfo){
			new Preview({
				node: '#preview-wraper1',
				data: taskInfo.data
			});
		});
		
	});

	table.on('submit', function(data){
		if(panelState) return;
		var panel = $('#popPanel');
        showPanel();
        panel.html('<div id="upload-wraper1"></div>');

        myTaskService.getUploadedPhotos(data.jobId, function(result){
        	var newData = {
        		imagesInfo: result
        	};
        	newData.minUploadCount = data.minUploadCount;
        	newData.maxUploadCount = data.maxUploadCount;
        	newData.jobName = data.jobName;
        	newData.jobId = data.jobId;

        	var up = new Uploader({
	            node: '#upload-wraper1',
	            data: newData
	        });

        	up.off('submitTask');
	        up.on('submitTask', function(id){
	        	myTaskService.submitTask(id, function(){
	        		renderTable();

	        		hidePanel();
	        		Dialog.alert('提交成功');
	        	}, function(err){
	        		hidePanel();
	        		Dialog.error(err.errmessage);
	        	});
	        });
        }, function(err){
        	Dialog.error(err.errmessage);
        });
        
	});

	table.on('drop', function(data){
		if(panelState) return;
		Dialog.confirm('您确认要放弃任务吗？', function(){
			myTaskService.dropTask(data.jobId, function(){
				Dialog.alert('您已成功放弃该任务');
				renderTable();
			}, function(err){
				Dialog.error(err.errmessage);
				renderTable();
			});
		});
	});

	scope.doSearch = function(){
		var name = $('#searchName').val();
		var city = $('#cityInput').val();
		var status = $('#searchState').selectpicker('val');
		status = status == '0' ? null : status;

		param = {};
		name && name != '拍摄点名称' && (param.name = name);
		city && city != '任务所在地' && (param.city = city);
		status && (param.status = status);

		page = 1;

		renderSearchTable();
	};

	function showPanel(){
		panelState = 1;
        var panel = $('#popPanel');
        var h = $(window).height() - 40;
        panel.height(h).show().stop().animate({
            right: 0
        }, 500, function(){
        	$('#panel-close').show();
        });
    }

    function hidePanel(){
    	panelState = 0;
    	$('#panel-close').hide();
        var panel = $('#popPanel');
        panel.stop().animate({
            right: -700
        }, 500, function(){
            panel.hide();
        });
    }

    $('#panel-close').on('mousedown', function(e){
        hidePanel();
    });

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

	};

});