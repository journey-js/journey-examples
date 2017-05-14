define(function (require) {

	var $ = require("jquery");

	function disableDragging() {
		// Disable dragging of images onto body
		$(document).bind({
			dragenter: function (e) {
				e.stopPropagation();
				e.preventDefault();
				var dt = e.originalEvent.dataTransfer;
				dt.effectAllowed = dt.dropEffect = 'none';
			},
			dragover: function (e) {
				e.stopPropagation();
				e.preventDefault();
				var dt = e.originalEvent.dataTransfer;
				dt.effectAllowed = dt.dropEffect = 'none';
			}
		});
	}
	return disableDragging();
});