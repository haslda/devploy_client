





// local modules
import * as api from "./api.js";






export async function log(message, source = "unknown", level = "INF", tag = "CLI") {

    const log_data = {
        message: message,
        source: source,
        level: level,
        tag: tag
    };

    try {
        // only errors shall be logged to the server
        if ( level === 'ERR' ) {
            await api.SendCall("POST", "/Log", "", JSON.stringify(log_data));
        }
    }

    catch {}

    finally {
        if ( level === 'ERR' ) {  console.error(new Error("LOG: " + log_data.message)) }
        else { console.log("LOG: " + log_data.message) };
    }

}