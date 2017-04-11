define(function (require) {
        var kudu = require("kudu");
	var template = require("rvc!./ctrl-events");

	function globalEvents() {

		var that = {};

		that.onInit = function (options) {
			console.log("onInit called. [options]:", options);
			var view = createView();
			return view;
		};
		
		that.onRender = function (options) {
			console.log("onRender called. [options]:", options);
		};
		
		that.onComplete = function (options) {
			console.log("onComplete called. [options]:", options);
		};
		
		that.onUnrender = function (options) {
			console.log("onUnrender called. [options]:", options);
		};
		
		that.onRemove = function (options) {
			console.log("onRemove called. [options]:", options);
		};

		return that;
	}

	function createView() {

		var view = new template({

			reloadView: function () {
				kudu.go({ctrl: globalEvents});

			}	
		});
		return view;
	}

	return globalEvents;
});
