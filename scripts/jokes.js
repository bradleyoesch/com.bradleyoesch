const TODO_CLASS_NAME = 'todo';
const INVALID_CLASS_NAME = 'invalid';
const KEY_CODE = {
  BACKSPACE: 8,
  ENTER: 13,
  UP: 38,
  DOWN: 40
};

// global state
// be careful with this, could hit race conditions
// TODO: could update to use promises or something to avoid that, probaby won't
const state = {
  idCounter: 0,
  isLoadOpen: false
}

const El = {
  addClass: (el, className) => {
    el.className += ` ${className}`;
  },

  removeClass: (el, className) => {
    el.className = el.className.replace(className, '');
  },

  create: (tag, attributes = {}) => {
    const el = document.createElement(tag);
    Object.keys(attributes).forEach((attr) => {
      el[attr] = attributes[attr];
    });
    return el;
  },

  remove: (el) => {
    el.parentNode.removeChild(el);
  },

  clearById: (id) => {
    const container = document.getElementById(id);
    const hadContent = !!container.innerHTML;
    container.innerHTML = '';
    return hadContent;
  }
};

const Line = {
  previous: (line) => {
    const jokeBlock = line.parentNode;
    if (line !== jokeBlock.firstElementChild) {
      return line.previousElementSibling;
    }

    const previousJokeBlockContainer = jokeBlock.parentNode.previousElementSibling;
    if (previousJokeBlockContainer) {
      const lines = previousJokeBlockContainer.getElementsByClassName('joke-line');
      if (lines.length) {
        return lines[lines.length - 1];
      }
    }

    return null;
  },

  next: (line) => {
    const jokeBlock = line.parentNode;
    if (line !== jokeBlock.lastElementChild) {
      return line.nextElementSibling;
    }

    const nextJokeBlockContainer = jokeBlock.parentNode.nextElementSibling;
    if (nextJokeBlockContainer) {
      const lines = nextJokeBlockContainer.getElementsByClassName('joke-line');
      if (lines.length) {
        return lines[0];
      }
    }

    return null;
  }
}

function addTitleListeners(el) {
  el.addEventListener('keyup', (event) => {
    if (event.keyCode === 13) {
      // enter
      const jokeBlock = createJokeBlock();
      createNewLine(jokeBlock);
    }
  });
}

function addMarginListeners(el) {
  el.addEventListener('mouseenter', (event) => {
    const jokeBlockContainer = el.parentNode;
    El.addClass(jokeBlockContainer, 'active');
    El.addClass(jokeBlockContainer.lastChild, 'active');
  });
  el.addEventListener('mouseleave', (event) => {
    const jokeBlockContainer = el.parentNode;
    El.removeClass(jokeBlockContainer, 'active');
    El.removeClass(jokeBlockContainer.lastChild, 'active');
  });
}

function addLineListeners(el) {
  el.addEventListener('keyup', (event) => {
    if (event.keyCode === KEY_CODE.ENTER) {
      if (el.value === '') {
        const jokeBlock = createJokeBlock(el);
        createNewLine(jokeBlock);
        removeLine(el, false);
      } else {
        insertNewLine(el);
      }
    }
  });
  el.addEventListener('keydown', (event) => {
    if (event.keyCode === KEY_CODE.BACKSPACE && el.value === '') {
      removeLine(el);
    }
    if (event.keyCode === KEY_CODE.UP) {
      const previousLine = Line.previous(el);
      if (previousLine) {
        previousLine.focus()
      }
    }
    if (event.keyCode === KEY_CODE.DOWN) {
      const nextLine = Line.next(el);
      if (nextLine) {
        nextLine.focus()
      }
    }
  });
  el.addEventListener('blur', (event) => {
    El.removeClass(el, TODO_CLASS_NAME);
    if (el.value.indexOf('TODO') > -1) {
      El.addClass(el, TODO_CLASS_NAME);
    }
  });
}

function uniqueId(prefix = '') {
  const id = ++state.idCounter;
  return prefix ? `${prefix}-${id}` :`${id}`;
}

function getJokes() {
  return JSON.parse(localStorage.getItem('jokes') || '{}');
}

function getJoke(title) {
  return getJokes[title];
}

// <div id="js-sortable-joke" class="joke">
//   <div class="joke-block-container sortable">
//     <div class="joke-block-margin sortable"></div>
//     <div id="js-sortable-joke-block" class="joke-block">
//       <input type="text" id="js-initial-input" class="joke-line sortable" />
//       <input type="text" id="js-initial-input" class="joke-line sortable" />
//     </div>
//   </div>
// </div>

/**
 * Creates a new line element at end of and inside of element `el`
 */
function createNewLine(el, value = '', position = 'beforeend') {
  const input = El.create('input', { type: 'text', className: 'joke-line sortable', value: value });
  addLineListeners(input);
  el.insertAdjacentElement(position, input);
  input.focus();
  return input;
}

/**
 * Inserts a new line element after the element `el`
 */
function insertNewLine(el) {
  return createNewLine(el, '', 'afterend');
}

/**
 * Happens virtually immediately but avoids actions
 * e.g. keydown backspace removes line then changes focus,
 * don't want to backspace the newly focused line
 */
function focusOnTimeout(el) {
  setTimeout(() => el.focus());
}

function removeLine(line, focus = true) {
  // must get these before removing line
  const previousLine = Line.previous(line)
  const nextLine = Line.next(line);
  const jokeBlock = line.parentNode;

  El.remove(line);

  if (!jokeBlock.hasChildNodes()) {
    // remove whole block container since nothing left
    El.remove(jokeBlock.parentNode);
  }

  // focus on apprpriate line
  if (focus) {
    if (previousLine) {
      focusOnTimeout(previousLine);
    } else if (nextLine) {
      focusOnTimeout(nextLine);
    }
  }
}

function createJokeBlock(sourceLine) {
  const jokeBlockContainer = El.create('div', { className: 'joke-block-container sortable' });
  const jokeBlockMargin = El.create('div', { className: 'joke-block-margin sortable' });
  addMarginListeners(jokeBlockMargin);
  const jokeBlockId = uniqueId('js-sortable-joke-block');
  const jokeBlock = El.create('div', { id: jokeBlockId, className: 'joke-block' });
  jokeBlockContainer.appendChild(jokeBlockMargin);
  jokeBlockContainer.appendChild(jokeBlock);
  // TODO: handles?
  // https://github.com/SortableJS/Sortable#handle-option
  Sortable.create(jokeBlock, { group: 'jokes' });

  if (sourceLine) {
    // insert after source line block
    const sourceBlockContainer = sourceLine.parentElement.parentElement;
    sourceBlockContainer.insertAdjacentElement('afterend', jokeBlockContainer);
  } else {
    // will have to just add it to end of parent joke itself
    const jokeContainer = document.getElementById('js-sortable-joke');
    jokeContainer.appendChild(jokeBlockContainer);
  }

  return jokeBlock;
}

function saveToStorage(title, groups) {
  const jokes = getJokes();
  jokes[title] = groups;
  localStorage.setItem('jokes', JSON.stringify(jokes));
}

function showOnPage(title, groups) {
  // TODO: generalize for any number of nesting
  const combinedTextarea = document.getElementById('js-combined');
  const values = groups.map((subgroups) => subgroups.join('\n')).join('\n');
  combinedTextarea.value = `${title}\n\n${values}`;
  combinedTextarea.style = '';
}

function validateTitle() {
  const titleInput = document.getElementById('js-title-input');
  const title = titleInput.value.trim();
  El.removeClass(titleInput, INVALID_CLASS_NAME);
  if (title) {
    return title;
  }
  // invalid title, update UI
  El.addClass(titleInput, INVALID_CLASS_NAME);
}

function saveJoke() {
  const title = validateTitle();
  if (!title) {
    return;
  }

  const jokeBlocks = Array.from(document.getElementsByClassName('joke-block'));
  const blocks = jokeBlocks.map((jokeBlock) => {
    return Array.from(jokeBlock.getElementsByClassName('joke-line'))
        .map((line) => line.value.trim())
        .filter(Boolean);
  })

  saveToStorage(title, blocks);
  showOnPage(title, blocks);
}

function loadJoke(title) {
  El.clearById('js-sortable-joke');
  El.clearById('js-title-buttons');

  // reset global counter since importing is effectively a global reset
  state.idCounter = 0;
  document.getElementById('js-title-input').value = title;
  const blocks = getJokes()[title];
  blocks && blocks.forEach((block) => {
    // TODO: generalize for any number of nesting
    const jokeBlock = createJokeBlock();
    block.forEach((value) => {
      createNewLine(jokeBlock, value);
    })
  });
  // scroll top top since some jokes could be long and we want to see first line
  window.scrollTo(0, 0);
  // flip state for next func call
  state.isLoadOpen = !state.isLoadOpen;
}

function loadOptions() {
  const container = document.getElementById('js-title-buttons');
  container.innerHTML = '';

  if (!state.isLoadOpen) {
    const jokes = getJokes();
    Object.keys(jokes).sort().forEach((title) => {
      const jokeButton = El.create('button', { textContent: title, className: 'title-button' });
      jokeButton.onclick = () => loadJoke(title);
      container.appendChild(jokeButton);
    });
  }
  // flip state for next func call
  state.isLoadOpen = !state.isLoadOpen;
}
