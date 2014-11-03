(function(window, $){
	
	var _moduleBus = {}, //模块缓存
		_controllerBus = {}, //控制器缓存
		_runStack = [],  //运行栈,只放controller
		_parseTree = {}, //解析树
		_parseBus = {},  //记录解析过的scope
		_config = null,  //全局配置
		_uid = 1,   //uuid
		_currentController = null; //当前的控制器

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
			state: STATE.INIT,
			dependences: dependences,
			fn: newFunction(func)
		};
		checkDependence(className);
	};

	Mvc.prototype.config = function(opts){
		_config = opts;
		var router = opts.router;
		if(router.root){
			var rootController = _moduleBus[router.root.controller];
			if(rootController){
				runController(rootController,  document.body);
			}else{
				_runStack.push({
					controller: router.root.controller,
					dom: document.body
				});
			}
		}
		if(opts.plugins){
			//DIRECTIVE.plugins
		}
	};

	Mvc.prototype.redirect = function(route){
		var rt = _config.router[route];
		if(rt && rt.template){
			$.get(rt.template, 'text')
			.done(function(response){
				if(_config.view){
					var view = document.getElementById(_config.view);
					view.innerHTML = response;
					//调用controller的析构函数
					if(_currentController){
						var ctrl = _controllerBus[_currentController];
						if(ctrl && ctrl.scope){
							ctrl.scope.finalize && ctrl.scope.finalize();
						}
					}
					//执行controller
					runController(_moduleBus[rt.controller], view);
				}
			});
		}
	};

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
		s.filter = scope.filter;
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
			runController(_moduleBus[run.controller], run.dom);
		}
	}

	function runController(controller, dom){
		if(controller && controller.state == STATE.LOADED){
			if(controller.dependences){
				var args = [];
				_.each(controller.dependences, function(idx, item){
					args.push(_moduleBus[item].fn);
				});
			}
			if(!_controllerBus[controller.name]){
				var id = _.md5()+'_'+_.uuid();
				var scope = new Scope(id, dom, controller.name);
				_controllerBus[controller.name] = {
					scope: scope
				};
			}
			var scope = _controllerBus[controller.name].scope;
			controller.fn.apply(scope, args);
			_currentController = controller.name;
			delete _parseBus[scope._id];
			scope.apply();
		}else{
			_runStack.push(controller.name);
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
    	Event.off(eventType, node);
    	var hdr = parseEventhandler(handler);
    	if(hdr){
	    	Event.on(eventType, node, function(e){
	    		e.data = hdr.args;
	    		var func = scope[hdr.func];
    			func && func.apply(node, [e]);
	    	});
    	}
    }
    function addToParseTree(attr, bindString, template, times, node, scope){
    	var id = node.getAttribute('id');
    	if(!id){
    		id = 'x_'+_.md5(4)+'_'+_.uuid();
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
    			filter = _.trim(parts[1]).replace(/['"]/g, '');
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
  	//clone
  	_.clone = function(obj) {
    	if (!_.isObject(obj)) return obj;
		return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  	};
  	_.md5 = function(n){
  		var nc = n || 6;
    	var v = '', s= '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    	while(v.length<nc){
    		v += s.splice(Math.random()*(s.length-1), 1);
    	}
    	return v;
	};
	_.uuid = function(){
		return ++_uid;
	};
	_.render = function(template, data, func){
		return template.replace(/\{\{(.*?)\}\}/g, function(s0, s1){
			return func ? func(s1, data) : data[s1];
		});
	};
  	/*--------------------------------------------------------*/
  	var Event = {
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
	            if(listener){
	            	element.detachEvent(evt, listener);
	            }else{
	            	element.detachEvent(evt);
	            }
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
  	/*--------------------------------------------------------*/
  	var think = {
		module: function(name){
			return new Mvc(name);
		}
	};

    var _module = _module;
	if(_module){
		
	}else{
		think._ = _ ;
		window.think = think;
	}

})(window, jQuery);