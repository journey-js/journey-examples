define(function (require) {
	var $ = require("jquery");
	var template = require("rvc!./basic-form");

	function basicForm() {

		var that = {};

		that.onInit = function (options) {
			var view = createView();
			return view;
		};

		function createView() {

			var view = new template({
				data: {
					check: true
				},
				
				submit: function () {
					$('.bs-callout-info').removeClass('hidden');
					return false;
				},
				
				reset: function () {
					$('.bs-callout-info').addClass('hidden');
				}
			});
			return view;
		}

		return that;
	}
	return basicForm;
});
