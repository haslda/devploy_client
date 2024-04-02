





// local modules
import * as log from "./log.js";

// initializing constants
const __file__ = import.meta.url.slice( import.meta.url.lastIndexOf("/") + 1 );






export async function SendCall(command, path, queryparams, body) {

    // if command is GET (doesn't allow a body) or body is null then set body to empty ("")
    if ( command == "GET" || body == null ) { body = "" };

    if ( queryparams == null ) { queryparams = "" };

    // log the api call (but not for posting logs to the server)
    if ( ! ( command == "POST" && path == "/Log" ) ) {
        log.log(`Sending API call: ${command} ${path}${ ( queryparams.length > 0 ? "?" + queryparams : "" ) } ${ ( body == "" ) ? "(no body)" : `(body length: ${body.length})` }`, __file__);
    }

    const req = {};
    req["method"] = command;
    req["headers"] = {
        "Content-type": "application/json; charset=UTF-8"
    }

    if ( ! body == "" ) {
        req["body"] = body;
    }  

    // send call to api and retrieve response
    const res = await fetch(sessionStorage.getItem("api_endpoint") + path, req);

    // read response body
    let res_body = await res.text();
    let res_json;

    // parse response to a json object
    try {
        res_json = JSON.parse(res_body);
    } catch (err) {

        // if it fails construct an error response json
        res_json = {
            error: {
                code: "-",
                message: `Response body for "${command + " " + path}" is not a valid JSON:\n\n` + String(EncodeHtml(res_body))
            }
        };

    }

    // return structured response body
    return [ res.status, res_json ];

}






function EncodeHtml(string) {
    return string.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&#34;')
        .replace(/\//, '&#x2F;');
  }