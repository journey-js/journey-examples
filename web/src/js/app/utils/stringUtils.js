define(function (require) {

var $ = require("jquery");
		var stringUtils = {

		capitalize: function(str) { 
			return str.charAt(0).toUpperCase() + str.slice(1); 
		},

		camelToDash: function (str) {
		return str.replace(/\W+/g, '-')
				.replace(/([a-z\d])([A-Z])/g, '$1-$2');
		},
				dashToCamel: function (str) {
				return str.replace(/\W+(.)/g, function (x, chr) {
				return chr.toUpperCase();
				});
				}
		}

return stringUtils;
		});

