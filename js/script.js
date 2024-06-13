// Sanitize when you get all the json files
$(document).ready(function () {
    fetchAllJsonFiles("json/", function (jsonObjects) {
        var recipeList = getRecipeDisplayInfo(jsonObjects);
        showAllRecipes(recipeList);
        $('#searchInput').on("input", filterRecipes);
        setRecipeViewEvents();
        setReturnHome($('#LogoAndTitle'));
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

    function fetchAllJsonFiles(folderPath, callback) {
        const isLocal = window.location.hostname === '127.0.0.1';
        if (isLocal) {
            $.ajax({
                url: folderPath,
                success: function (data) {
                    const jsonFiles = $(data).find("a:contains('.json')").not("a:contains('index.json')");
                    let jsonObjects = [];
                    let filesProcessed = 0;

                    // const myArray = $(data).find("a:contains('.json')").map(function () {
                    //     return $(this).attr("href").split('/').pop();
                    // }).get();
                    // console.log(myArray);

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
            $.getJSON("index.json", function (jsonList) {
                jsonList.forEach(fileName => {
                    $.getJSON(`json/${fileName}`, function (jsonData) {
                        jsonObjects.push(jsonData);
                        filesProcessed++;
                        if (filesProcessed === jsonList.length) {
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
            image_url: json.recipe.image_url,
            date_created: json.recipe.date_created
        }));
    }

    function showAllRecipes(recipeList) {
        recipeList.sort((a, b) => new Date(a.date_created) - new Date(b.date_created));
        const template = $($("#template-recipe-preview").html());

        recipeList.forEach(recipe => {
            const newItem = template.clone();
            newItem.attr('data-item', recipe.file_name);
            newItem.find(".card-title").text(recipe.title).append(`<span class="fst-italic text-secondary fs-6"></span>`);
            newItem.find(".card-title span").text(` by ${recipe.author.join(", ")}`);
            newItem.find(".card-text").text(recipe.description);

            if(recipe.image_url){
                const imageURL = DOMPurify.sanitize(recipe.image_url);
                newItem.find("img").attr('src', imageURL + "?h=400").show();
            }
            
            $("#all-recipe-container").append(newItem);
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

        // DOM S
        const ingredientsList = recipe.ingredients.map(ingredient =>
            $("<li>").text(ingredient.quantity ? `${ingredient.quantity} ${ingredient.scale} ${ingredient.name}` : ingredient)
        );
        $("#recipe-ingredients").html(ingredientsList);

        const instructionsList = recipe.instructions.map(instruction => $("<li>").text(instruction));
        $("#recipe-instructions").html(instructionsList);
    }

    function filterRecipes() {
        const input = $('#searchInput').val().toLowerCase();
        const keywords = input.split(' ').filter(keyword => keyword);

        $('#all-recipe-container .recipe').each(function () {
            const itemName = $(this).find(".card-title").text().toLowerCase();

            const matches = keywords.every(keyword => itemName.includes(keyword)); // Check if all keywords are present in title or author
            $(this).toggle(matches);
        });
    }

    function setReturnHome(htmlElement) {
        htmlElement.on("click", function () {
            $("#recipe-container").hide();
            $("#search-container").show();
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

// No encoding: innerHTML; Encoding: textContent or innerText;
function escapeHtml(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap(s) {
        return entityMap[s];
    });
}
