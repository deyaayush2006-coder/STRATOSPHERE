export const INTRO_KEY = "stratosphere-intro";

export const INTRO_SEEN_SCRIPT = `try{if(sessionStorage.getItem("${INTRO_KEY}"))document.documentElement.setAttribute("data-intro-seen","")}catch(e){}`;
