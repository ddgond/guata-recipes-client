import './App.css';
import {useEffect, useState} from "react";
import {Tooltip} from "@mui/material";
import {Autocomplete} from "@mui/material";
import {TextField} from "@mui/material";

const recursiveHighlight = (phrase, keywords, highlightFunction) => {
  if (keywords.length === 0) {
    return phrase;
  }
  const keyword = keywords[0];
  return phrase.split(keyword).map(sub=>recursiveHighlight(sub, keywords.slice(1), highlightFunction)).reduce((prev, cur) => [prev, highlightFunction(keyword), cur]);
};

function App() {
  const [ingredientHighlight, setIngredientHighlight] = useState(false);
  const [stepHighlight, setStepHighlight] = useState([]);
  const [activeRecipe, setActiveRecipe] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    fetch('/api').then(response => {
      response.json().then(data => {
        setRecipes(data.recipes);
      })
    })
  }, []);

  const ingredients = recipes.reduce((prev, recipe) => prev.concat(recipe.ingredients), []);
  const keywords = ingredients.reduce((prev, ingredient) => prev.concat(ingredient.keywords), []);
  let tags = recipes.reduce((prev, recipe) => prev.concat(recipe.tags), []);
  tags = tags.filter((tag,i) => tags.indexOf(tag) === i);

  const getIngredientByKeyword = (keyword) => {
    return activeRecipe.ingredients.find(ingredient => ingredient.keywords.includes(keyword));
  }

  const linkToHighlight = (phrase) => {
    return <Tooltip
        key={phrase}
        title={getIngredientByKeyword(phrase).entry}
        placement={'top'}
        arrow
        disableInteractive>
      <span
        className='underline'
        onMouseEnter={() => setIngredientHighlight(phrase)}
        onMouseLeave={() => setIngredientHighlight(false)}
      >
        {phrase}
      </span>
    </Tooltip>
  }

  let filteredRecipes = recipes.filter(recipe => {
    if (selectedTags.length === 0) {
      return true
    }
    return selectedTags.every(selectedTag => recipe.tags.includes(selectedTag));
  });
  filteredRecipes = filteredRecipes.sort((a,b) => a.name.localeCompare(b.name));

  const getTagMatchCount = (tag) => {
    return filteredRecipes.filter(recipe => recipe.tags.includes(tag)).length;
  }

  const sortIngredientsByStepIndex = (ingredients) => {
    return ingredients.sort((a,b) => {
      const getStepIndex = (ingredient) => {
        return activeRecipe.steps.findIndex(step => ingredient.keywords.some(keyword => step.text.includes(keyword)))
      }
      return getStepIndex(a) - getStepIndex(b);
    });
  }

  let selectableTags = filteredRecipes.reduce((prev, recipe) => prev.concat(recipe.tags), []);
  selectableTags = selectableTags.filter((tag,i) => selectableTags.indexOf(tag) === i);
  selectableTags = selectableTags.sort((a,b) => a.localeCompare(b));
  selectableTags = selectableTags.sort((a,b) => getTagMatchCount(b) - getTagMatchCount(a));

  return (
    <div className="App">
      <div className="recipeList">
        <Autocomplete
          multiple
          filterSelectedOptions
          options={selectableTags}
          getOptionLabel={tag => `${tag} (${getTagMatchCount(tag)})`}
          onChange={(event, value) => setSelectedTags(value)}
          renderInput={params => (
            <TextField
              {...params}
              variant="standard"
              label="Filter"
            />
          )}>
        </Autocomplete>
        {filteredRecipes.map(recipe =>
            <div key={recipe.name} className={`recipeListItem ${activeRecipe.name === recipe.name && 'selected'}`} onMouseDown={() => setActiveRecipe(activeRecipe.name !== recipe.name && recipe)}>
              {recipe.name}
            </div>
        )}
      </div>
      {activeRecipe &&
        <>
          <div className="recipeHeader" key={activeRecipe.name}>
            <h1>{activeRecipe.name}</h1>
            <p>{activeRecipe.description}</p>
            <p>Serves: {activeRecipe.serves}</p>
            <p>Tags: {activeRecipe.tags.map(tag=>selectedTags.includes(tag) ? <b>{tag}</b> : tag).reduce((prev, tag)=>[prev, ', ', tag])}</p>
          </div>
          <div className="recipeBodyBackground"></div>
          <div className="ingredients">
            {sortIngredientsByStepIndex(activeRecipe.ingredients).map(ingredient =>
                <p
                    key={ingredient.entry}
                    className={ingredient.keywords.includes(ingredientHighlight) && 'highlight'}
                    onMouseEnter={() => setStepHighlight(ingredient.keywords)}
                    onMouseLeave={() => setStepHighlight([])}
                >
                  • {ingredient.entry}
                </p>
            )}
          </div>
          <div className="steps">
            {activeRecipe.steps.map((step, i) => {
              const keywords = activeRecipe.ingredients.reduce((prev, ingredient) => prev.concat(ingredient.keywords), [])
              return <p
                  key={i}
                  className={stepHighlight.some(keyword => step.text.includes(keyword)) && 'highlight'}
              >
                {i+1}) {recursiveHighlight(step.text, keywords, linkToHighlight)}
              </p>
            })}
          </div>
        </>
      }
    </div>
  );
}

export default App;
