import journey from "lib/journey/journey.js";	
import home from "../views/home/home.js";
import basic from "../views/basics/route/basic.js";
import methods from "../views/basics/methods/methods.js";
import binding from "../views/basics/binding/binding.js";
import nav from "../views/nav/nav.js";
import person from "../views/nav/person.js";
import product from "../views/nav/product.js";
import notFound from "../views/notfound/notFound.js";
import redirect from "../views/nav/redirect/redirect.js";
import invalid from "../views/nav/redirect/invalid.js";
import basicForm from "../views/forms/basic/basicForm.js";
import validatingForm from "../views/forms/validate/validatingForm.js";
import events from "../views/lifecycle/events/events.js";
import basicAjax from "../views/ajax/basic/basicAjax.js";
import upload from "../views/ajax/upload/upload.js";
import basicPartial from "../views/partial/basic/basicPartial.js";
import basicComp from "../views/comp/basic/basicComp.js";
import dynamicComp from "../views/comp/dynamic/dynamicComp.js";
import parent from "../views/comp/dataflow/parent.js";
import basicTransition from "../views/transition/basic/basicTransition.js";
import sortable from "../views/decorator/sortable.js";

journey.add("/home", home);
journey.add("/basic", basic);
journey.add("/methods", methods);
journey.add("/binding", binding);
journey.add("/product/:id", product);	
journey.add("/person", person);
journey.add("/redirect", redirect);
journey.add("/invalid", invalid);
journey.add("/nav", nav);
journey.add("/", home);
journey.add("/notFound", notFound);
journey.add("/basicForm", basicForm);
journey.add("/validatingForm", validatingForm);
journey.add("/events", events);
journey.add("/basicAjax", basicAjax);
journey.add("/upload", upload);
journey.add("/basicPartial", basicPartial);
journey.add("/basicComp", basicComp);
journey.add("/dynamicComp", dynamicComp);
journey.add("/parent", parent);
journey.add("/basicTransition", basicTransition);
journey.add("/sortable", sortable);
