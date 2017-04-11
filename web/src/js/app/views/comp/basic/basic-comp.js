define(function (require) {
    var $ = require("jquery");
    var ractive = require("ractive");
    var kudu = require("kudu");
    var template = require("rvc!./basic-comp");

    function basicComp() {

        var that = {};

        that.onInit = function (options) {

            var view = createView();
            return view;
        };

        function createView(data) {
            
            var component = ractive.extend({
                template: '<div on-click="activate()" class="comp">{{message}}</div>',
                activate: function () {
                    alert("Active!");
                },
                data: {
                    message: 'No message specified, using the default'
                }
            });

            var view = new template({
                // We register our component as "simple"
                components: {
                    simple: component
                }
            });

            return view;
        }

        return that;
    }
    return basicComp;
});
