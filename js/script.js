$(document).ready(function () {
    fetchAllJsonFiles(function (jsonObjects) {
        showAllRecipes(jsonObjects);
        setWebpageEvents();
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

    function fetchAllJsonFiles(callback) {
        const isLocal = window.location.hostname === '127.0.0.1';
        if (isLocal) {
            $.ajax({
                url: "json/",
                success: function (data) {
                    const jsonFiles = $(data).find("a:contains('.json')").not("a:contains('index.json')");
                    let jsonObjects = [];
                    let filesProcessed = 0;

                    // const myArray = $(data).find("a:contains('.json')").map(function () {
                    //     return $(this).attr("href").split('/').pop();
                    // }).get();
                    // console.log(myArray);

                    jsonFiles.each(function () {
                        const fullPath = `json/${$(this).attr("href").split('/').pop()}`;
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
        } else if (window.location.hostname === 'recette.pages.dev') {
            $.ajax({
                url: "https://worker1.nebiz-tech.workers.dev",
                success: function (data) {
                    callback(sanitizeJsonObjects(JSON.parse(data).data));
                }
            });
        } else if (window.location.hostname === 'nebiz.github.io') {
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

    function showAllRecipes(recipeList) {
        recipeList.sort((a, b) => new Date(a.recipe.date_created) - new Date(b.recipe.date_created));
        const template = $($("#template-recipe-preview").html());

        recipeList.forEach(recipeData => {
            const recipe = recipeData.recipe;
            const newItem = template.clone();

            newItem.attr('data-item', recipe.file_name);
            newItem.find(".card-title").text(recipe.title).append(`<span class="fst-italic text-secondary fs-6"></span>`);
            newItem.find(".card-title span").text(` by ${recipe.author.join(", ")}`);
            newItem.find(".card-text").text(recipe.description);

            if (recipe.image_url) {
                const imageURL = DOMPurify.sanitize(recipe.image_url);
                newItem.find("img").attr('src', imageURL + "?h=400").show();
            }

            newItem.on("click", function () {
                setSelectedRecipe(recipeData);
                toggleRecipeView();
            });

            $("#all-recipe-container").append(newItem);
        });
    }

    function setSelectedRecipe(jsonObj) {
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

        $("#modifyRecipe").on("click", () => {
            window.location = "create.html?recipe=" + DOMPurify.sanitize(recipe.file_name);
        });
    }

    function setWebpageEvents() {
        setReturnHome($('#LogoAndTitle'));
        $('#searchInput').on("input", filterRecipes); // Setup Search Filter
        setPreviousButtonAction();
    }

    function setReturnHome(htmlElement) {
        htmlElement.on("click", function () {
            $("#recipe-container").hide();
            $("#search-container").show();
        });
    }

    function toggleRecipeView() {
        $("#search-container").toggle();
        $("#recipe-container").toggle();
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

    function setPreviousButtonAction() {
        // Add an entry to the history stack
        history.pushState(null, null, location.href);
        $(window).on('popstate', function (event) {
            if ($("#recipe-container").is(":visible")) {
                // Prevent default back navigation
                history.pushState(null, null, location.href);

                toggleRecipeView();
                $("#searchInput").focus();
            }
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
