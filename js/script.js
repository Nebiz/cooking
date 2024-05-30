// Sanitize when you get all the json files
$(document).ready(function () {
    fetchAllJsonFiles("json/", function (jsonObjects) {
        var recipeList = getRecipeDisplayInfo(jsonObjects);
        showAllRecipes(recipeList);
        $('#searchInput').on("input", filterRecipes);
        setRecipeViewEvents();
    });

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
                    const sanitizedKey = escapeHtml(DOMPurify.sanitize(key));
                    sanitizedObj[sanitizedKey] = sanitizeJsonObject(obj[key]);
                }
            }
            return sanitizedObj;
        } else if (typeof obj === 'string') {
            return escapeHtml(DOMPurify.sanitize(obj));
        } else {
            return obj;
        }
    }

    function fetchAllJsonFiles(folderPath, callback) {
        const isLocal = window.location.hostname === '127.0.0.1';
        if (isLocal) {
            $.ajax({
                url: folderPath,
                success: function (data) {
                    const jsonFiles = $(data).find("a:contains('.json')");
                    let jsonObjects = [];
                    let filesProcessed = 0;

                    jsonFiles.each(function () {
                        const fullPath = `${folderPath}${$(this).attr("href").split('/').pop()}`;
                        $.getJSON(fullPath, function (jsonData) {
                            jsonObjects.push(jsonData);
                            filesProcessed++;
                            if (filesProcessed === jsonFiles.length) {
                                callback(sanitizeJsonObjects(jsonObjects));
                            }
                        });
                    });
                }
            });
        } else {
            let jsonObjects = [];
            let filesProcessed = 0;
            $.getJSON("json_index.json", function (jsonList) {
                jsonList.forEach(fileName => {
                    $.getJSON(`json/${fileName}`, function (jsonData) {
                        jsonObjects.push(jsonData);
                        filesProcessed++;
                        if (filesProcessed === jsonList.files.length) {
                            callback(sanitizeJsonObjects(jsonObjects));
                        }
                    })
                })
            });
        }
    }

    function getRecipeDisplayInfo(jsonObjects) {
        return jsonObjects.map(json => ({
            file_name: json.recipe.file_name,
            title: json.recipe.title,
            description: json.recipe.description,
            author: json.recipe.author,
            date_created: json.recipe.date_created
        }));
    }

    function showAllRecipes(recipeList) {
        recipeList.sort((a, b) => new Date(DOMPurify.sanitize(a.date_created)) - new Date(DOMPurify.sanitize(b.date_created)));
        const template = $($("#template-recipe-preview").html());

        recipeList.forEach(recipe => {
            const newItem = template.clone();
            const sanitizedFileName = escapeHtml(DOMPurify.sanitize(recipe.file_name));
            const sanitizedTitle = escapeHtml(DOMPurify.sanitize(recipe.title));
            const sanitizedAuthors = escapeHtml(DOMPurify.sanitize(recipe.author.join(", ")));
            const sanitizedDescription = escapeHtml(DOMPurify.sanitize(recipe.description));

            newItem.attr('data-item', sanitizedFileName);
            newItem.attr('data-authors', sanitizedAuthors);
            newItem.find(".card-title").text(sanitizedTitle).append(`<span class="fst-italic text-secondary fs-6"> by ${sanitizedAuthors}</span>`);
            newItem.find(".card-text").text(sanitizedDescription);
            $("#all-recipe-container").append(newItem);
        });
    }

    function showAllRecipes2(recipeList) {
        recipeList.sort((a, b) => new Date(a.date_created) - new Date(b.date_created));
        const templateHtml = $("#template-recipe-preview").html();

        recipeList.forEach(recipe => {
            // Construct the HTML string
            const newItemHtml = $(templateHtml).clone()
                .attr('data-item', recipe.file_name)
                .attr('data-authors', recipe.author.join(", "))
                .find(".card-title").text(recipe.title).end()
                .find(".card-title").append(`<span class="fst-italic text-secondary fs-6"> by ${recipe.author.join(", ")}</span>`).end()
                .find(".card-text").text(recipe.description).end()
                .prop('outerHTML');

            const sanitizedHtml = DOMPurify.sanitize(newItemHtml);
            const sanitizedItem = $(sanitizedHtml);

            console.log(sanitizedItem);
            $("#all-recipe-container").append(sanitizedItem);
        });
    }

    function showSelectedRecipe(jsonObj) {
        const { recipe } = jsonObj;
        $("#recipe-title").text(recipe.title);
        $("#recipe-author").text(`By: ${recipe.author.join(", ")}`);
        $("#recipe-description").text(recipe.description);
        $("#recipe-prep-time").text(recipe.prep_time);
        $("#recipe-cook-time").text(recipe.cook_time);
        $("#recipe-total-time").text(recipe.total_time);
        $("#recipe-servings").text(recipe.servings);

        const ingredientsList = recipe.ingredients.map(ingredient =>
            `<li>${ingredient.quantity ? `${ingredient.quantity} ${ingredient.scale} ${ingredient.name}` : ingredient}</li>`
        ).join('');
        $("#recipe-ingredients").html(DOMPurify.sanitize(ingredientsList));

        const instructionsList = recipe.instructions.map(instruction => `<li>${instruction}</li>`).join('');
        $("#recipe-instructions").html(DOMPurify.sanitize(instructionsList));
    }

    function filterRecipes() {
        const input = $('#searchInput').val().toLowerCase();
        const keywords = input.split(' ').filter(keyword => keyword); // Filter: remove empty strings

        $('#all-recipe-container .recipe').each(function () {
            const itemName = $(this).find(".card-title").text().toLowerCase();
            // const itemName = $(this).attr('data-item').toLowerCase();
            // const itemAuthors = $(this).attr('data-authors').toLowerCase();

            const matches = keywords.every(keyword => itemName.includes(keyword)); // Check if all keywords are present in title or author
            $(this).toggle(matches);
        });
    }

    function setRecipeViewEvents() {
        $('#all-recipe-container').on("click", ".recipe", function () {
            const itemName = $(this).attr('data-item');
            $.getJSON(`json/${itemName}.json`, function (json) {
                $("#search-container").hide();
                $("#recipe-container").show();
                showSelectedRecipe(sanitizeJsonObject(json));
            });
        });

        // Not used for now: Close current recipe view, set on back arrow icon
        $("#goback-btn").on("click", function () {
            $("#search-container").show();
            $("#recipe-container").hide();
        });
    }
});

// Utility function to escape special characters
function escapeHtml(string) {
    return String(string).replace(/[&<>"]/g, function (s) {
        return ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            //"'": '&#39;',
        })[s];
    });
}

var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

function escapeHtml2(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) {
        return entityMap[s];
    });
}