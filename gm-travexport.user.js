// ==UserScript==
// @name         travExport
// @namespace    https://github.com/soborg/travExport
// @description  Download notes and stuff from a Traverse deck
// @author			 soborg
// @version      0.5
// @grant        none
// @match        https://traverse.link/*
// ==/UserScript==

// Version history
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
              var card = {...unsafeWindow.elm[key].child.pendingProps.children.props.data.card}; // perform a shallow copy of the object
              // remove a lot of irrelevant fields
              delete card.user;
              delete card.graphInfo;
              delete card.cardUserLoaded;
              delete card.isDummy;
              delete card.topicCard;
              delete card.templateRebuildTime;
              delete card.allowDuplicate;
              delete card.free;
              
              for (var u in card.users) {
                delete card.users[u].fieldsHtml;
                delete card.users[u].users;
                delete card.users[u].notes;
                delete card.users[u].prompts;
                delete card.users[u].reviews;
                delete card.users[u].finished;
                delete card.users[u].seen;
                delete card.users[u].lastOpened;
                delete card.users[u].dueTime;
                delete card.users[u].reviewTime;
                if (u === 'Mandarin_Blueprint') {
                	card.fields = {...card.users[u].fields};
                  // a whole lot of cleanup
                  if (card.fields.Sentence) {
                    card.fields['Highlights'] = [];
                    var sentsplit = card.fields.Sentence.split('==');
                    for (var spl in sentsplit) {
                      if (spl % 2 == 1) {
                        card.fields['Highlights'].push(sentsplit[spl]);
                      }
                    }
                    // var highlighted_word = card.fields.Sentence.split('==')[1];
                    // card.fields['Highlight'] = highlighted_word;
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
//      console.log("yay");
    } else {
      unsafeWindow.we_are_there = false;
//      console.log("nay");
    }
  }

  window.setInterval(areWeThereYet, 5000); // occasional check to see if we're in the right spot

})();
