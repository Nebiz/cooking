$(document).ready(function () {
    getAllRecipe(function (jsonObjects) {
        showAllRecipes(jsonObjects);
        setWebpageEvents();
    });

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
            } else {
                newItem.find("img").attr('src', "img/favicon.png").css("object-fit", "inherit").show();
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

        $("#modifyRecipe").off('click'); // Prevent having multiple click event on the same button. This is bcz there's only 1 button.
        $("#modifyRecipe").on("click", () => {
            alert("Pas encore implémenté");
            // window.location = "create.html?recipe=" + DOMPurify.sanitize(recipe.file_name);
        });

        $("#deleteRecipe").off('click');
        $("#deleteRecipe").on("click", () => {
            deleteRecipe(recipe.file_name);
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

    // Mobile device previous button, fixing workflow.
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
