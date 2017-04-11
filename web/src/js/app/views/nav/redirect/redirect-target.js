define(function (require) {
	var $ = require("jquery");
	var kudu = require("kudu");
	var template = require("rvc!./redirect-target");

	function redirectTarget() {

		var that = {};

		that.onInit = function (options) {
			return createView();
		};

		function createView() {
			var view = new template();

			return view;
		}

		return that;
	}
	return redirectTarget;
});
