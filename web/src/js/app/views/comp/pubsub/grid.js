define(function (require) {
    var $ = require("jquery");
    var ractive = require("ractive");
    var template = require("rvc!./grid");
    function grid() {

        var data = {
            rows: [
                {name: "Bob", age: 20, id: 11},
                {name: "Steve", age: 30, id: 12},
                {name: "James", age: 40, id: 13},
                {name: "Henry", age: 50, id: 14}
            ]
        };
        var component = template.extend({
            onrender: function () {

                // public.remove and public.add are public events that subscribers can listen to,
                // even the grid component itself
                
                // Here we subscribe to the remove event
                this.on("public.remove", function (id, index) {
                    var row = data.rows[index];
                    // The component can listen on the public remove event
                    console.log("[component] on('public.remove') invoked with arguments:", row);
                    this.splice("rows", index, 1);
                });
            },
            
            // Unlike subscribing to the remove event, we declare an 'add' method
            // for the template to call and then 'fire' the public.add event
            add: function (row) {
                console.log("[component] add(row) method invoked wih arguments:", row);
                this.push("rows", row);
                console.log("[component] firing 'public.add' event for subscribers, with arguments:", row);
                // Fire event for listeners to act upon
                this.fire("public.add", row);
            },
            data: function () {
                return data;
            }
        });
        return component;
    }
    return grid();
});
