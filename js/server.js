let localSwitch = false;
let workerUrl = "https://worker1.nebiz-tech.workers.dev";
const l = obj => console.log(obj);

// Return array of all recipes from server.
function getAllRecipe(callback) {
    if (window.location.hostname === '127.0.0.1' && localSwitch) {
        $.getJSON("test/kvDB.json", (localData) => {
            $.getJSON("test/localTest.json", (testData) => {
                localData.data.push(testData);
                callback(sanitizeObj(localData.data));
            });
        });
    } else {
        $.getJSON(workerUrl, (serverData) => {
            callback(sanitizeObj(serverData.data));
        });
    }
}

// Send recipe from form to the server.
function postRecipe(content) {
    let recipe = sanitizeObj(content);
    if (!recipe.recipe.title || !recipe.recipe.author.length || !recipe.recipe.ingredients.length) {
        showToast("Champs requis: Titre, Auteur et Ingrédients", false);
        return;
    }

    $.post(workerUrl, JSON.stringify(recipe))
        .done(data => { // (data, textStatus, jqXHR)
            showToast("Nouvelle recette envoyée! :)", true);
            $("#recipeForm").trigger('reset');
            $(".editable-list").empty().append("<li>").trigger('input'); // Append li: so count doesnt disappear & getting data is working.
            // TODO: Replace 2 above lines with: redirect user to new recipe view
        })
        .fail(data => { // (jqXHR, textStatus, errorThrown)
            showToast("Erreur pour nouvelle recette", false);
            console.log(`Some error happenned: ${data}`);
        });
}

// Edit a recipe from the database.
function editRecipe(newRecipeData) {
    ajaxRequest('PATCH', JSON.stringify(sanitizeObj(newRecipeData)));
}

// Delete a recipe from the database.
function deleteRecipe(recipe) {
    ajaxRequest('DELETE', recipe.file_name);
}

function ajaxRequest(type, data) {
    $.ajax({
        type: type,
        url: workerUrl,
        data: data,
        headers: { "Authorization": "Basic " + getLocalAuth() },
        success: function (response) {
            console.log(response);
            showToast(response, true); // TODO: the toast is never shown because the page reload.
            location.reload(); // QOL: auto reload page after server changes.
        },
        error: function (xhr, status, error) {
            delCookieOnBadAuth(xhr.responseText);
            console.log(`Error:\nResponseText: ${xhr.responseText}\nStatus: ${status}\nError: ${error}`);
            showToast(xhr.responseText, false);
        }
    });
}

const authCookieName = 'recette.auth';
function getLocalAuth() {
    return Cookies.get(authCookieName);
}

function setLocalAuth(value) {
    Cookies.set(authCookieName, value);
}

function deleteLocalAuth() {
    Cookies.remove(authCookieName);
}

// TODO: condition check => response status instead of response text.
function delCookieOnBadAuth(responseText) {
    if (responseText === "Bad Auth!") {
        deleteLocalAuth();
    }
}

let toastCount = 0;
let toastOffset = index => 5 + (index * 70);
let toastElement =
    $(`<div role="status" aria-live="polite" aria-atomic="true" class="toast position-fixed start-50 translate-middle p-1 mt-5 rounded-3">
            <div class="toast-header">
                <h5 id="toastText" class="mx-auto">Toast Message</h5>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>`);
// TODO: change position type because if you show 2 toast, only the 2nd one is shown. Also since there's only 1 instance, maybe can't shown 2 toast at the same time. Fix: always append the body with new toast. (Remove if() at beginning of function).
function showToast(toastText, isSuccess) {
    let newToast = toastElement.clone();

    newToast.find("#toastText").text(toastText);
    let bgColor = isSuccess ? "bg-success-subtle" : "bg-warning-subtle";
    newToast.addClass(bgColor).find(".toast-header").addClass(bgColor);

    newToast.css("top", toastOffset(toastCount) + "px"); // Calculate vertical offset to avoid overlap

    newToast.appendTo(document.body);
    bootstrap.Toast.getOrCreateInstance(newToast).show();
    // new bootstrap.Toast(newToast).show(); // Other method / Bootstrap's Toast API

    // Event listener to handle toast fade-out
    newToast.on('hidden.bs.toast', () => {
        toastCount--; // Decrement the counter when the toast hides
        newToast.remove();
        repositionToasts(); // Reposition remaining toasts
    });
    toastCount++;
}

// Reposition all visible toasts
function repositionToasts() {
    $('.toast').each((index, element) => {
        $(element).css('top', toastOffset(index) + 'px');
    });
}

// No encoding: innerHTML; Encoding: textContent or innerText;
function sanitizeObj(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObj(item));
    } else if (typeof obj === 'object' && obj !== null) {
        const sanitizedObj = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                const sanitizedKey = DOMPurify.sanitize(key);
                sanitizedObj[sanitizedKey] = sanitizeObj(obj[key]);
            }
        }
        return sanitizedObj;
    } else if (typeof obj === 'string') {
        return DOMPurify.sanitize(obj);
    } else {
        return obj;
    }
}
