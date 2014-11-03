window.resource = {
	URL: {
		'mytask': '/ugc/index.php?qt=getmytask',
		'searchmytask': '/ugc/index.php?qt=searchmytask',
		'previewtask': '/ugc/index.php?qt=previewtask',
		'gettask': '/ugc/index.php?qt=getclaimtask',
		'checktask': '/ugc/index.php?qt=claimtask',
		'searchtask': '/ugc/index.php?qt=searchclaimtask',
		'droptask': '/ugc/index.php?qt=droptask',
		'getuploadedpic': '/ugc/index.php?qt=getuploadedpic',
		'submitTask': '/ugc/index.php?qt=submittask',
		'resetInfo': '/ugc/index.php?qt=resetregist'
		
		// 'mytask': __uri('/static/data/myTask.json'),
		// 'searchmytask': __uri('/static/data/task.json'),
		// 'previewtask': __uri('/static/data/taskDetailInfo.json')
	},
	PATH: {
		'webUploader': {
			swfUrl: __uri('/static/js/plugins/webUploader/Uploader.swf')
		}
	},
	VIEW: {
		'forbidden': __uri('/static/js/mvc/view/forbidden.html'),
		'unlicensed': __uri('/static/js/mvc/view/unlicensed.html'),
		'auditing': __uri('/static/js/mvc/view/auditing.html'),
		'wellcome': __uri('/static/js/mvc/view/wellcome.html')
	},
	ROUTER: {
		'root': {
			controller: 'RootController'
		},
		'/index': {
			controller: 'IndexController',
			template: __uri('/static/js/mvc/view/index.html')
		},
		'/mytask': {
			controller: 'MyTaskController',
			template: __uri('/static/js/mvc/view/mytask.html')
		},
		'/task': {
			controller: 'TaskController',
			template: __uri('/static/js/mvc/view/task.html')
		},
		'/help': {
			controller: 'HelpController',
			template: __uri('/static/js/mvc/view/help.html')
		}
	}
};