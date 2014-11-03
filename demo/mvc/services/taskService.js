app.service('taskService', function() {

    var res = window.resource;
    this.getData = function(page, count, func, error){
    	$.get(res.URL.gettask, {t: new Date().getTime()}, function(result){
            processData(page, count, func, error, result);
    	}, 'json');
	};

    function processData(page, count, func, error, result){
        if(result.info.errno == 0){
            var detail = result.detail;

            detail.data = convert(detail.data);
            
            page = page-1 >= 0? page-1 : 0;
            var data = [],
                start = page*count,
                end = start+count>detail.totalCount? detail.totalCount : start+count;
            
            if(detail.totalCount > start){
                for(var i=start; i<end; i++){
                    var item = detail.data[i];
                    item.index = i+1;
                    data.push(item);
                }
            }
            func({
                totalCount: detail.totalCount,
                data: data
            });
        }else{
            error(result.info);
        }
    }

    this.checkTask = function(ids, func, error){
        $.get(res.URL.checktask, {jobidlist: ids, t: new Date().getTime()}, function(result){
            if(result.info.errno == 0){
                func(result.data);
            }else{
                error(result.info);
            }
        }, 'json');
    };

    this.searchData = function(param, page, count, func, error){
        param.t = new Date().getTime();
        $.get(res.URL.searchtask, param, function(result){
            processData(page, count, func, error, result)
        }, 'json');
    };

    function convert(data){
        var retData = []
        for(var i=0, len= data.length; i<len; i++){
            var item = data[i];
            var obj = {
                jobId: item.id,
                jobName: item.name,
                jobType: item.category_name,
                city: item.city,
                spotCount: item.min_num +'~'+ item.max_num
            };
            retData.push(obj);
        }
        return retData;
    }

});