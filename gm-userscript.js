// ==UserScript==
// @name         travExport
// @namespace    https://github.com/soborg/travExport
// @description  Download notes and stuff from a Traverse deck
// @author			 soborg
// @version      0.1
// @grant        none
// @match        https://traverse.link/Mandarin_Blueprint/*
// ==/UserScript==

// Version history
//
//
//
// 0.1   (2023-10-29): Initial working version.
//                     User is expected to expand all subdecks manually,
//                     in order to render the cards to be exported.
//
//



(function() {

  //    window.formatTopicCards = function(obj) { obj.topicCards.map( (x) => { x.user = null; x.graphInfo = null; x.topicCard = null; })};

  download = function(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(text)));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  collectAndDownloadCards = function() {
    var cards = [];
    var topics = document.getElementsByClassName('react-flow__node react-flow__node-groupNode selectable');

    // TODO: expand parent decks to render the cards themselves

    for (idx in topics) {
      // filter out parents
      var elm = topics[idx];
      try {
        if (elm.getAttribute('class').indexOf('parent') > 0) {
          console.debug('object is a parent of sort, skipping');
        } else {
          unsafeWindow.elm = elm;  // storing the element on the unsafeWindow exposes the internal React properties so we can access the nested card data
          for (jdx in Object.keys(unsafeWindow.elm)) {
            var key = Object.keys(unsafeWindow.elm)[jdx];
            if (key.startsWith('__reactFiber')) {
              var card = {...unsafeWindow.elm[key].child.pendingProps.children.props.data.card};
              card.user = null;
              card.graphInfo = null;
              card.topicCard = null;
              cards.push(card);
              break;
            }
            else {
              console.warning('reactFiber could not be found in element: ', elm);
            }
          }
        }
      }
      catch {
        // apparently, some of the elements are functions and stuff that does not have a 'getAttribute' function... soooooooooo, ignore (TODO: make better instead of try-catch)
        ;
   		}
    }
    // fix the filename of the title, maybe use this element:
    // <div class="text-lg text-black mr-1 select-none cursor-pointer">Level 39 - Intermediate</div>
    //
   	download('card.json', cards);
  };

  function createDownloadButton() {
    var button = document.createElement('button');
    button.setAttribute('class', 'homescreen-button');
    button.addEventListener("click", collectAndDownloadCards, false);
    var span = document.createElement('span');
    span.textContent = "travExport";
    console.debug("appending span");
    button.appendChild(span);

    var anchor = document.getElementsByClassName('homescreen-button')[0].parentNode;
    anchor.appendChild(button);
    console.debug('download button created');
  };

  window.setTimeout(createDownloadButton, 4000);
})();
