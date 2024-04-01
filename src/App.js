import { startTransition, useEffect, useState } from "react";
import FirebaseAuthService from "./FirebaseAuthService";
import LoginForm from "./components/LoginForm";
import AddEditRecipeForm from "./components/AddEditRecipeForm";
import FirebaseFirestoreService from "./FirebaseFirestoreService";

import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [currentRecipe, setCurrentRecipe] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [orderBy, setOrderBy] = useState("publishDateDesc");
  const [recipesPerPage, setRecipesPerPage] = useState(3);

  useEffect(() => {
    fetchRecipes()
      .then((fetchedRecipes) => setRecipes(fetchedRecipes))
      .catch((error) => {
        console.error(error.message);
        throw error;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, categoryFilter, orderBy, recipesPerPage]);

  FirebaseAuthService.subscribeToAuthChanges(setUser);

  async function fetchRecipes(cursorId = "") {
    let fetchedRecipes = [];
    const queries = [];

    if (categoryFilter) {
      queries.push({
        field: "category",
        condition: "==",
        value: categoryFilter,
      });
    }

    if (!user) {
      queries.push({
        field: "isPublished",
        condition: "==",
        value: true,
      });
    }

    const orderByField = "publishDate";
    let orderByDirection;

    if (orderBy) {
      switch (orderBy) {
        case "publishDateAsc":
          orderByDirection = "asc";
          break;
        case "publishDateDesc":
          orderByDirection = "desc";
          break;
        default:
          break;
      }
    }

    try {
      const response = await FirebaseFirestoreService.readDocuments({
        collection: "recipes",
        queries,
        orderByField,
        orderByDirection,
        perPage: recipesPerPage,
        cursorID: cursorId,
      });

      fetchedRecipes = response.docs.map((recipeDoc) => {
        const id = recipeDoc.id;
        const data = recipeDoc.data();

        data.publishDate = new Date(data.publishDate.seconds * 1000);

        return {
          ...data,
          id,
        };
      });

      if (cursorId) {
        fetchedRecipes = [...recipes, ...fetchedRecipes];
      }
    } catch (error) {
      console.error(error.message);
      throw error;
    }

    return fetchedRecipes;
  }

  function handleRecipesPerPageChange(event) {
    const recipesPerPage = event.target.value;
    startTransition(() => {
      setRecipes([]);
      setRecipesPerPage(recipesPerPage);
    });
  }

  function handleLoadMoreRecipesClick() {
    const lastRecipe = recipes.at(-1);
    const cursorId = lastRecipe.id;

    handleFetchRecipes(cursorId);
  }

  async function handleFetchRecipes(cursorId = "") {
    try {
      const fetchedRecipes = await fetchRecipes(cursorId);
      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  }

  async function handleAddRecipe(newRecipe) {
    try {
      const response = await FirebaseFirestoreService.createDocument(
        "recipes",
        newRecipe
      );

      handleFetchRecipes();

      alert("Successfully created a recipe with an ID = " + response.id);
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleUpdateRecipe(newRecipe, recipeId) {
    try {
      await FirebaseFirestoreService.updateDocument(
        "recipes",
        recipeId,
        newRecipe
      );

      handleFetchRecipes();

      alert(`Successfully updated a recipe with an ID = ${recipeId}`);

      startTransition(() => {
        setCurrentRecipe(null);
      });
    } catch (error) {
      alert(error.message);
      throw error;
    }
  }

  async function handleDeleteRecipe(recipeId) {
    const deleteConfirmation = window.confirm(
      "Are you sure you want to delete this recipe?"
    );

    if (deleteConfirmation) {
      try {
        await FirebaseFirestoreService.deleteDocument("recipes", recipeId);

        handleFetchRecipes();

        startTransition(() => {
          setCurrentRecipe(null);
        });

        window.scrollTo(0, 0);

        alert(`Successfully deleted a recipe with an ID = ${recipeId}`);
      } catch (error) {
        alert(error.message);
        throw error;
      }
    }
  }

  function handleEditRecipeClick(recipeId) {
    const selectedRecipe = recipes.find((recipe) => {
      return recipe.id === recipeId;
    });

    if (selectedRecipe) {
      startTransition(() => {
        setCurrentRecipe(selectedRecipe);
      });

      window.scrollTo(0, document.body.scrollHeight);
    }
  }

  function handleEditRecipeCancel() {
    startTransition(() => {
      setCurrentRecipe(null);
    });
  }

  function lookupCategoryLabel(category) {
    const categories = {
      breadsSandwichesAndPizza: "Breads, Sandwiches, and Pizza",
      eggsAndBreakfast: "Eggs & Breakfast",
      dessertsAndBakedGoods: "Desserts & Baked Goods",
      fishAndSeafood: "Fish & Seafood",
      vegetables: "Vegetables",
    };

    return categories[category];
  }

  function formatDate(date) {
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getFullYear();
    const dateString = `${month}-${day}-${year}`;

    return dateString;
  }

  return (
    <div className="App">
      <div className="title-row">
        <h1 className="title">Firebase Recipes</h1>
        <LoginForm existingUser={user}></LoginForm>
      </div>
      <div className="main">
        <div className="row filters">
          <label className="input-label">
            Category:
            <select
              value={categoryFilter}
              onChange={(e) =>
                startTransition(() => setCategoryFilter(e.target.value))
              }
              className="select"
            >
              <option value="">All</option>
              <option value="breadsSandwichesAndPizza">
                Breads, Sandwiches, and Pizza
              </option>
              <option value="eggsAndBreakfast">Eggs & Breakfast</option>
              <option value="dessertsAndBakedGoods">
                Desserts & Baked Goods
              </option>
              <option value="fishAndSeafood">Fish & Seafood</option>
              <option value="vegetables">Vegetables</option>
            </select>
          </label>
          <label className="input-label">
            <select
              value={orderBy}
              onChange={(e) =>
                startTransition(() => setOrderBy(e.target.value))
              }
              className="select"
            >
              <option value="publishDateDesc">
                Publish Date (newest - oldest)
              </option>
              <option value="publishDateAsc">
                Publish Date (oldest - newest)
              </option>
            </select>
          </label>
        </div>
        <div className="center">
          <div className="recipe-list-box">
            {recipes?.length > 0 ? (
              <div className="recipe-list">
                {recipes.map((recipe) => {
                  return (
                    <div className="recipe-card" key={recipe.id}>
                      {recipe.isPublished === false ? (
                        <div className="unpublished">UNPUBLISHED</div>
                      ) : null}
                      <div className="recipe-name">{recipe.name}</div>
                      <div className="recipe-image-box">
                        {recipe.imageUrl ? (
                          <img
                            src={recipe.imageUrl}
                            alt={recipe.name}
                            className="recipe-image"
                          />
                        ) : null}
                      </div>
                      <div className="recipe-field">
                        Category: {lookupCategoryLabel(recipe.category)}
                      </div>
                      <div className="recipe-field">
                        Publish Date: {formatDate(recipe.publishDate)}
                      </div>
                      {user ? (
                        <button
                          className="primary-button edit-button"
                          type="button"
                          onClick={() => handleEditRecipeClick(recipe.id)}
                        >
                          EDIT
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
        {recipes?.length > 0 ? (
          <>
            <label className="input-label">
              Recipes Per Page:
              <select
                value={recipesPerPage}
                onChange={handleRecipesPerPageChange}
                className="select"
              >
                <option value="3">3</option>
                <option value="6">6</option>
                <option value="9">9</option>
              </select>
            </label>
            <div className="pagination">
              <button
                type="buton"
                onClick={handleLoadMoreRecipesClick}
                className="primary-button"
              >
                LOAD MORE RECIPES
              </button>
            </div>
          </>
        ) : null}
        {user ? (
          <AddEditRecipeForm
            existingRecipe={currentRecipe}
            handleUpdateRecipe={handleUpdateRecipe}
            handleEditRecipeCancel={handleEditRecipeCancel}
            handleAddRecipe={handleAddRecipe}
            handleDeleteRecipe={handleDeleteRecipe}
          />
        ) : null}
      </div>
    </div>
  );
}

export default App;
