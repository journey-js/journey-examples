define(function (require) {
	var template = require("rvc!./basic-partial");
        var helloPartial = require("rv!./partial");

	function basicPartial() {

		var that = {};

		that.onInit = function (options) {
			var view = createView();
			return view;
		};

		function createView() {

			var view = new template({
				
				partials: {hello: helloPartial}
			});
			return view;
		}

		return that;
	}
	return basicPartial;
});
