// Object
var cat = {
	
	name: "Filix",
	
	meow: someArg => {
		console.log("Object Cat says: " + someArg);
	}
}

// default export
export default cat;
	
	
class Dog {	
		
	constructor (name) {
		console.log("constructor ", name);
	}
	
	bark = someArg => {
		console.log("Class Dog says: " + someArg)
	}
}
// Can only have one default, so here we have to name the export
export {Dog};