define(function (require) {
    var $ = require("jquery");
    var ractive = require("ractive");
    var kudu = require("kudu");
    var template = require("rvc!./multiple-comp");

    function multipleComp() {

        var that = {};

        that.onInit = function (options) {

            var view = createView();
            return view;
        };

        function createView(data) {
            
            var compA = ractive.extend({
                template: '<div class="comp">I am component A</div>'
            });
            
            var compB = ractive.extend({
                template: '<div class="comp compB">I am component B</div>'
            });

            var view = new template({

                components: {
                    compA: compA,
                    compB: compB
                },
                
                data: {
                    componentName: 'A'
                }
            });

            return view;
        }

        return that;
    }
    return multipleComp;
});
