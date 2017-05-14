// Default export is easy to import
import cat from "./export";

// Named export has to be included in braces it seems
import {Dog} from "./export"; // I can click on {Dog} and Netbeans takes me to Dog class in export

// Netbeans autocompletes meow
cat.meow("burp");

let dog = new Dog("moo"); //

//Betbeans autocompletes a Class method as well. Not constructor though
dog.bark("gimme food");

