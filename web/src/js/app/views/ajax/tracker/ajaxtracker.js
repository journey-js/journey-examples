define(function (require) {
	var $ = require("jquery");
	var kudu = require("kudu");
	var prism = require("prism");
	var template = require("rvc!./ajaxtracker");
	function ajaxTracker() {

		var that = {};
		that.onInit = function (options) {
			var view = createView(options.ajaxTracker);
			return view;
		};
		function createView(ajaxTracker) {

			var view = new template();


			// Add a load method for the template to invoke
			view.load = function () {
				this.set("response", "");
				fetchData(ajaxTracker, view);
			};

			view.abort = function () {
				ajaxTracker.abort();
			};
			return view;
		}

		function fetchData(ajaxTracker, view) {
			// We start the Ajax request
			var xhr = createXhr("data/hello.json?delay=2000");

			// We add the xhr to the AjaxTracker
			ajaxTracker.add(xhr);

			xhr.onload = function (arg) {
				if (xhr.status >= 200 && xhr.status < 400) {
					// Success!
					var json = xhr.responseText;

					// Set the json to render
					view.set("response", json);
				} else {
					view.set("response", "Sorry, an error occurred!");
				}
			};

			xhr.send();
		}

		function createXhr(url) {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);

			return xhr;
		}

		return that;
	}
	return ajaxTracker;
});
