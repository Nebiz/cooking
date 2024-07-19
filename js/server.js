let localSwitch = false;
let workerUrl = "https://worker1.nebiz-tech.workers.dev";

// Return array of all recipes from server.
function getAllRecipe(callback) {
    if (window.location.hostname === '127.0.0.1' && localSwitch) {
        $.getJSON("test/kv_db3_string.json", (localData) => {
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
        alert("Champs requis: Titre, Auteur et Ingrédients");
        return;
    }

    $.post(workerUrl, JSON.stringify(recipe))
        .done(data => { // (data, textStatus, jqXHR)
            alert("Nouvelle recette envoyée! :)"); // TODO: use bootstrap toast instead.
            $("#recipeForm").trigger('reset');
            $(".editable-list").empty().append("<li>").trigger('input'); // Append li: so count doesnt disappear & getting data is working.
        })
        .fail(data => { // (jqXHR, textStatus, errorThrown)
            alert("Erreur pour nouvelle recette");
            console.log(`Some error happenned: ${data}`);
        });
}

// Edit a recipe from the database.
function editRecipe(newRecipeData) {
    let recipe = sanitizeObj(newRecipeData);
    ajaxRequest('PATCH', recipe);
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
            location.reload(); // QOL: auto reload page after server changes.
            // $($("#DataSuccess").html()).toast('show');
        },
        error: function (xhr, status, error) {
            delCookieOnBadAuth(xhr.responseText);
            console.log(`Error - ResponseText: ${xhr.responseText}\nStatus: ${status}\nError: ${error}`);
            // $($("#DataError").html()).toast('show');
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
