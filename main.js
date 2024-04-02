





// global catch
window.onerror = (msg, url, line, column, error) => {
    // console.error(error);
    window.alert(`An unhandled error occured. Sorry.\n` +
        `You can try to completely reload the page by pressing Ctrl+F5.\n` +
        `\n` +
        `Details:\n` +
        `${msg}\n` +
        `=> at ${url} (line no ${line}, column no ${column})`);
}






// node modules
import * as ddui from "./node_modules/@haslda/ddui/ddui.js";

// local modules
import * as init from "./init.js";
import * as log from "./log.js";
import * as api from "./api.js";
import * as tasks from "./tasks.js";
import * as db from "./db.js";

// initializing constants
const __file__ = import.meta.url.slice( import.meta.url.lastIndexOf("/") + 1 );






function Main() {

    init.init(); // Initiat app
    const loading_gif = document.getElementById("app_init_loading_gif");
    loading_gif.remove();
    document.getElementById("app_main").style.display = null;
    tasks.RefreshTaskList(); // Initiate task list

    const header_button_theme = document.getElementById("header_button_theme");
    header_button_theme.addEventListener("click", event => OpenHeaderMenuTheme(event));

    const header_button_menu = document.getElementById("header_button_menu");
    header_button_menu.addEventListener("click", event => OpenHeaderMenuMore(event));

    const button_execute = document.getElementById("button_execute");
    button_execute.addEventListener("click", (event) => ExecuteTasks(event));

    const test_button = document.getElementById("button_api_call");
    test_button.addEventListener("click", () => SendApiCall());

}






async function OpenHeaderMenuTheme(event) {

    ddui.Popup(
        [
            {
                type: "button",
                label: "Light mode",
                icon: "light_mode",
                onClick: () => { ddui.ToggleTheme("light", "app_theme_icon") }
            },
            {
                type: "button",
                label: "Dark mode",
                icon: "dark_mode",
                onClick: () => { ddui.ToggleTheme("dark", "app_theme_icon") }
            },
            {
                type: "button",
                label: "System default",
                icon: "devices",
                onClick: () => { ddui.ToggleTheme("system", "app_theme_icon") }
            }
        ],
        "positioned",
        event.currentTarget
    );

}






async function OpenHeaderMenuMore(event) {

    function CreateNewTask() {
        tasks.OpenTaskDialogue(true);
    }






    function TestMessageBoxesClick() {
        ddui.MessageBox(
            "Warning! This is serious! You are about to choose between two possible actions. Each will have no real effect but at least it will do something. Give it a shot! You can do it!",
            "bare",
            [
                {
                    label: "Close",
                    style: "inferior"
                },
                {
                    label: "Text only",
                    onClick: () => { ddui.MessageBox("This is a message box with just some text. Have fun reading it!") },
                    closeOnClick: false
                },
                {
                    label: "Info",
                    onClick: () => { ddui.MessageBox("This is a message box with info design.", "info") },
                    closeOnClick: false
                },
                {
                    label: "Warning",
                    onClick: () => { ddui.MessageBox("This is a message box with warning design.", "warning") },
                    closeOnClick: false
                },
                {
                    label: "Error",
                    onClick: () => { ddui.MessageBox("This is a message box with error design.", "error") },
                    closeOnClick: false,
                    style: "red"
                },
                {
                    label: "Success",
                    onClick: () => { ddui.MessageBox("This is a message box with success design.", "success") },
                    closeOnClick: false
                },
                {
                    label: "No Exit",
                    onClick: () => { ddui.MessageBox("This is a message box that doesn't allow an exit.", null, null, false) },
                    closeOnClick: false
                }
            ]
        );
    }






    function TestToasterClick() {
        ddui.Toaster("Hey there!");
    }






    async function TestingButtonClick() {
        console.log(ddui.GetDduiStyleSheet());
    }






    function ToggleApiTesterVisibility() {
        const api_tester = document.getElementById("api_tester");
        if ( api_tester.style.display == "none" ) {
            api_tester.style.display = "flex";
            document.getElementById("api_path").focus();
            document.getElementById("api_path").select();
        } else { 
            api_tester.style.display = "none";
        }
    }






    ddui.Popup(
        [
            {
                type: "button",
                label: "Add new task ...",
                icon: "add",
                onClick: () => { CreateNewTask() }
            },
            {
                type: "line"
            },
            {
                type: "button",
                label: "Test message boxes",
                icon: "sports_score",
                onClick: () => { TestMessageBoxesClick() }
            },
            {
                type: "button",
                label: "Test toaster",
                icon: "thumb_up",
                onClick: () => { TestToasterClick() }
            },  
            {
                type: "line"
            },
            {
                type: "button",
                label: "Testing button",
                icon: "electric_bolt",
                onClick: () => { TestingButtonClick() }
            },              
            {
                type: "button",
                label: "Show / Hide API tester",
                icon: "menu_open",
                onClick: () => { ToggleApiTesterVisibility() }
            },
            {
                type: "line"
            },
            {
                type: "button",
                label: "About",
                icon: "info",
                onClick: () => {
                    ddui.MessageBox(
                        "This is a dev verions of devploy.<br><br>© David Haslwanter, 2024",
                        "info"
                        )
                    }
            }
        ],
        "positioned",
        event.currentTarget
    );

}






async function ExecuteTasks(event) {
    
    const loading_box = ddui.LoadingBox("executing tasks ...");
    let checked_tasks = [];
    let task_data;
    let count = 0;

    try {

        const tasklist = document.getElementsByName("task");

        let task_id;
        for ( let task of tasklist ) {
            task_id = task.id.slice(5);
            if ( document.getElementById("checkbox_" + task_id).checked ) {
                checked_tasks.push(task_id);
            }
        }

        for ( let task of checked_tasks ) {
            count += 1;
            task_data = await db.Read("tasks", task);
            loading_box.UpdateInfoText(`Executing task ${count} of ${checked_tasks.length}:<br>` + task_data.name);
            await tasks.ExecuteTasks([task]);
        }

        ddui.Toaster(`Executed all ${String(checked_tasks.length)} tasks succesfully.`);

    }

    catch (err) {
        ddui.DisplayError(`An error occured while executing task ${count} of ${checked_tasks.length}:\n"${task_data.name}"\nThe execution of the remaining tasks was aborted.\n\n${err.message}`);
    }

    finally {
        loading_box.Discard();
    }

}






async function SendApiCall() {

    function AutoFitHeight(el) {
        el.style.height = "1px";
        el.style.height = ( 25 + res_body_box.scrollHeight ) + "px";
    }

    const api_command = document.getElementById("api_command").value;
    const api_path = document.getElementById("api_path").value;
    const req_body = document.getElementById("req_body_box").value;
    const res_body_box = document.getElementById("res_body_box");
    const res_httpcode_el = document.getElementById("res_httpcode");

    res_body_box.innerHTML = ""
    AutoFitHeight(res_body_box);
    res_httpcode_el.innerHTML = "..."
    res_httpcode_el.style.color = "#000000";

    let res_httpcode;
    let res_body; 
    [ res_httpcode, res_body ] = await api.SendCall(api_command, api_path, "", req_body);

    res_httpcode_el.innerHTML = res_httpcode;
    if ( res_httpcode >= 200 && res_httpcode <= 299 ) {
        res_httpcode_el.style.color = "#00AA00";
    } else if ( res_httpcode >= 400 ) {
        res_httpcode_el.style.color = "#DD0000";
    } else {
        res_httpcode_el.style.color = "#000000";
    }

    res_body_box.innerHTML = JSON.stringify(res_body, null, 2);
    AutoFitHeight(res_body_box);

}






// Global catch for unhandled errors
try {
    Main();
}
catch (err) {
    log.log(`An unhandled error occured: ${err.name} - ${err.message}`);
    console.error(err);
    ddui.DisplayError(`An unhandled error occured: ${err.name} - ${err.message}`);
}