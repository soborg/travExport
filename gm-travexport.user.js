// ==UserScript==
// @name         travExport
// @namespace    https://github.com/soborg/travExport
// @description  Download notes and stuff from a Traverse deck
// @author			 soborg
// @version      0.2
// @grant        none
// @match        https://traverse.link/*
// ==/UserScript==

// Version history
//
//
// 0.2   (2023-10-29): Fix an issue where the export button would not appear
//                     across page navigations.
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
    if (document.location.href.indexOf('/Mandarin_Blueprint/') < 0) {
      alert("You must navigate to a deck/level to download");
      return;
    }

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
    var filename = document.getElementsByClassName('text-lg text-black')[0].textContent.replaceAll(' ', '');
   	download(filename + '.json', cards);
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

  unsafeWindow.we_are_there = false;
  function areWeThereYet() {
    if (document.location.href.indexOf("/Mandarin_Blueprint/") > 0) {
      if (!unsafeWindow.we_are_there) {
        createDownloadButton();
        unsafeWindow.we_are_there = true;
      }
//      console.debug("yay");
    } else {
      unsafeWindow.we_are_there = false;
//      console.debug("nay");
    }
  }

  window.setInterval(areWeThereYet, 5000); // occasional check to see if we're in the right spot

})();
