import './App.css';
import {useEffect, useState} from "react";
import {useParams, useNavigate, Link} from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import {Divider, Button, Collapse, Chip, Checkbox, FormGroup, FormControlLabel, InputAdornment, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Alert, AlertTitle, Tooltip, Autocomplete, TextField} from "@mui/material";
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import AddIcon from '@mui/icons-material/Add';
import BookIcon from '@mui/icons-material/Book';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MenuIcon from "@mui/icons-material/MenuOutlined";
import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import CancelIcon from '@mui/icons-material/Cancel';
import {Drawer} from "@mui/material";
import Linkify from 'react-linkify';

const recursiveHighlight = (phrase, keywords, highlightFunction) => {
  if (keywords.length === 0) {
    return phrase;
  }
  const keyword = keywords[0];
  return phrase.split(keyword).map(sub=>recursiveHighlight(sub, keywords.slice(1), highlightFunction)).reduce((prev, cur) => [prev, highlightFunction(keyword), cur]);
};

const toSlug = (name) => {
  return name.replaceAll(' ', '-').toLowerCase();
}

function App() {
  const [ingredientHighlight, setIngredientHighlight] = useState(false);
  const [stepHighlight, setStepHighlight] = useState([]);
  const [mode, setMode] = useState('view');
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [password, setPassword] = useState('');
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeDescription, setNewRecipeDescription] = useState('');
  const [newRecipeServes, setNewRecipeServes] = useState('');
  const [newRecipeTags, setNewRecipeTags] = useState([]);
  const [newRecipeIngredients, setNewRecipeIngredients] = useState([{entry:'', keywords: []}]);
  const [newRecipeSteps, setNewRecipeSteps] = useState([{text: '', isHeading: false}]);
  const [isSubmittingRecipe, setIsSubmittingRecipe] = useState(false);
  const [isDeletingRecipe, setIsDeletingRecipe] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [debug, setDebug] = useState('');
  const {recipeSlug} = useParams();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const isNarrow = useMediaQuery('(max-width:1000px)');

  const activeRecipe = (recipeSlug && recipes.find(recipe => toSlug(recipe.name) === toSlug(recipeSlug))) || null;

  useEffect(() => {
    fetch('/api').then(response => {
      response.json().then(data => {
        setRecipes(data.recipes);
      })
    })
  }, []);

  if (debug !== '') {
    setTimeout(() => setDebug(''), 10000);
  }

  const updateNewIngredients = () => {
    const update = newRecipeIngredients.map(ingredient => {return {
      entry: ingredient.entry,
      keywords: [...ingredient.keywords]
    }});
    setNewRecipeIngredients(update);
  }

  const updateNewSteps = () => {
    setNewRecipeSteps(newRecipeSteps.map(step => {return {text: step.text, isHeading: step.isHeading}}));
  }

  const resetRecipe = () => {
    setNewRecipeName('');
    setNewRecipeDescription('');
    setNewRecipeServes('');
    setNewRecipeTags([]);
    setNewRecipeIngredients([{entry:'', keywords: []}]);
    setNewRecipeSteps([{text:'', isHeading: false}]);
  }

  const createRecipe = () => {
    resetRecipe();
    setMode('create');
    navigate('/');
  }

  const editRecipe = (recipe) => {
    setNewRecipeName(recipe.name);
    setNewRecipeDescription(recipe.description);
    setNewRecipeServes(recipe.serves);
    setNewRecipeTags([...recipe.tags]);
    setNewRecipeIngredients(recipe.ingredients.map(ingredient => {return {entry: ingredient.entry, keywords: [...ingredient.keywords]}}));
    setNewRecipeSteps(recipe.steps.map(step => {return {text: step.text, isHeading: step.isHeading}}));
    setMode('edit');
  }

  const deleteRecipe = (recipe) => {
    setIsDeletingRecipe(true);
    recipe.password = password;
    fetch(`/api/recipe/${recipe.name}`, {
      method: 'DELETE',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify(recipe)
    }).then(res => {
      if (res.status === 200) {
        return res.json().then(data => {
          recipes.splice(recipes.findIndex(oldRecipe => oldRecipe.name === recipe.name), 1);
          setRecipes([...recipes]);
          resetRecipe();
          setMode('view');
          navigate('');
        })
      } else {
        res.text().then(data => {
          setDebug(data);
        })
      }
    }).catch(err => {
      setDebug(err);
    }).finally(() => {
      setIsDeletingRecipe(false);
      setDeleteWarningOpen(false);
    });
  }

  const submitRecipe = () => {
    const newRecipe = {
      name: newRecipeName,
      description: newRecipeDescription,
      serves: newRecipeServes,
      tags: newRecipeTags,
      ingredients: newRecipeIngredients,
      steps: newRecipeSteps,
      password: password,
      edit: mode === 'edit',
      previousName: mode === 'edit' ? activeRecipe.name : undefined
    };
    setIsSubmittingRecipe(true);
    fetch('/api/recipe', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify(newRecipe)
    }).then(res => {
      if (res.status === 200) {
        return res.json().then(data => {
          if (newRecipe.edit) {
            recipes.splice(recipes.findIndex(recipe => recipe.name === newRecipe.previousName), 1);
          }
          recipes.push(data);
          setRecipes([...recipes]);
          navigate(`/${toSlug(data.name)}`);
          setMode('view');
        })
      } else {
        res.text().then(data => {
          setUploadError(data);
        })
      }
    }).catch(err => {
      setDebug(err);
    }).finally(() => {
      setIsSubmittingRecipe(false);
    });
  }

  const ingredients = recipes.reduce((prev, recipe) => prev.concat(recipe.ingredients), []);
  const keywords = ingredients.reduce((prev, ingredient) => prev.concat(ingredient.keywords), []);
  let tags = recipes.reduce((prev, recipe) => prev.concat(recipe.tags), []);
  tags = tags.filter((tag,i) => tags.indexOf(tag) === i);
  tags = tags.sort((a,b) => a.localeCompare(b));

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
        onPointerEnter={() => setIngredientHighlight(phrase)}
        onPointerLeave={() => setIngredientHighlight(false)}
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
      const hasStep = (ingredient) => {
        return activeRecipe.steps.filter(step => !step.isHeading).some(step => ingredient.keywords.some(keyword => matchKeyword(step.text, keyword)))
      }
      const getStep = (ingredient) => {
        return activeRecipe.steps.filter(step => !step.isHeading).find(step => ingredient.keywords.some(keyword => matchKeyword(step.text, keyword)))
      }
      const getStepIndex = (ingredient) => {
        return activeRecipe.steps.indexOf(getStep(ingredient));
      }
      const getKeywordIndex = (ingredient) => {
        return ingredient.keywords.map(keyword => getStep(ingredient).text.indexOf(keyword))
          .filter(index => index > -1)
          .reduce((prev, curr) => Math.min(prev, curr), 999999);
      }
      if (!hasStep(a) && !hasStep(b)) {
        return 0;
      }
      if (hasStep(a) && !hasStep(b)) {
        return 1;
      }
      if (!hasStep(a) && hasStep(b)) {
        return -1;
      }
      if (getStepIndex(a) === getStepIndex(b)) {
        return getKeywordIndex(a) - getKeywordIndex(b);
      }
      return getStepIndex(a) - getStepIndex(b);
    });
  }

  const matchKeyword = (text, keyword) => {
    const keywordList = activeRecipe.ingredients.reduce((prev, curr) => prev.concat(curr.keywords), []);
    const getKeywordRange = (t, k) => {
      return {start: t.indexOf(k), end: t.indexOf(k) + k.length};
    };
    const keywordRange = getKeywordRange(text, keyword);
    if (keywordRange.start === -1) {
      return false;
    }
    const doesRangeOverlap = (a, b) => {
      return (a.start >= b.start && a.start < b.end) || (a.end > b.start && a.end <= b.end) || (a.start <= b.start && a.end >= b.end);
    };
    const biggerOverlappingKeyword = keywordList.find(otherKeyword => {
      const otherKeywordRange = getKeywordRange(text, otherKeyword);
      if (otherKeywordRange.start === -1) {
        return false;
      }
      return doesRangeOverlap(keywordRange, otherKeywordRange) && otherKeyword.length > keyword.length;
    });
    return !biggerOverlappingKeyword;
  }

  let selectableTags = filteredRecipes.reduce((prev, recipe) => prev.concat(recipe.tags), []);
  selectableTags = selectableTags.filter((tag,i) => selectableTags.indexOf(tag) === i);
  selectableTags = selectableTags.sort((a,b) => a.localeCompare(b));
  selectableTags = selectableTags.sort((a,b) => getTagMatchCount(b) - getTagMatchCount(a));

  const recipeListElement = <div className="recipeList">
    <br/>
    <div className={`recipeListItem ${mode === 'create' ? 'selected' : ''}`}
         onMouseDown={() => {
           setMenuOpen(false);
           mode === 'create' ? setMode('view') : createRecipe();
         }}>
      + New Recipe +
    </div>
    <Divider/>
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
          label="Filter by tag"
        />
      )}>
    </Autocomplete>
    {filteredRecipes.map(recipe =>
      <Link key={recipe.name}
            to={activeRecipe && activeRecipe.name === recipe.name && (mode === 'view' || mode === 'edit') ? '' : `/${toSlug(recipe.name)}`}
            style={{textDecoration: 'none', color: 'inherit'}}>
        <div
          className={`recipeListItem ${activeRecipe && activeRecipe.name === recipe.name && (mode === 'view' || mode === 'edit') ? 'selected' : ''}`}
          onMouseDown={() => {
            setMode('view');
            setMenuOpen(false);
          }}>
          {recipe.name}
        </div>
      </Link>
    )}
  </div>

  return (
    <div className="App">
      {JSON.stringify(debug).length > 2 &&
        <div style={{position: 'fixed', bottom: '0', left: '0'}}>
          {JSON.stringify(debug)}
        </div>
      }
      {isNarrow ?
        <>
          <Drawer
            anchor='left'
            open={menuOpen || (!activeRecipe && mode === 'view')}
            onClose={toggleMenu}
            style={{overflowX: 'hidden'}}
          >{recipeListElement}</Drawer>
        </>
        :
        recipeListElement
      }
      {activeRecipe && mode === 'view' &&
        <>
          <Linkify>
            <div className="recipeHeader">
              {
                isNarrow ?
                <Button
                  variant="contained"
                  onClick={toggleMenu}
                >
                  <MenuIcon/>
                </Button>
                  :
                <></>
              }
              <h1>{activeRecipe.name}</h1>
              <p>{activeRecipe.description}</p>
              <p>Serves: {activeRecipe.serves}</p>
              <p>Tags: {activeRecipe.tags.map(tag=>selectedTags.includes(tag) ? <b>{tag}</b> : tag).reduce((prev, tag)=>[prev, ', ', tag])}</p>
              <Button
                color="primary"
                aria-label="submit"
                variant="outlined"
                onClick={() => editRecipe(activeRecipe)}
              >
                <EditIcon/> Edit Recipe
              </Button>
              <Button
                sx={{marginLeft: '10px'}}
                color="error"
                aria-label="delete"
                variant="outlined"
                onClick={() => setDeleteWarningOpen(true)}
              >
                <DeleteIcon/> Delete Recipe
              </Button>
              <Dialog
                open={deleteWarningOpen}
                onClose={() => setDeleteWarningOpen(false)}
              >
                <DialogTitle>
                  {"Are you sure you wish to delete this recipe?"}
                </DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    Deleting a recipe cannot be undone.
                  </DialogContentText>
                  <TextField
                    variant="outlined"
                    margin="normal"
                    value={password}
                    type='password'
                    onChange={e => setPassword(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Auth Password:</InputAdornment>,
                    }}
                    size="small"
                  />
                </DialogContent>
                <DialogActions>
                  <Button variant="outlined" color="info" onClick={() => setDeleteWarningOpen(false)}>Cancel</Button>
                  {isDeletingRecipe ?
                    <Button variant="outlined">
                      Deleting recipe...
                    </Button>
                    :
                    <Button variant="outlined" onClick={() => {
                      deleteRecipe(activeRecipe);
                    }} color="error">
                      Delete
                    </Button>
                  }
                </DialogActions>
              </Dialog>
              <br/>
              <br/>
            </div>
          </Linkify>
          <div className="recipeBodyBackground"/>
          <div className="ingredients">
            <h2>Ingredients</h2>
            {sortIngredientsByStepIndex(activeRecipe.ingredients).map(ingredient =>
                <p
                    key={ingredient.entry}
                    className={ingredient.keywords.includes(ingredientHighlight) && 'highlight'}
                    onPointerEnter={() => setStepHighlight(ingredient.keywords)}
                    onPointerLeave={() => setStepHighlight([])}
                >
                  • {ingredient.entry}
                </p>
            )}
          </div>
          <div className="steps">
            <h2>Steps</h2>
            {activeRecipe.steps.map((step, i) => {
              const priorHeadingCount = activeRecipe.steps.slice(0, i).filter(step => step.isHeading).length;
              const keywords = activeRecipe.ingredients.reduce((prev, ingredient) => prev.concat(ingredient.keywords), [])
                .sort((a,b) => {
                  return b.length - a.length;
                });
              return step.isHeading ?
                <h3 key={i}>
                  {step.text}
                </h3>
                :
                <p
                  key={i}
                  className={stepHighlight.some(keyword => matchKeyword(step.text, keyword)) ? 'highlight' : ''}
                >
                  {i+1 - priorHeadingCount}) {recursiveHighlight(step.text, keywords, linkToHighlight)}
                </p>
            })}
          </div>
        </>
      }
      {(mode === 'create' || mode === 'edit') &&
        <>
          <div className="recipeHeader">
            <br/>
            <div>
              <TextField
                variant="outlined"
                margin="normal"
                value={password}
                type='password'
                onChange={e => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Auth Password:</InputAdornment>,
                }}
                size="small"
              />
            </div>
            <div>
              <TextField
                variant="outlined"
                margin="normal"
                value={newRecipeName}
                onChange={e => setNewRecipeName(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Recipe Title:</InputAdornment>,
                }}
                size="small"
              />
            </div>
            <div>
              <TextField
                className="wideCreationInput"
                variant="outlined"
                margin="normal"
                multiline
                value={newRecipeDescription}
                onChange={e => setNewRecipeDescription(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Recipe Description:</InputAdornment>,
                }}
                size="small"
              />
            </div>
            <div>
              <TextField
                placeholder="Input a number"
                variant="outlined"
                margin="normal"
                value={newRecipeServes}
                onChange={e => setNewRecipeServes(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Serves:</InputAdornment>,
                }}
                size="small"
              />
            </div>
            <div>
              <Autocomplete
                className="narrowCreationInput"
                multiple
                value={newRecipeTags}
                options={tags}
                freeSolo
                // convert text to chip on focus loss
                onBlur={(event) => {
                  if (event.target.value && !newRecipeTags.includes(event.target.value)) {
                    setNewRecipeTags([...newRecipeTags, event.target.value]);
                  }
                }}
                onChange={(event, value) => setNewRecipeTags(value)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Tags"
                    placeholder="Set at least one tag for filtering"
                  />
                )}
              />
            </div>
            <br/>
            <Divider/>
            <div>
              <h2>Ingredients</h2>
              {newRecipeIngredients.map((newIngredient,i) =>
                <div key={i}>
                  <TextField
                    className="narrowCreationInput"
                    multiline
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Ingredient {i+1}:</InputAdornment>,
                    }}
                    variant="outlined"
                    margin="normal"
                    // When pasting a recipe with multiple ingredients, split newlines into separate ingredients
                    onPaste={(e) => {
                      const pastedText = e.clipboardData.getData('text');
                      const pastedIngredients = pastedText.split('\n').filter(ingredient => ingredient.trim() !== '').map(ingredient => ingredient.trim());
                      if (pastedIngredients.length === 1) {
                        return;
                      }
                      e.preventDefault();
                      // Remove the ingredient number from the front of the ingredient text (i.e. "1. ", "1) ", "(1) ", etc.) but only remove "." if a space after
                      const ingredientPrefixRegex = /^([•*-]|\(?\d+[.)])\W+/;
                      pastedIngredients.forEach((ingredient, i) => {
                        if (ingredientPrefixRegex.test(ingredient)) {
                          pastedIngredients[i] = ingredient.replace(ingredientPrefixRegex, '');
                        }
                      });
                      if (e.target.value) {
                        // Add new ingredients after the current ingredient
                        newRecipeIngredients.splice(i+1, 0, ...pastedIngredients.map(ingredient => ({entry: ingredient, keywords: []})));
                      } else {
                        newRecipeIngredients.splice(i, 1, ...pastedIngredients.map(ingredient => ({entry: ingredient, keywords: []})));
                      }
                      updateNewIngredients();
                    }}
                    value={newIngredient.entry}
                    onChange={e => {newIngredient.entry = e.target.value; updateNewIngredients()}}
                  />
                  <Autocomplete
                    style={{display:'inline-block',marginLeft:'20px'}}
                    className="narrowCreationInput"
                    multiple
                    value={newIngredient.keywords}
                    options={[]}
                    freeSolo
                    // convert text to chip on focus loss
                    onBlur={(event) => {
                      if (event.target.value && !newIngredient.keywords.includes(event.target.value)) {
                        newIngredient.keywords.push(event.target.value);
                        updateNewIngredients();
                      }
                    }}
                    onChange={(event, value) => {newIngredient.keywords = value; updateNewIngredients()}}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Keywords"
                        placeholder="Set at least one keyword for highlighting"
                      />
                    )}
                  />
                  {newRecipeIngredients.length > 1 && <RemoveCircleOutlineOutlinedIcon onClick={() => {newRecipeIngredients.splice(i,1); updateNewIngredients();}}/>}
                </div>)}
                <div>
                  <AddCircleOutlineOutlinedIcon onClick={() => {newRecipeIngredients.push({entry:'', keywords:[]}); updateNewIngredients();}}/>
                </div>
            </div>
            <br/>
            <Divider/>
            <div>
              <h2>Steps</h2>
              {newRecipeSteps.map((newStep,i) =>
                <div key={i}>
                  <TextField
                    className="mediumCreationInput"
                    multiline
                    variant="outlined"
                    margin="normal"
                    value={newStep.text}
                    // When pasting a recipe with multiple steps, split newlines into separate steps
                    onPaste={e => {
                      const pastedText = e.clipboardData.getData('text');
                      const pastedSteps = pastedText.split('\n').filter(step => step.trim() !== '').map(step => step.trim());
                      if (pastedSteps.length === 1) {
                        return;
                      }
                      e.preventDefault();
                      // Remove the step number from the front of the step text (i.e. "1. ", "1) ", "(1) ", etc.)
                      const stepPrefixRegex = /^([•*-]|\(?\d+[.)])\W+/;
                      pastedSteps.forEach((step, i) => {
                        if (stepPrefixRegex.test(step)) {
                          pastedSteps[i] = step.replace(stepPrefixRegex, '');
                        }
                      });
                      newRecipeSteps.splice(i, 1, ...pastedSteps.map(step => ({text:step, isHeading:false})));
                      updateNewSteps();
                    }}
                    onChange={e => {
                      newStep.text = e.target.value; updateNewSteps()
                    }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Step {i+1}:</InputAdornment>,
                    }}
                  />
                  <FormGroup sx={{display:'inline-block'}}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={newStep.isHeading}
                          onChange={e => {
                            newStep.isHeading = e.target.value === 'on';
                            updateNewSteps();
                          }}
                        />
                      }
                      label='Heading'
                      labelPlacement='bottom'
                    />
                  </FormGroup>
                  {i > 0 && <ArrowCircleUpIcon onClick={() => {newRecipeSteps.splice(i, 1); newRecipeSteps.splice(i-1, 0, newStep); updateNewSteps();}}/>}
                  {newRecipeSteps.length > 1 && <RemoveCircleOutlineOutlinedIcon onClick={() => {newRecipeSteps.splice(i,1); updateNewSteps();}}/>}
                  {i < newRecipeSteps.length - 1 && <ArrowCircleDownIcon onClick={() => {newRecipeSteps.splice(i, 1); newRecipeSteps.splice(i+1, 0, newStep); updateNewSteps();}}/>}
                </div>)}
              <div>
                <AddCircleOutlineOutlinedIcon onClick={() => {newRecipeSteps.push({text:'', isHeading: false}); updateNewSteps();}}/>
              </div>
            </div>
            <br/>
            {isSubmittingRecipe ?
              <Button
                aria-label="submitting"
                variant="outlined"
              >
                <AddIcon/> Uploading Recipe
              </Button>
              :
              mode === 'edit' ?
                <Button
                  color="primary"
                  aria-label="submit"
                  variant="outlined"
                  onClick={submitRecipe}
                >
                  <BookIcon/> Save Changes
                </Button>
              :
                <Button
                  color="primary"
                  aria-label="submit"
                  variant="outlined"
                  onClick={submitRecipe}
                >
                  <AddIcon/> Add Recipe
                </Button>
            }
            <Button
              color='info'
              aria-label="cancel"
              variant="outlined"
              sx={{marginLeft:'10px'}}
              onClick={() => {resetRecipe(); setMode('view');}}
            >
              <CancelIcon/> Cancel
            </Button>
            <br/>
            <br/>
            <Collapse in={uploadError.length > 0}>
              <Alert
                className="narrowCreationInput"
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={() => setUploadError('')}>
                    DISMISS
                  </Button>
                }
              >
                <AlertTitle>Error</AlertTitle>
                {uploadError}
              </Alert>
            </Collapse>
            <br/>
            <br/>
          </div>
        </>
      }
    </div>
  );
}

export default App;
