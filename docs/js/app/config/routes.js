import journey from "lib/journey/journey.js";	
import home from "../views/home/home.js";
import basic from "../views/basics/controller/basic.js";
import methods from "../views/basics/methods/methods.js";
import binding from "../views/basics/binding/binding.js";
import nav from "../views/nav/nav.js";
import navTarget from "../views/nav/navTarget.js";
import navTargetWithParams from "../views/nav/navTargetParams.js";
import notFound from "../views/notfound/notFound.js";
import redirect from "../views/nav/redirect/redirect.js";
import redirectTarget from "../views/nav/redirect/redirectTarget.js";
import basicForm from "../views/forms/basic/basicForm.js";
import validatingForm from "../views/forms/validate/validatingForm.js";
import events from "../views/lifecycle/events/events.js";
import basicAjax from "../views/ajax/basic/basicAjax.js";
import upload from "../views/ajax/upload/upload.js";
import basicPartial from "../views/partial/basic/basicPartial.js";
import basicComp from "../views/comp/basic/basicComp.js";
import multipleComp from "../views/comp/multiple/multipleComp.js";
import pubSubComp from "../views/comp/pubsub/compPubSub.js";
import basicTransition from "../views/transition/basic/basicTransition.js";
import sortable from "../views/decorator/sortable.js";

journey.add("/home", home);
journey.add("/basic", basic);
journey.add("/methods", methods);
journey.add("/binding", binding);
journey.add("/navTargetParams/:id", navTargetWithParams);	
journey.add("/navTarget", navTarget);
journey.add("/redirect", redirect);
journey.add("/redirectTarget", redirectTarget);
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
journey.add("/multipleComp", multipleComp);
journey.add("/pubSubComp", pubSubComp);
journey.add("/pubSubComp", pubSubComp);
journey.add("/basicTransition", basicTransition);
journey.add("/sortable", sortable);
