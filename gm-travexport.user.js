// ==UserScript==
// @name         travExport
// @namespace    https://github.com/soborg/travExport
// @description  Export your notes from a Traverse (Mandarin Blueprint) deck to JSON
// @author			 soborg
// @version      0.8
// @grant        unsafeWindow
// @match        https://traverse.link/*
// ==/UserScript==

// Version history
//
// 0.8   (2023-12-04): E-button should now be visible in flashbang-mode
//                     Script should now work in Chrome/Chromium-based browsers (only tested on Chrome).
//
//
// 0.7   (2023-12-04): export button is now a nice subtle E in the top right corner.
//
//
// 0.6   (2023-12-04): possibly fix an issue where the export button would appear on the review modal during reviews.
//                     save the deck title on each card.
//
//
// 0.5   (2023-12-04): a whole lot of cleanup for the final cards.
//                     Review/visit/and other Traverse specific fields are removed
//                     Usable fields are moved to a higher level in the json fields.
//                     Some fields are parsed to be more readable (for both human and machine):
//                     - lists of audio file links, list of tags, etc.
//                     - props/actors/etc. are stored by key instead of text-blobs
//                     - highlighted words in sentences are extracted and stored separately
//
//
// 0.4   (2023-11-12): nullify some more fields from the exported cards.
//
//
// 0.3   (2023-11-05): The downloaded file derives the name from the current deck.
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
              var card = {...unsafeWindow.elm[key].child.pendingProps.children.props.data.card}; // perform a shallow copy of the object
              // remove a lot of irrelevant fields
              delete card.user;
              delete card.graphInfo;
              delete card.cardUserLoaded;
              delete card.isDummy;
              card.deckTitle = card.topicCard.title; // save the title for toplevel
              delete card.topicCard;             // then kill it, as it is recursive
              delete card.templateRebuildTime;
              delete card.allowDuplicate;
              delete card.free;

              for (var u in card.users) {
                if (u === 'Mandarin_Blueprint') {
                	card.fields = {...card.users[u].fields};
                  // a whole lot of cleanup
                  if (card.fields.Sentence) {
                    card.fields['Highlights'] = [];
                    var sentsplit = card.fields.Sentence.split('==');
                    for (var spl in sentsplit) {
                      if (spl % 2 == 1) {
                        var w = sentsplit[spl];
                        if (card.fields['Highlights'].indexOf(w) < 0) {
                       	  card.fields['Highlights'].push(sentsplit[spl]);
                        }
                      }
                    }
                  }
                  if (card.fields["Top-Down Word(s)"]) {
                    card.fields["Top-Down Word(s)"] = card.fields["Top-Down Word(s)"].replaceAll('&nbsp;', '').split('\n')
                  }
                  if (card.fields.Tags) {
                    card.fields.Tags = card.fields.Tags.split('\n');
                  }
                  if (card.fields.Audio) {
                  	card.fields.Audio = card.fields.Audio.replaceAll('&nbsp;', '').split('\n').filter((x) => x.replaceAll(' ', '').length > 5);
                  }
                  if (card.fields.AUDIO) {
                  	card.fields.AUDIO = card.fields.AUDIO.replaceAll('&nbsp;', '').split('\n').filter((x) => x.replaceAll(' ', '').length > 5);
                  }
                  if (card.fields.Links) {
                    var link_map = {};
                    var splitvalues = card.fields.Links.replaceAll('&nbsp;', '').split('**')
                    var prev_key = null;

                    for (splitidx in splitvalues) {
                      var splitvalue = splitvalues[splitidx].replaceAll(' ', '').replaceAll('\n', '').replaceAll(':', '');
                      if (splitvalue.length == 0) {
                        continue;
                      }
                      else if (prev_key != null && prev_key.length > 0) {
                        if (prev_key == 'Prop(s)') {
                          splitvalue = splitvalue.split(',');
                        }
                        link_map[prev_key] = splitvalue;
                        prev_key = null;
                        continue
                      } else {
                        prev_key = splitvalue.replaceAll(' ', '');
                      }
                    }
                    card.fields.Links = link_map;
                  }
                } else {
                  card.user_fields = {...card.users[u].fields};
                }
              }
              delete card.users;
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
        // apparently, some of the elements are functions and stuff, that does not have a 'getAttribute' function... soooooooooo, ignore (TODO: make better instead of try-catch)
        ;
   		}
    }
    var filename = document.getElementsByClassName('text-lg text-black')[0].textContent.replaceAll(' ', '');
   	download(filename + '.json', cards);
  };

  function expand(deck) {
    try {
    	deck.click();
    }
    catch {
      console.log('obj has no click function: ', deck);
    }
  };

  function expandTopicDecks() {
    var decks = document.getElementsByClassName("react-flow__node react-flow__node-groupNode selectable parent");
    for (var i in decks) {
      var deck = decks[i];
      window.setTimeout(expand, 1000*i, deck);
    }
  };

  function createDownloadButton() {
    var button = document.createElement('button');
    button.setAttribute('class', 'homescreen-button');
    button.addEventListener("click", collectAndDownloadCards, false);
    var span = document.createElement('span');
    span.textContent = "E";
    span.setAttribute("title", "Export the current level to JSON");
    span.setAttribute("class", "text-gray-800");
    console.debug("appending span");
    button.appendChild(span);
    var toolbar = document.getElementsByClassName('MuiToolbar-regular')[0];
    var anchor = toolbar.getElementsByClassName('homescreen-button')[0].parentNode;
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
//      console.log("yay");
    } else {
      unsafeWindow.we_are_there = false;
//      console.log("nay");
    }
  }

  window.setInterval(areWeThereYet, 5000); // occasional check to see if we're in the right spot

})();
