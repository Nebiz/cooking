let localSwitch = false;

// Return array of all recipes from server.
function getAllRecipe(callback) {
    if (window.location.hostname === '127.0.0.1' && localSwitch) {
        $.getJSON("test/kv_db3_string.json", (localData) => {
            $.getJSON("test/localTest.json", (testData) => {
                localData.data.push(testData);
                callback(sanitizeJsonObjects(localData.data));
            });
        });
    } else {
        $.getJSON("https://worker1.nebiz-tech.workers.dev", (serverData) => {
            callback(sanitizeJsonObjects(serverData.data));
        });
    }
}

// Send recipe from form to the server.
function sendRecipeToServer(content) {
    if (!content.recipe.title || !content.recipe.author.length || !content.recipe.ingredients.length) {
        alert("Champs requis: Titre, Auteur et ingrédients");
        return;
    }

    $.post("https://worker1.nebiz-tech.workers.dev", JSON.stringify(content))
        .done(data => { // (data, textStatus, jqXHR)
            alert("Nouvelle recette envoyée! :)"); // TODO: use bootstrap toast instead.
            $("#recipeForm").trigger('reset');
        })
        .fail(data => { // (jqXHR, textStatus, errorThrown)
            alert("Erreur pour nouvelle recette");
            console.log(`Some error happenned: ${data}`);
        });
}

// Edit a recipe from the database.
function editRecipe(recipeNewData) {
    $.ajax({
        type: 'PATCH',
        url: 'https://worker1.nebiz-tech.workers.dev',
        data: recipeNewData,
        headers: { "Authorization": "Basic " + getLocalAuth() },
        success: function (response) {
            console.log(response);
            // $($("#DataSuccess").html()).toast('show');
        },
        error: function (xhr, status, error) {
            isResponseBadAuth(xhr.responseText);
            console.log(`Error all info: ${xhr.responseText}\n${status}\n${error}`);
            console.log("Response text: " + xhr.responseText);
            // $($("#DataError").html()).toast('show');
        }
    });
}

// Delete a recipe from the database.
function deleteRecipe(recipeGUID) {
    $.ajax({
        type: 'DELETE',
        url: 'https://worker1.nebiz-tech.workers.dev',
        data: recipeGUID,
        headers: { "Authorization": "Basic " + getLocalAuth() },
        success: function (response) {
            console.log(response);
        },
        error: function (xhr, status, error) {
            isResponseBadAuth(xhr.responseText);
            console.log(`Error all info: ${xhr.responseText}\n${status}\n${error}`);
            console.log("Response text: " + xhr.responseText);
        }
    });
}

function getLocalAuth() {
    return Cookies.get('recette.auth');
}

function deleteLocalAuth() {
    Cookies.remove('recette.auth');
}

// TODO: condition check => response status instead of response text.
function isResponseBadAuth(responseText) {
    if (responseText === "Bad Auth!") {
        deleteLocalAuth();
    }
}

function sanitizeJsonObjects(jsonObjects) {
    return jsonObjects.map(jsonObject => sanitizeJsonObject(jsonObject));
}

function sanitizeJsonObject(obj) {
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeJsonObject(item));
    } else if (typeof obj === 'object' && obj !== null) {
        const sanitizedObj = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                const sanitizedKey = DOMPurify.sanitize(key);
                sanitizedObj[sanitizedKey] = sanitizeJsonObject(obj[key]);
            }
        }
        return sanitizedObj;
    } else if (typeof obj === 'string') {
        return DOMPurify.sanitize(obj);
    } else {
        return obj;
    }
}
