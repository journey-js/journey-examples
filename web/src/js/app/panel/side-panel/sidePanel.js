define(function (require) {
	var $ = require("jquery");
	var prism = require("prism");
	var template = require("rvc!./side-panel");
	var kudu = require("kudu");
	var panel;

	function sidePanel(options) {
		$("body").off("click", handleBodyClick);
		$("body").on("click", handleBodyClick);

		options.close = function () {
			if ($(this.event.original.target).is('.cd-panel') || $(this.event.original.target).is('.cd-panel-close')) {
				this.set("visible", false);
			}
			return false;
		};

		panel = new template(options);

		// Public 
		panel.show = function (options) {
			options = options || {};
			var path = options.path || getUrlPath();
			var ext = options.ext || "";
			panel.set("visible", true);

			panel.set("code", path + "." + ext);
			panel.set("title", path + "." + ext);
			prism.fileHighlight();
			prism.highlightElement($('.cd-panel-content')[0]);
		};

		return panel;
	}

	function getUrlPath() {
		var route = kudu.getActiveRoute();
		var id = kudu.getId(route.ctrl);
		return "js/" + id;
	}

// Private 
	function handleBodyClick(e) {
		if (panel.get("visible") === true) {

			if ($(e.target).is('a')) {
				panel.set("visible", false);

				$(".cd-panel").css("transitionProperty", "none");
				setTimeout(function () {
					$(".cd-panel").css("transitionProperty", "all");
				});
			}
		}
	}

	return sidePanel;
});
