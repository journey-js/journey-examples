define(function (require) {
	var kudu = require("kudu");
	var template = require("rvc!./global-events");
	var stringUtils = require("app/utils/stringUtils");

	function globalEvents() {

		var that = {};

		that.onInit = function (options) {
			var view = createView();
			return view;
		};

		return that;
	}

	function createView() {

		var view = new template({
			addListeners: function () {
				addGlobalEventListeners();

			},
			reloadView: function () {
				kudu.go({ctrl: globalEvents});

			},
			removeListeners: function () {
				removeGlobalEventListeners();
			}
		});
		return view;
	}

	function addGlobalEventListeners() {
		// Since this is global event listeners, we guard against adding the listeners more than once, so first we remove the listeners
		//  in case they have already been added
		removeGlobalEventListeners();

		kudu.on("lc.beforeInit", beforeInit);
		kudu.on("lc.init", init);
		kudu.on("lc.render", render);
		kudu.on("lc.complete", complete);
		kudu.on("lc.remove", remove);
		kudu.on("lc.beforeUnrender", beforeUnrender);
		kudu.on("lc.unrender", unrender);
		kudu.on("lc.fail", fail);
	}

	function removeGlobalEventListeners() {
		kudu.off("lc.remove", remove);
		kudu.off("lc.beforeInit", beforeInit);
		kudu.off("lc.init", init);
		kudu.off("lc.render", render);
		kudu.off("lc.complete", complete);
		kudu.off("lc.remove", remove);
		kudu.off("lc.beforeUnrender", beforeUnrender);
		kudu.off("lc.unrender", unrender);
		kudu.off("lc.fail", fail);
	}
	
	function remove(options) {
		prettyLog("remove", options, options.ctrl);
	}

	function beforeUnrender(options) {
		prettyLog("beforeUnrender", options, options.ctrl);
	}

	function beforeInit(options) {
		prettyLog("beforeInit", options, options.ctrl);
	}

	function init(options) {
		prettyLog("init", options, options.ctrl);
	}

	function unrender(options) {
		prettyLog("unrender", options, options.ctrl);
	}

	function render(options) {
		prettyLog("render", options,options.ctrl );
	}

	function complete(options) {
		prettyLog("complete", options, options.ctrl);
	}

	function fail(options) {
		prettyLog("fail", options, options.ctrl);
	}
	
	function prettyLog(event, options, ctrl) {
		console.log("Global event triggered [" + event + ": %c" + getPrettyCtrlName(ctrl) + "]", "color:red", options);
	}

	function getPrettyCtrlName(ctrl) {
		var id = kudu.getId(ctrl);
		var namePath = id.split("/").pop();
		var name = stringUtils.dashToCamel(namePath);
		name = stringUtils.capitalize(name);
		return name;
	}

	return globalEvents;
});
