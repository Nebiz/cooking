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
        alert("Missing form info!");
        return;
    }

    $.post("https://worker1.nebiz-tech.workers.dev", JSON.stringify(content));
    alert("Nouvelle recette envoyée! :)");
    $("#recipeForm").trigger('reset');
}

// Edit a recipe from the database.
function editRecipe(recipeNewData) {
    $.ajax({
        type: 'PATCH',
        url: 'https://worker1.nebiz-tech.workers.dev',
        data: recipeNewData,
        headers: { "Authorization": "Basic " + getLocalAuth() },
        success: function (response) {
            // alert(response);
            console.log(response);
            $($("#DataSuccess").html()).toast('show');
        },
        error: function (xhr, status, error) {
            alert(`${xhr.responseText}\n${status}\n${error}`);
            console.log(xhr.responseText);
            $($("#DataError").html()).toast('show');
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
            // $($("#DataSuccess").html()).toast('show');
        },
        error: function (xhr, status, error) {
            console.log(xhr.responseText);
            // $($("#DataError").html()).toast('show');
        }
    });
}

// Get local admin cookie.
function getLocalAuth() {
    return Cookies.get('recette.auth');
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
