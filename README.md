Koala
======
![koala](koala.png)

Koala is a mvc framework, it runs on web and mobile platfroms, and doesn't relay on any other framework.


Feature:

+	**modularized**
	koala can automatically load controllers, services, plugins and filters when they are used, you do not need to refer them in the html files like what you must do in angular.
	
	

## 5分钟入门

1. html

```
	<!DOCTYPE html>
	<html>
		<head>
			<meta charset="utf-8"/>

			<meta name="format-detection" content="telephone=no" />
			<meta name="msapplication-tap-highlight" content="no" />
			<meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height" />

			<meta name="keywords" content="koala"/>
			<meta name="description" content="koala demo" />
			<title>koala demo</title>

	</head>

	<body>
		
		<div id="view">
		</div>

		<script src="js/koala.js"></script>
		<script src="js/app.js"></script>

	</body>

	</html>
```

2. app.js

```
	var app = window.app = koala.module('koala-demo');

	app.config({
		base: 'js',
		router: {
			'/': {
				controller: 'IndexController',
				template: 'views/index'
			}
		},
		view: '#view'
	});
```

3. 目录结构

```
+--src
   +--component
   +--controllers
       ---AppController.js
       ---IndexController.js
   +--stores
   +--views
       ---index.tpl
   ---app.js
   ---koala.js
```

4. 模板 views/index.tpl

```
	<template name="index">
		<ul class="brand-list-head">
			<li class="col-2">姓名</li>
			<li class="col-2">财富</li>
			<li class="col-2"></li>
		</ul>
		<ul class="brand-list">
			{{#each brandList}}
				<li class="row">
					<div class="col-4">
						<p>{{name}}</p>
					</div>
					<div class="col-4">
						<p>{{fortune}}元</p>
					</div>
					<div class="col-4">
						{{time|dateTime}}
					</div>
				</li>
			{{/each}}
		</ul>
	</template>
```

5. 控制器 IndexController.js

 

