





// local modules
import * as log from "./log.js";

// initializing constants
const __file__ = import.meta.url.slice( import.meta.url.lastIndexOf("/") + 1 );

// initializing db variable (for accessing the apps db in the indexed db)
let db;






export function Init() {

    // delete db on reload
    const db_delete_req = indexedDB.deleteDatabase("db");
    db_delete_req.onerror = () => { log.log("Deletion of database 'db' failed: " + db_delete_req.error, __file__, "ERR") }

    // create and access db
    const db_req = indexedDB.open("db", 1);

    db_req.onblocked = () => {
        log.log("Multiple tabs are open", __file__, "WRN");
        new ddui.MessageBox("Please only use devcon in 1 Tab.", "warning", [], false);
    }

    // initiate db (create tables, ...)
    db_req.onupgradeneeded = () => {
        const db = db_req.result;
        db.createObjectStore("tasks", {keyPath: "id"});
        log.log("Initiated database successfully.", __file__)
    }

    // save connection to db in the "db" handle
    db_req.onsuccess = () => {
        db = db_req.result;
    }

    // handle error
    db_req.onerror = () => {
        log.log("Creating or accessing the indexedDB failed: " + db_req.error, __file__, "ERR");
        new ddui.MessageBox("Creating or accessing the indexedDB failed:<br><br><strong>" + db_req.error + "</strong><br>Try a complete page refresh (Ctrl + F5).", "error");
    }

}






export async function Read(table, key) {
        
    const pReadObjectFromTable = new Promise( (resolve, reject) => {
        const transaction = db.transaction(table, "readonly");
        const db_table = transaction.objectStore(table);
        const db_get_request = db_table.get(key);
        db_get_request.onsuccess = () => resolve( db_get_request.result );
        db_get_request.onerror = () => reject( db_get_request.error );
    } )

    try {
        return await pReadObjectFromTable;

    } catch (error) {
        console.error(error);
        return error;

    }

}






export async function Add(table, object) {

    const pAddObjectToTable = new Promise( (resolve, reject) => {
        const transaction = db.transaction(table, "readwrite");
        const db_table = transaction.objectStore(table);
        const db_add_request = db_table.add(object);
        db_add_request.onsuccess = () => resolve( db_add_request.result );
        db_add_request.onerror = () => reject( db_add_request.error );
    } )

    try {

        if ( ! (db) ) {
            log.log("Multiple tabs are open", __file__, "WRN");
            new ddui.MessageBox(
                "Please only use devcon in 1 Tab.", "warning",
                [
                    {
                        label: "Reload page",
                        onClick: () => window.location.reload()
                    }
                ],
                false);
        }

        return await pAddObjectToTable;

    } catch (error) {
        console.error(error);
        return error;

    }

}






export async function Update(table, object) {

    const pUpdateObjectInTable = new Promise( (resolve, reject) => {
        const transaction = db.transaction(table, "readwrite");
        const db_table = transaction.objectStore(table);
        const db_put_request = db_table.put(object);
        db_put_request.onsuccess = () => resolve( db_put_request.result );
        db_put_request.onerror = () => reject( db_put_request.error );
    } )

    try {
        return await pUpdateObjectInTable;

    } catch (error) {
        console.error(error);
        return error;

    }

}






export async function Delete(table, key) {
        
    const pDeleteObjectFromTable = new Promise( (resolve, reject) => {
        try {

            const transaction = db.transaction(table, "readwrite");
            const db_table = transaction.objectStore(table);
            const db_delete_request = db_table.delete(key);
            db_delete_request.onsuccess = () => resolve( db_delete_request.result );
            db_delete_request.onerror = () => reject( db_delete_request.error );
        } catch(err) {
            throw new Error("Deletion in indexed db failed: " + err);
        }
        // const transaction = db.transaction(table, "readonly");
        // const db_table = transaction.objectStore(table);
        // const db_get_request = db_table.get(key);
        // db_get_request.onsuccess = () => resolve( db_get_request.result );
        // db_get_request.onerror = () => reject( db_get_request.error );
    } )

    try {
        return await pDeleteObjectFromTable;

    } catch (error) {
        console.error(error);
        return error;

    }

}