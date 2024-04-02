





// local modules
import * as log from "./log.js";
import * as db from "./db.js";

// initializing constants
const __file__ = import.meta.url.slice( import.meta.url.lastIndexOf("/") + 1 );






export async function init() {

    log.log("Initiating web client", __file__)

    // enable scrolling (in case it would have been disabled previously)
    window.onscroll = null;

    // read browser address line
    const addressline = window.location.href;

    // split querystring fromt addressline
    const [addressline_without_query, querystring] = addressline.split("?");
    // spilt protocol from adressline
    const [protocol, domain_with_path] = addressline_without_query.split("://");
    // split domain and path
    const domain = domain_with_path.slice(0, domain_with_path.indexOf("/"));

    // save api_endpoint and client_base_url to session storage
    sessionStorage.setItem("api_endpoint", protocol + "://" + domain + "/api");
    sessionStorage.setItem("client_base_url", protocol + "://" + domain + "/frontend");

    // save all query params to session storage
    const queryparams = GetQueryParamsFromQuerystring(querystring);
    for ( let key in queryparams) {
        sessionStorage.setItem("qp_" + key, queryparams[key]);
    }

    // // wait until ddui theme is set
    // let active_theme;
    // await new Promise( async r => {
    //     while ( active_theme == null ) {
    //         await new Promise(res => setTimeout(res, 300));
    //         active_theme = getComputedStyle(document.body).getPropertyValue('--ddui_theme');
    //     }
    //     r();
    // } );

    // console.log("B");
    
    // // show the theme icon according to the active theme
    // const app_theme_icon = document.getElementById("app_theme_icon");
    // switch ( active_theme ) {
    //     case "light":
    //     case "system_light":
    //         app_theme_icon.innerHTML = "light_mode";
    //         break;
    //     case "dark":
    //     case "system_dark":
    //         app_theme_icon.innerHTML = "dark_mode";
    //         break;
    // }

    db.Init();

}


  



// read query params to dict "queryparams"
function GetQueryParamsFromQuerystring(querystring) {

    log.log("Parsing query params from uri", __file__)

    let queryparams = {};

    if ( ! ( querystring == undefined || querystring == "" ) ) {

        const querystring_elements = querystring.split("&");
        let key;
        let value;
        for ( let paramstring of querystring_elements ) {
            [ key, value ] = paramstring.split("=");
            queryparams[key] = value;
        }

    }

    return queryparams;

}