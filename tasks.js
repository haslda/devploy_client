





// Glossary
//
// tasklist   ... ddui list (ui)
// task       ... array (task object), e.g.: { id: "some_id", name: "my task", target: "local", "commands": "cls" }
// task_node  ... node object of a tasklist's item






// node modules
import * as ddui from "./node_modules/@haslda/ddui/ddui.js";

// local modules
import * as api from "./api.js";
import * as log from "./log.js";
import * as db from "./db.js";

// errors
class CustomError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
class ApiError extends CustomError {}

// initializing constants
const __file__ = import.meta.url.slice( import.meta.url.lastIndexOf("/") + 1 );
const tasklist = new ddui.List("tasklist");






// Appends a task to the tasklist (ui only)
function AppendTaskToTasklist(task) {

    const newtask = document.createElement("div");
    newtask.classList.add("task");
    newtask.id = "task_" + task.id;
    newtask.setAttribute("name", "task");
    newtask.innerHTML = `
        <div class="task_area task_area_left">
            <div class="task_checkbox">
                <input id="checkbox_${task.id}" class="checkbox" type="checkbox"/>
            </div>
        </div>
        <div class="task_area task_area_center">
            <div class="task_name">
                <div id="task_name_${task.id}">${task.name}</div>
            </div>
        </div>
        <div class="task_area task_area_right">
            <div class="task_button" id="button_task_menu_${task.id}">
                <div style="padding-top:2px;"><span class="material-icons">more_horiz</span></div>
            </div>
        </div>`;
    const list_item_id = tasklist.AppendItem(newtask);
    newtask.addEventListener("click", () => ToggleTaskClick(task.id));

    // Cares for (de)selecting tasks
    const button_task_menu = document.getElementById(`button_task_menu_${task.id}`);
    button_task_menu.addEventListener("click", event => ShowTaskMenu(event, task.id))

    // When the checkbox is clicked, it would get changed twice: 1x due to default behaviour and 1x due to the actual handler (see above)
    // For that reason, the checkbox in this case shall be flipped once more. So it's actually three flips in that case ;-)
    const checkbox = document.getElementById(`checkbox_${task.id}`);
    checkbox.addEventListener("click", () => checkbox.checked = !checkbox.checked);

    return list_item_id;

}






// Appends a new task to server, db and ui
export async function AppendNewTask(task) {

    await CreateTaskOnServer(task);
    task["list_item_id"] = AppendTaskToTasklist(task);
    await db.Add("tasks", task);

}






// Appends a new task on server, in db and ui
async function UpdateTask(task) {

    await UpdateTaskOnServer(task);
    await db.Update("tasks", task);

    // Update task in tasklist (ui)
    document.getElementById(`task_name_${task.id}`).innerHTML = task["name"];

}






async function DeleteTask(task_id) {

    async function DeleteTaskFromServer(task_id) {
        log.log(`Deleting task "${task_id}" from server.`, __file__);

        let res_httpcode;
        let res_body; 
        [ res_httpcode, res_body ] = await api.SendCall("DELETE", "/Tasks/" + task_id, "", "");
    
        switch ( res_httpcode ) {
            case 200:
                return true;
            default:
                throw new Error (`Error occured with DELETE /Tasks.\nHTTP status code: ${res_httpcode}\nResponse body:\n${res_body}`)
        }
    }






    new ddui.MessageBox(
        "Task wirklich löschen?",
        null,
        [
            {
                label: "Cancel",
                style: "inferior",
                closeOnClick: true
            },
            {
                label: "Delete",
                style: "red",
                onClick: async () => {

                    try {
                        await DeleteTaskFromServer(task_id);
                        const task = await db.Read("tasks", task_id);
                        tasklist.DeleteItem(task["list_item_id"]);
                        await db.Delete("tasks", task_id);
                    }
                    catch (err) {
                        console.error(err);
                        ddui.DisplayError(err);
                    }

                },
                closeOnClick: true
            }            
        ]
    )

}






// Fetch all tasks from server, store them in the db an append them to the tasklist (ui)
export async function RefreshTaskList() {

    try {

        tasklist.ShowLoadingSpinner();

        // Retrieve all tasks
        const tasks = await GetTasksFromServer();

        // Add all tasks to the tasklist (ui) and to the db table "tasks"
        for ( let task of tasks ) {
            task["list_item_id"] = AppendTaskToTasklist(task);
            await db.Add("tasks", task);
        }

        tasklist.DiscardLoadingSpinner();

    }

    catch (err) {
        ddui.DisplayError(`An error occured while trying to refresh the tasklist.\n\n${err.message}`);
    }

}






async function ShowTaskMenu(event, task_id) {

    const anchor_node = document.getElementById(`button_task_menu_${task_id}`);
    new ddui.Popup(
        [
            {
                type: "button",
                label: "Edit task ...",
                icon: "edit",
                onClick: () => { OpenTaskDialogue(false, task_id) }
            },
            {
                type: "button",
                label: "Delete task",
                icon: "delete",
                style: "red",
                onClick: () => { DeleteTask(task_id) }
            }
        ],
        "positioned",
        anchor_node
    );

    // Prevent triggering ToggleTaskClick()
    event.stopPropagation();

}






// Eventhandler for clicking a task
function ToggleTaskClick(id) {
    const checkbox = document.getElementById(`checkbox_${id}`);
    const banner = document.getElementById("task_" + id);
    if ( checkbox.checked ) {
        checkbox.checked = false;
        banner.classList.remove("task_selected");
        document.getElementById("taskcount").innerText = Number(document.getElementById("taskcount").innerText) - 1;
    } else {
        checkbox.checked = true;
        banner.classList.add("task_selected");
        document.getElementById("taskcount").innerText = Number(document.getElementById("taskcount").innerText) + 1;
    }
}






export async function OpenTaskDialogue(create_new_task, task_id) {

    let dialogue_title;
    let button_ok_label;

    switch (create_new_task) {
        case false:
            dialogue_title = "Edit task";
            button_ok_label = "Save";
            break;
        default:
            dialogue_title = "Create new task";
            button_ok_label = "Create";
    }

    let values = [];

    // if a task is opened, read the values from the tasks table (db)
    if (task_id) {
        const task = await db.Read("tasks", task_id);
        values = [
            {
                "node_id": "task_dialogue_task_id",
                "value": task["id"]
            },
            {
                "node_id": "task_dialogue_task_name",
                "value": task["name"]
            },
            {
                "node_id": "task_dialogue_task_target",
                "value": task["target"]
            },
            {
                "node_id": "task_dialogue_task_commands",
                "value": task["commands"]
            }
        ]
    
    // if a new task is created, set the default values
    } else {
        values = [
            {
                "node_id": "task_dialogue_task_id",
                "value": "(id will be created automatically)"
            },
            {
                "node_id": "task_dialogue_task_name",
                "value": "my task's name"
            }
        ]        
    }

    ddui.Dialogue(
        dialogue_title,
        null,
        null,
        "/dialogues/task.html",
        null,
        "/dialogues/task.css",
        values,
        "task_dialogue_task_name",
        [
            {
                label: "Cancel",
                style: "inferior"
            },
            {
                label: button_ok_label,
                onClick: async () => {

                    // fetch values from dialogue
                    let task_from_dialogue = {
                        name: document.getElementById("task_dialogue_task_name").value,
                        target: document.getElementById("task_dialogue_task_target").value,
                        commands: document.getElementById("task_dialogue_task_commands").value
                    }

                    // if an opened task shall be updated ...
                    if (task_id) {
                        try {
                            task_from_dialogue["id"] = document.getElementById("task_dialogue_task_id").value;
                            await UpdateTask(task_from_dialogue);
                            new ddui.Toaster("Task updated.");
                        }

                        catch (err) {
                            console.error(err);
                            RefreshTaskList();
                            ddui.DisplayError(err);
                        }
                    
                    // if a new task shall be created ...
                    } else {
                        try {
                            task_from_dialogue["id"] = ddui.GenerateUuid();
                            await AppendNewTask(task_from_dialogue);
                        }
                        
                        catch (err) {
                            console.error(err);
                            RefreshTaskList();
                            ddui.DisplayError(err);
                        }
                    }

                },
                closeOnClick: true
            }
        ]
    );

}






function ValidateApiResponse(response) {

    const [ httpcode, body ] = response;

    if ( httpcode >= 200 && httpcode <= 299 ) {
        return true;
    }
    
    else {

        // client error
        if ( httpcode >= 400 && httpcode <= 499 ) {
            throw new ApiError(`Client error (${httpcode}).\nError code: ${body["error"]["code"]}\nError message: ${body["error"]["message"]}`);
        }

        // server error
        else if ( httpcode >= 500 && httpcode < 600 ) {
            throw new ApiError(`Server error (${httpcode}).\nDetails: ${String(body)}`);
        }

        // any other error
        else {
            throw new ApiError(`Unknown error (${httpcode}).\nDetails: ${String(body)}`);
        }

    }

}






async function GetTasksFromServer() {

    log.log("Requesting tasks from server.", __file__);

    // response = [ http_code, body ]
    const response = await api.SendCall("GET", "/Tasks", "", "");
    ValidateApiResponse(response);
    return response[1]; // return body

}






async function CreateTaskOnServer(task) {
   
    try {
        // response = [ http_code, body ]
        const response = await api.SendCall("POST", "/Tasks", null, JSON.stringify(task));
        ValidateApiResponse(response);
    }

    catch (err) {
        ddui.DisplayError(`An error occured while trying to create a task on the server.\n\n${err.message}`);
    }

}






async function UpdateTaskOnServer(task) {

    try {
        // response = [ http_code, body ]
        const response = await api.SendCall("PUT", "/Tasks/" + task["id"], null, JSON.stringify(task));
        ValidateApiResponse(response);
    }

    catch (err) {
        ddui.DisplayError(`An error occured while trying to update a task on the server.\n\n${err.message}`);
    }

}






export async function ExecuteTasks(tasks) {

    // response = [ http_code, body ]
    const response = await api.SendCall("POST", "/Tasks/Execute", null, JSON.stringify(tasks));
    ValidateApiResponse(response);
    return response[1]; // return body

}