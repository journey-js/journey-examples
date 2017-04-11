define(function (require) {
	var kudu = require("kudu");
	var template = require("rvc!./go-events");
	var stringUtils = require("app/utils/stringUtils");
	
	function goEvents() {

		var that = {};
		that.onInit = function (options) {
			var view = createView();
			return view;
		};
		return that;
	}

	function createView() {

		var view = new template({
			reloadView: function () {

				kudu.go({ctrl: goEvents,
					
					remove: function (options) {
						prettyLog("remove", options, options.ctrl);
					},
					
					beforeUnrender: function (options) {
						prettyLog("beforeUnrender", options, options.ctrl);
					},
					
					
					beforeInit: function (options) {
						prettyLog("beforeInit", options, options.ctrl);
					},
					
					init: function (options) {
						prettyLog("init", options, options.ctrl);
					},
					
					unrender: function (options) {
						prettyLog("unrender", options, options.ctrl);
					},
					
					render: function (options) {
						prettyLog("render", options,options.ctrl );
					},
					
					complete: function (options) {
						prettyLog("complete", options, options.ctrl);
					},

					fail: function (options) {
						prettyLog("fail", options, options.ctrl);
					}

				});
			}
		});
		return view;
	}
	
		
	function prettyLog(event, options, ctrl) {
		console.log("Kudu.go event triggered [" + event + ": %c" + getPrettyCtrlName(ctrl) + "]", "color:red", options);
	}

	function getPrettyCtrlName(ctrl) {
		var id = kudu.getId(ctrl);
		var namePath = id.split("/").pop();
		var name = stringUtils.dashToCamel(namePath);
		name = stringUtils.capitalize(name);
		return name;
	}

	return goEvents;
});
