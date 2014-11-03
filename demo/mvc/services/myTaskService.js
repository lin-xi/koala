app.service('myTaskService', function() {

    var res = window.resource;
	this.getData = function(page, count, func, error){
    	$.get(res.URL.mytask, {t: new Date().getTime()}, function(result){
            processData(page, count, func, error, result);
    	}, 'json');
	};

    this.searchData = function(params, page, count, func, error){
        params.t = new Date().getTime();
        $.get(res.URL.searchmytask, params, function(result){
            result.state = valueToString(result.state);
            processData(page, count, func, error, result);
        }, 'json');
    };

    function processData(page, count, func, error, result){
        if(result.info.errno == 0){
            var detail = result.detail;

            page = page-1 >= 0? page-1 : 0;
            var data = [],
                start = page*count,
                end = start+count>detail.totalCount? detail.totalCount : start+count;
                
            if(detail.totalCount > start){
                for(var i=start; i<end; i++){
                    var item = detail.data[i];
                    item = convert(item);
                    item.index = i+1;
                    item.expireTime = toRemainDate(item.expireTime);
                    item.state = valueToString(item.state);

                    if(item.expireTime == '已过期'){
                        item.submit_state = 'disabled';
                        item.drop_state = 'disabled'
                    }
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

    this.getTaskDetail = function(id, func, errror){
        $.get(res.URL.previewtask, {jobid: id, t: new Date().getTime()}, function(result){
            if(result.info.errno == 0){
                var data = result.detail.job;
                data = convert(data);
                data.state = valueToString(data.state);
                func({data: data});
            }else{
                errror(result.info);
            }
        }, 'json');
    };

    this.getUploadedPhotos = function(id, func, error){
        $.get(res.URL.getuploadedpic, {jobid: id, t: new Date().getTime()}, function(result){
            if(result.info.errno == 0){
                var data = convent2(result.detail.data);
                func(data);
            }else{
                error(result.info);
            }
        }, 'json');
    };

    this.dropTask = function(id, func, error){
        $.get(res.URL.droptask, {jobid: id, t: new Date().getTime()}, function(result){
            if(result.info.errno == 0){
                func();
            }else{
                error(result.info);
            }
        }, 'json');
    };

    this.submitTask = function(id, func, error){
        $.get(res.URL.submitTask, {jobid: id, t: new Date().getTime()}, function(result){
            if(result.info.errno == 0){
                func();
            }else{
                error(result.info);
            }
        }, 'json');
    };

    //添加过滤器，将时间转换为剩余时间
    function toRemainDate(strDate){
        if(!strDate) return '';
        var date = new Date(strDate),
            time = date.getTime();
        if(isNaN(time)){
            var ds = strDate.split(' ');
            var dts = ds[0].split('-');
            var ts = ds[1].split(':');
            var dt = new Date();
            dt.setFullYear(dts[0]);
            dt.setMonth(dts[1]-1);
            dt.setDate(dts[2]);
            dt.setHours(ts[0]);
            dt.setMinutes(ts[1]);
            dt.setSeconds(ts[2]);
            time = dt.getTime();
        }
        var now = new Date().getTime();
        var remainTime = Math.floor((time-now)/1000);

        var temp = remainTime, timeString = '';
        if(temp<=0){
            return '已过期';
        }
        var TIME = [24*60*60, 60*60, 60, 1],
            DESC = ['天', '小时', '分', '秒'];

        var _ = think._;
        while(temp>0){
            _.each(TIME, function(idx, item){
                if(temp>=item){
                    var n = Math.floor(temp/item);
                    timeString += n+DESC[idx];
                    temp = temp - n*item;
                    return true;
                }
            });
        }
        return timeString;
    }
    

    //添加过滤器，将状态值转换为汉字
    function valueToString(state){
        var str = ['', '已发布', '已领取', '提交未完成', '提交完成', '审核中', '审核通过', '已付款', '审核不通过'];
        return str[state];
    }

    function convert(item){
        var obj = {
            "jobId": item.id,
            "jobName": item.name,
            "jobShowName": '',
            "jobType": item.category_name,
            "city": item.city,
            "spotCount": item.min_num +'~'+ item.max_num,
            "state": item.status,
            "expireTime": item.expire_time,
            "desc": item.desc,
            "maxUploadCount": item.max_num,
            "minUploadCount": item.min_num,
            "address": item.address || ''
        };

        if('4567'.indexOf(obj.state) == -1){
            obj.submit_state = '';
        }else{
            obj.submit_state = 'disabled'
        }
        if('4567'.indexOf(obj.state) == -1){
            obj.drop_state = ''
        }else{
            obj.drop_state = 'disabled'
        }
        if('67'.indexOf(obj.state) != -1){
            obj.expireTime = '';
        }

        if(item.imagesInfo){
            obj.imagesInfo = convent2(item.imagesInfo);
        }
        return obj;
    }

    function convent2(data){
        var retData = [];
        for(var i=0, len=data.length; i<len; i++){
            var item = data[i];
            var obj = {
                "photoId": item.id,
                "photoName": item.name,
                "state": item.audit_result,
                "refuse": item.audit_desc || '无',
                "photoUrl": item.src_url
            }
            retData.push(obj);
        }
        return retData;
    }

});