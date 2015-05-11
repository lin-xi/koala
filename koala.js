(function(window){
	
	var _moduleBus = {}, //模块缓存
		_controllerBus = {}, //控制器缓存
		_runStack = [],  //运行栈,只放controller
		_parseTree = {}, //解析树
		_parseBus = {},  //记录解析过的scope
		_config = null,  //全局配置
		_uid = 1,   //uuid
		_currentController = null, //当前的控制器
		_cssBus = {};  //css缓存

	var STATE = {
		INIT: 0,
		LOADED: 1,
		RUN: 2
	};

	var DIRECTIVE = {
		common: ['bind'],
		events: ['click', 'mouseenter', 'mouseleave', 'keydown', 'keyup', 'mouseup', 'mousedown', 'mousemove']
	};

	/*--------------------------------------------------------*/
	function Mvc(name){
		this.name = name;
		this._routParms = {};
		_.extend(this, Event);
	}

	Mvc.prototype.controller = function(name){
		var dependenceStr, func
		var args = Array.prototype.slice.call(arguments, 1);
		if(args.length == 2){
			dependenceStr = args[0];
			func = args[1];
		}else{
			dependenceStr = '';
			func = args[0];
		}
		if(!_.isFunction(func)) console.error('controller [', name, '], arguments error.');
		var className = name;
		if(_moduleBus[className]){
			console.error('controller [', name, '] already exist.');
			return;
		}
		var dependences = getDependence(dependenceStr) || [];
		_moduleBus[className] = {
			name: className,
			type: 'controller',
			state: STATE.INIT,
			dependences: dependences,
			fn: func
		};
		checkDependence(className);
	};

	Mvc.prototype.service = function(name){
		var dependenceStr, func
		var args = Array.prototype.slice.call(arguments, 1);
		if(args.length == 2){
			dependenceStr = args[0];
			func = args[1];
		}else{
			dependenceStr = '';
			func = args[0];
		}
		if(!_.isFunction(func)) console.error('service [', name, '], arguments error.');
		var className = name;
		if(_moduleBus[className]){
			console.error('service [', name, '] already exist.');
			return;
		}
		var dependences = getDependence(dependenceStr) || [];
		_moduleBus[className] = {
			name: className,
			type: 'service',
			state: STATE.INIT,
			dependences: dependences,
			fn: newFunction(func)
		};
		checkDependence(className);
	};

	Mvc.prototype.config = function(opts){
		var me = this;
		_config = opts;
		var routers = opts.router;

		_.each(routers, function(path, route){
			bindRouter(path);
		});
		Path.listen();

		if(location.hash == ''){
			me.redirect('/');
		}

		function bindRouter(path){
			var route = routers[path];
			if(/^\//.test(path)){
				Path.map('#'+path).to(function(){
					if(route.redirect){
						Path.dispatch(route.redirect);
					}else{
						if(route.css){
							if(!_cssBus[route.css]){
								_.loadCss(route.css);
								_cssBus[route.css] = true;
							}
						}
						me._route(path);
						me.dispatchEvent('pathChange', '#'+path);
					}
				});
			}
		}
		runController('RootController', document.body);
		if(opts.plugins){
			//DIRECTIVE.plugins
		}
	};

	Mvc.prototype.plugin = function(name){
		var dependenceStr, func;
		var args = Array.prototype.slice.call(arguments, 1);
		if(args.length == 2){
			dependenceStr = args[0];
			func = args[1];
		}else{
			dependenceStr = '';
			func = args[0];
		}
		if(!_.isFunction(func)) console.error('controller [', name, '], arguments error.');
		var className = name;
		if(_moduleBus[className]){
			console.error('controller [', name, '] already exist.');
			return;
		}
		var dependences = getDependence(dependenceStr) || [];
		_moduleBus[className] = {
			name: className,
			type: 'plugin',
			state: STATE.INIT,
			dependences: dependences,
			fn: func
		};
		checkDependence(className);
	};
	Mvc.prototype.redirect = function(path){
		location.href = location.href.split('#')[0] + '#' +path;
		// Path.dispatch('#'+path);
	};
	Mvc.prototype.setRouteParam = function(param){
		var me = this;
		_.each(param, function(key, value){
			me._routParms[key] = value;
		});
	};
	Mvc.prototype.getRouteParam = function(key){
		return this._routParms[key];
	};
	Mvc.prototype.removeRouteParam = function(key){
		delete this._routParms[key];
	};
	Mvc.prototype.emptyRouteParam = function(key){
		this._routParms = {};
	};
	Mvc.prototype._route = function(path){
		var rt = _config.router[path];
		if(rt && rt.template){
			_.ajax.get(rt.template, {t: +new Date().getTime()}, function(response){
				if(_config.view){
					var view = document.getElementById(_config.view);
					view.innerHTML = response;
					view.scrollTop = 0;
					//调用controller的析构函数
					if(_currentController){
						var ctrl = _controllerBus[_currentController];
						if(ctrl && ctrl.scope){
							ctrl.scope.finalize && ctrl.scope.finalize();
						}
					}
					//执行controller
					runController(rt.controller, view);
				}
			});
		}
	};
	/*
	Mvc.prototype.loadView = function(path, func){
		$.get(path, 'text')
		.done(function(response){
			if(_config.view){
				var view = document.getElementById(_config.view);
				view.innerHTML = response;
				func && func();
			}
		});
	};
	*/

	/*--------------------------------------------------------*/
	function Scope(id, dom, controller){
		this._id = id;
		this._dom = dom;
		this._controller = controller;
	}

	Scope.prototype.on = function(){

	};
	Scope.prototype.dispatch = function(){

	};
	Scope.prototype.apply = function(func){
		func && func();
		if(!_parseBus[this._id]){
			traverse(this._dom, this);
			_parseBus[this._id] = true;
		}
		flushParseTree();
	};
	Scope.prototype.filter = {
		toUpperCase: function(val){
			val.toUpperCase();
		},

		toLowerCase: function(val){
			val.toLowerCase();
		},

		datetime: function(stamp){
			var d = new Date(stamp*1000);
			var dt = [], ti=[];
			dt.push(d.getFullYear());
			dt.push(d.getMonth()+1);
			dt.push(d.getDate());
			ti.push(d.getHours()<10 ? '0'+d.getHours() : d.getHours());
			ti.push(d.getMinutes()<10 ? '0'+d.getMinutes() : d.getMinutes());
			ti.push(d.getSeconds()<10 ? '0'+d.getSeconds() : d.getSeconds());
			return dt.join('/') + ' '+ti.join(':');
		},

		image: function(src){
			if(src){
				return '<img src="'+ src +'"/>';
			}
			return '';
		},

		none: function(val){
			if(val){
				return val;
			}else{
				return '';
			}
		}
	};

	/*--------------------------------------------------------*/
	//反射
	function newInstance(strClass) {
	    var args = Array.prototype.slice.call(arguments, 1);
	    var clsClass = eval(strClass);
	    function F() {
	        return clsClass.apply(this, args);
	    }
	    F.prototype = clsClass.prototype;
	    return new F();
	};
	function newFunction(func) {
	    var args = Array.prototype.slice.call(arguments, 1);
	    function F() {
	        return func.apply(this, args);
	    }
	    F.prototype = func.prototype;
	    return new F();
	};
	function newDataScope(data, scope){
		var s = new Scope(_.md5(), null, null);
		_.extend(s, data);
		if(scope && scope.filter){
			s.filter = scope.filter;
		}
		return s;
	}
	function getDependence(dependenceStr){
		if(dependenceStr){
			var temp = _.trim(dependenceStr).split(','), result = [];
			_.each(temp, function(idx, ele){
				var item = _.trim(ele);
				item && result.push(item);
			});
			return result;
		}
		return null;
	}
	function checkDependence(className){
		var mod = _moduleBus[className];
		if(mod){
			var deps = mod.dependences, all_loaded = true;
			if(deps.length>0){
				_.each(deps, function(idx, item){
					var depmod = _moduleBus[item];
					if(!depmod || depmod.state != STATE.LOADED){
						all_loaded = false;
					}
				});
			}
			if(all_loaded){
				mod.state = STATE.LOADED;
				globalDependenceCheck()
			}
		}
	}
	function globalDependenceCheck(){
		for(var className in _moduleBus){
			var mod = _moduleBus[className];
			if(mod && mod.state != STATE.LOADED){
				var deps = mod.dependences, all_loaded = true;
				if(deps.length>0){
					_.each(deps, function(idx, item){
						var depmod = _moduleBus[deps[idx]];
						if(!depmod || depmod.state != STATE.LOADED){
							all_loaded = false;
						}
					});
				}
				if(all_loaded){
					mod.state = STATE.LOADED;
					checkRunStack(mod.name);
					globalDependenceCheck();
				}
			}else if(mod && mod.state == STATE.LOADED){
				checkRunStack(mod.name);
			}
		}
	}
	function checkRunStack(name){
		if(_runStack.length>0 && _runStack[0].controller == name){
			var run = _runStack.pop();
			runController(run.controller, run.dom);
		}
	}

	function runController(controllerName, dom){
		var controller = _moduleBus[controllerName];
		if(controller && controller.state == STATE.LOADED){
			if(controller.dependences){
				var args = [];
				_.each(controller.dependences, function(idx, item){
					var depMod = injectModule(_moduleBus[item]);
					args.push(depMod);
				});
			}
			var id = _.md5()+'_'+_.uuid();
			var scope = new Scope(id, dom, controller.name);
			_controllerBus[controller.name] = {
				scope: scope
			};
			var scope = _controllerBus[controller.name].scope;
			controller.fn.apply(scope, args);
			_currentController = controller.name;
			delete _parseBus[scope._id];
			scope.apply();
		}else{
			_runStack.push({
				controller: controllerName,
				dom: dom
			});
		}
	}

	function injectModule(mod){
		if(mod){
			if(mod.state == STATE.LOADED){
				var args = [];
				if(mod.dependences){
					_.each(mod.dependences, function(idx, item){
						switch(_moduleBus[item].type){
							case 'plugin':
								args.push(injectModule(_moduleBus[item]));
							break;
							case 'service':
								args.push(_moduleBus[item].fn);
							break;
						}
					});
				}
				switch(mod.type){
					case 'plugin':
						var clas = mod.fn.apply(newDataScope({}), args);
						return _.copy(clas, Event);
					break;
					case 'service':
						return mod.fn;
					break;
				}
				
			}
		}
	}

	function traverse(node, scope){
		compileDirective(node, scope);
		if(!checkExitDirective(node)){
			var children = node.children;
			if(children.length>0){
				_.each(children, function(idx, child){
	      			if(child.nodeType == 1){
		      			traverse(child, scope);
		      		}
	      		});
			}
		}
    }
    function compileDirective(node, scope){
    	//解析 directive
    	_.each(DIRECTIVE, function(key, items){
    		_.each(items, function(idx, item){
    			if(key == 'common'){
    				var value = node.getAttribute(item);
    				if(value !== null){
    					compileCommonDirective(item, value, node, scope);
    				}
    			}else if(key == 'events'){
    				var value = node.getAttribute(item);
    				if(value !== null){
    					compileEventsDirective(item, value, node, scope);
    				}
    			}
    		});
    	});
    	//解析模板变量{{}}
    	var outerhtml = node.outerHTML,
    		html = outerhtml.substr(0, outerhtml.length-node.innerHTML.length);
    	//匹配 width="{{width}}"
		var group = html.match(/\s+([^=]+)=\s*(('[^\{\{]*\{\{[^\{\{}]+\}\}[^']*')|("[^\{\{]*\{\{[^\{\{}]+\}\}[^"]*"))/g);
		if(group){
			_.each(group, function(i, item){
				var attrs = group[i].split('='),
    				attr = _.trim(attr[0]),
    				attrValue = _.trim(attr[1].replace(/['"]/g, ''));
    			addToParseTree(attr, attrValue, attrValue, 1, node, scope);
			});
		}
    	var children = node.children;
    	if(children.length == 0){
    		//匹配 <p>hello, {{name}}</p>
			var group = outerhtml.match(/\>([^\{\{]*\{\{(.*?)\}\}[^\>\/]*)<\//g);
			if(group){
    			addToParseTree('innerHTML', _.trim(group[1]), node.innerHTML, 1, node, scope);
			}
    	}
    }
    function compileCommonDirective(directive, bindString, node, scope){
    	switch(directive){
    		case 'bind':
    			addToParseTree('innerHTML', bindString, '{{'+bindString+'}}', 1, node, scope);
    			// node.innerHTML = parseBindValue(bindString, scope);
    		break;
    		case 'repeat':
    			var template = node.innerHTML;
    			addToParseTree('innerHTML', bindString, template, 0, node, scope);
    			//traverse(node, scope);
    		break;
    	}
    }
    function compileEventsDirective(eventType, handler, node, scope){
    	DomEvent.off(eventType, node, handler);
    	var hdr = parseEventhandler(handler);
    	if(hdr){
	    	DomEvent.on(eventType, node, function(e){
	    		e.data = hdr.args;
	    		var func = scope[hdr.func];
    			func && func.apply(node, [e]);
	    	});
    	}
    }
    function addToParseTree(attr, bindString, template, times, node, scope){
    	var id = node.getAttribute('id');
    	if(!id){
    		id = 'x_'+_.md5()+'_'+_.uuid();
    		node.setAttribute('id', id);
    	}
    	_parseTree[id] = {
			attribute: attr,
			bindString: bindString,
			template: template,
			bindTimes: times,
			scope: scope
		}
    }
    function flushParseTree(){
    	_.each(_parseTree, function(key, treeNode){
    		var node = document.getElementById(key);
    		if(node){
    			if(treeNode.bindTimes){
    				//只循环一次
    				if(treeNode.attribute == 'innerHTML'){
    					node.innerHTML = _.render(treeNode.template, treeNode.scope);
    				}else{
    					var val = _.render(treeNode.template, treeNode.scope);
    					node.setAttribute(treeNode.attribute, val);
    				}
    			}else{
    				//循环多次
    				var items = treeNode.bindString.split('in');
	    			var arrStr = _.trim(items[1]), itemStr = _.trim(items[0]);
	    			var array = parseBindValue(arrStr, scope);
    				var html = [];
    				_.each(array, function(idx, data){
						html.push(_.render(template, data, function(key, da){
							var realKey = _.trim(key);
							if(realKey == itemStr) return da;
							if(realKey == 'index') return idx+1;
							var realKey = realKey.replace(itemStr+'.', '');
							return parseBindValue(realKey, newDataScope(da, scope));
						}));
    				});
    				node.innerHTML = html.join('');
    			}
    		}
    	});
    }
    function checkExitDirective(node){
    	var exitDirective = ['repeat'];
    	var result = false;
    	_.each(exitDirective, function(idx, item){
    		if(node.getAttribute(item)){
    			result = true;
    			return true;
    		}
    	});
    	return result;
    }
    function parseBindValue(bindString, controller){
    	var keys, filter, v;
    	if(bindString.indexOf('|')>0){
    		var parts = bindString.split('|');
    		var keyPart = _.trim(parts[0]),
    			filter = _.trim(parts[1]);
    		keys = keyPart.split('.');
    	}else{
    		keys = bindString.split('.');
    	}
    	var scope = _moduleBus[controller].
		_.each(keys, function(idx, key){
			v ? v = v[key] : v = scope[key];
		});
		if(filter){
			if(scope.filter && scope.filter[filter]){
				v = scope.filter[filter](v);
			}else{
				console.error('filter not exist');
			}
		}
		return v;
    }
    function parseEventhandler(funcString){
    	var group = new String(funcString).match(/\s*(\w+)\(([^\)]*)\)/);
    	if(group && group.length==3){
    		return {
    			func: group[1],
    			args: group[2].replace(/['"]/g, '').split(',')
    		}
    	}
    	return null;
    }

	/*--------------------------------------------------------*/
	var Path = {
	    'version': "0.8.4",
	    'map': function (path) {
	        if (Path.routes.defined.hasOwnProperty(path)) {
	            return Path.routes.defined[path];
	        } else {
	            return new Path.core.route(path);
	        }
	    },
	    'root': function (path) {
	        Path.routes.root = path;
	    },
	    'rescue': function (fn) {
	        Path.routes.rescue = fn;
	    },
	    'history': {
	        'initial':{}, // Empty container for "Initial Popstate" checking variables.
	        'pushState': function(state, title, path){
	            if(Path.history.supported){
	                if(Path.dispatch(path)){
	                    history.pushState(state, title, path);
	                }
	            } else {
	                if(Path.history.fallback){
	                    window.location.hash = "#" + path;
	                }
	            }
	        },
	        'popState': function(event){
	            var initialPop = !Path.history.initial.popped && location.href == Path.history.initial.URL;
	            Path.history.initial.popped = true;
	            if(initialPop) return;
	            Path.dispatch(document.location.pathname);
	        },
	        'listen': function(fallback){
	            Path.history.supported = !!(window.history && window.history.pushState);
	            Path.history.fallback  = fallback;

	            if(Path.history.supported){
	                Path.history.initial.popped = ('state' in window.history), Path.history.initial.URL = location.href;
	                window.onpopstate = Path.history.popState;
	            } else {
	                if(Path.history.fallback){
	                    for(route in Path.routes.defined){
	                        if(route.charAt(0) != "#"){
	                          Path.routes.defined["#"+route] = Path.routes.defined[route];
	                          Path.routes.defined["#"+route].path = "#"+route;
	                        }
	                    }
	                    Path.listen();
	                }
	            }
	        }
	    },
	    'match': function (path, parameterize) {
	        var params = {}, route = null, possible_routes, slice, i, j, compare;
	        for (route in Path.routes.defined) {
	            if (route !== null && route !== undefined) {
	                route = Path.routes.defined[route];
	                possible_routes = route.partition();
	                for (j = 0; j < possible_routes.length; j++) {
	                    slice = possible_routes[j];
	                    compare = path;
	                    if (slice.search(/:/) > 0) {
	                        for (i = 0; i < slice.split("/").length; i++) {
	                            if ((i < compare.split("/").length) && (slice.split("/")[i].charAt(0) === ":")) {
	                                params[slice.split('/')[i].replace(/:/, '')] = compare.split("/")[i];
	                                compare = compare.replace(compare.split("/")[i], slice.split("/")[i]);
	                            }
	                        }
	                    }
	                    if (slice === compare) {
	                        if (parameterize) {
	                            route.params = params;
	                        }
	                        return route;
	                    }
	                }
	            }
	        }
	        return null;
	    },
	    'dispatch': function (passed_route) {
	        var previous_route, matched_route;
	        if (Path.routes.current !== passed_route) {
	            Path.routes.previous = Path.routes.current;
	            Path.routes.current = passed_route;
	            matched_route = Path.match(passed_route, true);
	            if (Path.routes.previous) {
	                previous_route = Path.match(Path.routes.previous);
	                if (previous_route !== null && previous_route.do_exit !== null) {
	                    previous_route.do_exit();
	                }
	            }
	            if (matched_route !== null) {
	                matched_route.run();
	                return true;
	            } else {
	                if (Path.routes.rescue !== null) {
	                    Path.routes.rescue();
	                }
	            }
	        }
	    },
	    'listen': function () {
	        var fn = function(){ Path.dispatch(location.hash); }
	        if (location.hash === "") {
	            if (Path.routes.root !== null) {
	                location.hash = Path.routes.root;
	            }
	        }
	        // The 'document.documentMode' checks below ensure that PathJS fires the right events
	        // even in IE "Quirks Mode".
	        if ("onhashchange" in window && (!document.documentMode || document.documentMode >= 8)) {
	            window.onhashchange = fn;
	        } else {
	            setInterval(fn, 100);
	        }
	        if(location.hash !== "") {
	            Path.dispatch(location.hash);
	        }
	    },
	    'core': {
	        'route': function (path) {
	            this.path = path;
	            this.action = null;
	            this.do_enter = [];
	            this.do_exit = null;
	            this.params = {};
	            Path.routes.defined[path] = this;
	        }
	    },
	    'routes': {
	        'current': null,
	        'root': null,
	        'rescue': null,
	        'previous': null,
	        'defined': {}
	    }
	};
	Path.core.route.prototype = {
	    'to': function (fn) {
	        this.action = fn;
	        return this;
	    },
	    'enter': function (fns) {
	        if (fns instanceof Array) {
	            this.do_enter = this.do_enter.concat(fns);
	        } else {
	            this.do_enter.push(fns);
	        }
	        return this;
	    },
	    'exit': function (fn) {
	        this.do_exit = fn;
	        return this;
	    },
	    'partition': function () {
	        var parts = [], options = [], re = /\(([^}]+?)\)/g, text, i;
	        while (text = re.exec(this.path)) {
	            parts.push(text[1]);
	        }
	        options.push(this.path.split("(")[0]);
	        for (i = 0; i < parts.length; i++) {
	            options.push(options[options.length - 1] + parts[i]);
	        }
	        return options;
	    },
	    'run': function () {
	        var halt_execution = false, i, result, previous;

	        if (Path.routes.defined[this.path].hasOwnProperty("do_enter")) {
	            if (Path.routes.defined[this.path].do_enter.length > 0) {
	                for (i = 0; i < Path.routes.defined[this.path].do_enter.length; i++) {
	                    result = Path.routes.defined[this.path].do_enter[i].apply(this, null);
	                    if (result === false) {
	                        halt_execution = true;
	                        break;
	                    }
	                }
	            }
	        }
	        if (!halt_execution) {
	            Path.routes.defined[this.path].action();
	        }
	    }
	};

	/*--------------------------------------------------------*/
	var _ = function(obj) {
	};
	//isFunction
	if (typeof (/./) !== 'function') {
		_.isFunction = function(obj) {
			return typeof obj === 'function';
		};
	}
	//isObject
	_.isObject = function(obj) {
    	return obj === Object(obj);
  	};
  	 //isArray
    _.isArray = function(obj) {
    	if(obj.length !== undefined){
    		return true;
    	}else{
    		return toString.call(obj) == '[object Array]';
    	}
  	};
  	_.isEmptyObject = function(obj) {
    	if (obj == null) return true;
    	for (var key in obj) if (_.has(obj, key)) return false;
    	return true;
  	};
	//trim
	_.trim = function(str){
		if (!str) return '';
		return str.replace(/^\s*|\s*$/g, '');
    };
    _.has = function(obj, key) {
    	return obj != null && Object.prototype.hasOwnProperty.call(obj, key);
  	};
    _.keys = function(obj) {
	    if (!_.isObject(obj)) return [];
	    if (Object.keys) return Object.keys(obj);
	    var keys = [];
	    for (var key in obj) if (_.has(obj, key)) keys.push(key);
	    return keys;
  	};
  	//each
    _.each = function(obj, iterator, context) {
    	if (obj == null) return obj;
	    if (obj.length === +obj.length) {
	      	for (var i = 0, length = obj.length; i < length; i++) {
	        	if (iterator.call(context, i, obj[i], obj)) return;
	      	}
	    } else {
	      	var keys = _.keys(obj);
	      	for (var i = 0, length = keys.length; i < length; i++) {
	        	if (iterator.call(context, keys[i], obj[keys[i]], obj)) return;
	      	}
	    }
    	return obj;
  	};
  	//extend
  	_.extend = function(obj) {
    	if (!_.isObject(obj)) return obj;
	    _.each(Array.prototype.slice.call(arguments, 1), function(i, source) {
	      	for (var prop in source) {
	        	obj[prop] = source[prop];
	      	}
	    });
    	return obj;
  	};
  	_.copy = function(obj){
  		if (!_.isObject(obj)) return obj;
	    _.each(Array.prototype.slice.call(arguments, 1), function(i, source) {
	      	for (var prop in source) {
	        	obj.prototype[prop] = source[prop];
	      	}
	    });
    	return obj;
  	};
  	//clone
  	_.clone = function(obj) {
    	if (!_.isObject(obj)) return obj;
		return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  	};
  	_.param = function(obj) {
  		var temp = [];
  		_.each(obj, function(key, item){
  			temp.push(key+'='+ encodeURIComponent(item));
  		});
  		return temp.join('&');
  	};
  	_.md5 = function(n){
  		var nc = n || 3, i=0;
    	var v = (+new Date()).toString(32);
    	for ( ; i < 5; i++ ) {
            v += Math.floor( Math.random() * 65535 ).toString(32);
        }
    	return v;
	};
	_.uuid = function(){
		return ++_uid;
	};
	_.render = function(template, data, func){
		return template.replace(/\{\{(.*?)\}\}/g, function(s0, s1){
			if(_.isFunction(func)){
				return func(s1, data);
			}else{
				var key, val, filter;
				if(s1.indexOf('|')>0){
		    		var parts = s1.split('|');
		    		key = _.trim(parts[0]),
	    			filter = _.trim(parts[1]);
		    	}else{
		    		key = _.trim(s1);
		    	}
		    	var ks;
		    	if(key.indexOf('.') != -1){
		    		var ks = key.split('.');
		    		var val = data[ks[0]];
		    		_.each(ks, function(i, k){
		    			i>0 && val && (val = val[k]);
		    		});
		    	}else{
		    		val = data[key];
		    	}
				if(filter){
					var mat = filter.match(/\s*in(\{.*?\})/);
					if(mat && mat.length > 1){
						var json =(new Function("", "return "+mat[1]))();
						json && (val = json[val] ? json[val] : '');
					}else{
						if(func.filter && func.filter[filter]){
							val = func.filter[filter](val);
						}else{
							console.error('filter['+ filter +'] not exist');
						}
					}
				}
				return val;
			}
		});
	};
	_.loadCss = function(path) {
        if (path) {
        	var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.href = path;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            head.appendChild(link);
        }
    };
    _.loadJs = function(path, fn) {
    	var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.onreadystatechange = function() {
            if (this.readyState == 'complete') {
                fn && fn();
            }
        }
        script.type = 'text/javascript';
        script.src = url;
        head.appendChild(script);
        return script;
    };
    _.ajax = (function(){
        function send(url, method, params, postData, cb) {
            var xhr = null;
			if (window.XMLHttpRequest){
	  			xhr = new XMLHttpRequest();
	  		} else if (window.ActiveXObject){
		  		xhr = new ActiveXObject("Microsoft.XMLHTTP");
		  	}
		  	if (xhr != null){
		  		var fullUrl = url, urlParam = _.param(params);
		  		if(urlParam){
		  			fullUrl = url + '?' + urlParam;
		  		}
	            xhr.open(method, fullUrl, true);
	            xhr.onreadystatechange = function() {
	                if (xhr.readyState == 4) {
	                	if (xhr.status==200){
		                    var data = xhr.responseText;
		                    cb && cb(data);
		                }
	                }
	            }
	        }
            var body;
            if (postData) {
                var bodies = [];
                for (var name in postData) {
                    bodies.push(name + '=' + encodeURIComponent(postData[name]));
                }
                body = bodies.join('&');
                if (body.length) {
                    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded"); 
                }        
            }
            xhr.send(body);
        }
        return {
	        get: function(url, params, cb) {
	            send(url, 'GET', params, null, cb);
	        },
	        post: function(url, params, postData, cb) {
	            send(url, 'POST', params, postData, cb);
	        }
	    };
    })();
  	/*--------------------------------------------------------*/
  	var DomEvent = {
	    on: function (evtName, element, listener, capture) {
	        var evt         = '',
	            useCapture  = (capture === undefined) ? true : capture,
	            handler     = null;
	        if (window.addEventListener === undefined) {
	            evt = 'on' + evtName;
	            handler = function (evt, listener) {
	                element.attachEvent(evt, listener);
	                return listener;
	            };
	        } else {
	            evt = evtName;
	            handler = function (evt, listener, useCapture) {
	                element.addEventListener(evt, listener, useCapture);
	                return listener;
	            };
	        }
	        return handler.apply(element, [evt, function (ev) {
	            var e   = ev || event,
	                src = e.srcElement || e.target;
	            listener(e, src);
	        }, useCapture]);
	    },
	    off: function (evtName, element, listener, capture) {
	        var evt = '',
	            useCapture  = (capture === undefined) ? true : capture;
	        if (window.removeEventListener === undefined) {
	            evt = 'on' + evtName;
        		// element.detachEvent(evt, listener);
            	element[evt] = null;
	        } else {
	            evt = evtName;
	            element.removeEventListener(evt, listener, useCapture);
	        }
	    },
	    stopPropagation: function (evt) {
	        evt.cancelBubble = true;
	        if (evt.stopPropagation) {
	            evt.stopPropagation();
	        }
	    },
	    preventDefault: function (evt) {
	        if (evt.preventDefault) {
	            evt.preventDefault();
	        } else {
	            evt.returnValue = false;
	        }
	    }
	};
	var Event = {
		on: function(eventType, func){
			if(!this._events){
				this._events = {};
			}
			this._events[eventType] = func;
		},
		off: function(eventType){
			delete this._events[eventType];
		},
		dispatchEvent: function(){
			var args = Array.prototype.slice.call(arguments, 1);
			var eventType = arguments[0];
			if(eventType && this._events){
				var handler = this._events[eventType];
				handler && handler.apply(this, _.isArray(args)? args : [args]);
			}
		}
	};
  	/*--------------------------------------------------------*/
  	var koala = {
		module: function(name){
			return new Mvc(name);
		}
	};
	koala._ = _ ;
	koala.ui = {} ;
	window.koala = koala;

})(window);