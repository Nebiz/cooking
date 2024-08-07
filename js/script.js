$(document).ready(function () {
    getAllRecipe((arrayOfRecipe) => {
        showAllRecipes(arrayOfRecipe);
        setWebpageEvents();
        setRecipeActionButtons();
    });

    function showAllRecipes(recipeList) {
        recipeList.sort((a, b) => new Date(a._date) - new Date(b._date));
        const template = $($("#recipe-template").html());

        recipeList.forEach(recipe => {
            const newItem = template.clone();

            newItem.find(".card-title").text(recipe.title).append(`<span class="fst-italic text-secondary fs-6"></span>`);
            newItem.find(".card-title span").text(` by ${recipe.author.join(", ")}`);
            newItem.find(".card-text").text(recipe.description);

            if (recipe.image_url) {
                const imageURL = DOMPurify.sanitize(recipe.image_url);
                newItem.find("img").attr('src', imageURL + "?h=400").show();
            } else {
                newItem.find("img").attr('src', "img/logo.png").css("object-fit", "inherit").show();
            }

            newItem.on("click", function () {
                setSelectedRecipe(recipe);
                toggleRecipeView();
            });

            $("#all-recipe-container").append(newItem);
        });
    }

    function setSelectedRecipe(recipe) {
        $("#recipe-title").text(recipe.title);
        $("#recipe-author").text(`By: ${recipe.author.join(", ")}`);
        $("#recipe-description").text(recipe.description);
        $("#recipe-prep-time").text(recipe.prep_time);
        $("#recipe-cook-time").text(recipe.cook_time);
        $("#recipe-servings").text(recipe.servings);
        $("#recipe-tags").text(recipe.tags.join(", "));

        // DOM S
        const ingredientsList = recipe.ingredients.map(ingredient =>
            $("<li>").text(ingredient.quantity ? `${ingredient.quantity} ${ingredient.scale} ${ingredient.name}` : ingredient)
        );
        $("#recipe-ingredients").html(ingredientsList);

        const instructionsList = recipe.instructions.map(instruction => $("<li>").text(instruction));
        $("#recipe-instructions").html(instructionsList);

        $("#modifyRecipe").off('click'); // Remove all event attached to the singular button.
        $("#modifyRecipe").on("click", () => {
            window.location = "create.html?recipe=" + DOMPurify.sanitize(recipe._id);
        });

        $("#deleteRecipe").off('click');
        $("#deleteRecipe").on("click", () => {
            deleteRecipe(recipe);
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
                // $("#searchInput").focus();
            }
        });
    }

    function setRecipeActionButtons() {
        if (!getLocalAuth()) { return; }

        const btnTemplate = $($("#btnTemplate").html());

        // Edit Button
        let editBtn = btnTemplate.clone();
        editBtn.attr("id", "modifyRecipe").find("img").attr("src", "img/modify.png")
        $("#recipe-container").append(editBtn);
        // Delete Button
        let deleteBtn = btnTemplate.clone();
        deleteBtn.attr("id", "deleteRecipe").find("img").attr("src", "img/delete.png")
        $("#recipe-container").append(deleteBtn);
    }

});
