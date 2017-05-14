// Default export is easy to import
import cat from "./export";

// Named export has to be included in braces it seems
import {Dog} from "./export"; // I can click on {Dog} and Netbeans takes me to Dog class in export

// Netbeans autocompletes meow and shows argument names. Netbeans also hotlinks to method through ctrl+click
cat.meow("burp", "three");

let dog = new Dog("moo"); // Netbeans does not show the arguments accepted by Dog constructor

//Netbeans autocompletes a Class method as well, and shows the argument names. Netbeans also hotlinks to method through ctrl+click


