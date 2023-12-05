// ==UserScript==
// @name         travExport
// @namespace    https://github.com/soborg/travExport
// @description  Export your notes from a Traverse (Mandarin Blueprint) deck to JSON
// @author       soborg
// @version      0.14
// @grant        unsafeWindow
// @match        https://traverse.link/*
// ==/UserScript==

// Version history
//
// 0.14  (2023-12-05): should now also work properly in Edge (possibly other Chromium browsers too)
//
// 0.13  (2023-12-05): fix title shenanigans on download buttons
//
//
// 0.12  (2023-12-05): support downloading very flattened (1 level) json, or lightly nested (2-3 levels)
//
//
// 0.11  (2023-12-05): flatten the resulting card, no more (deeply) nested fields
//                     option to include/exclude media links (exluded by default)
//
//
// 0.10  (2023-12-05): button replaced by a nice fancy menu, adding:
//                     - button to export as JSON
//                     - button to expand all decks (with an ugly progress counter)
//                     - link to the project github page
//
//                     restructure collectAndDownload function, to break/continue earlier.
//                     no longer throw away errors that was caused by card parsing errors.
//
//
// 0.9   (2023-12-04): cleaned up most (all?) of the markup tags, showing only their relevant links or values.
//                     embedded image links from the user notes are extracted and stored with the text list elements.
//                     removed traverse.link URI from prop/actor/set links.
//
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
  var includeMedia = false;

  function GM_addStyle(css) {
     const style = document.getElementById("GM_addStyleByTravExport") || (function() {
      const style = document.createElement('style');
      style.type = 'text/css';
      style.id = "GM_addStyleByTravExport";
      document.head.appendChild(style);
      return style;
    })();
    const sheet = style.sheet;
    sheet.insertRule(css, (sheet.rules || sheet.cssRules || []).length);
  };

  GM_addStyle(".dropbtn { color: black; padding: 16px; font-size: 16px; border: none; cursor: pointer; }");
  GM_addStyle(".dropbtn:hover { background-color: #2980B9; }");
  GM_addStyle(".dropdown { float: right; position: relative; display: inline-block; }");
  GM_addStyle(".dropdown-content { display: none; position: absolute; background-color: #f1f1f1; min-width: 160px; overflow: auto; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); right: 0; z-index: 1; }");
  GM_addStyle(".dropdown-content a { color: black; padding: 12px 16px; text-decoration: none; display: block; cursor: pointer; }");
  GM_addStyle(".dropdown a:hover {background-color: #ddd; }");
  GM_addStyle(".show {display: block;}");
  
  function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(text)));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  unMarkupifyLink = function(x) {
    if (x.length == 0)
      return x;
    var link = x.split("]")[0].replace("[", "").replace("!", "");
    if (link.length == 0) {
      link = x.split("(")[1].replace(")", "");
    }
    link = link.replaceAll("\\", ""); // no need to escape, let's remote that
    return link;
  };
  
  decodeComp = function(x) {
    return decodeURI(x.replace("https://traverse.link/Mandarin_Blueprint/", ""));
  };
  
  cleanUserField = function(field) {
    var new_fields = []
    var re = new RegExp("\\!\\[\\](.*)\\)", "g");
    var markup = field.match(re);
    for (var idx in markup) {
      var mlink = markup[idx];
      var cleaned = unMarkupifyLink(mlink);
      field = field.replace(mlink, "");
      new_fields.push(cleaned);
    }
    field = field.trim();
    if (field.length > 0)
    	new_fields.splice(0, 0, field);
    return new_fields;
  };
  
  collectAndDownloadCardsFlat = function() { collectAndDownloadCards(true); };
  collectAndDownloadCardsNested = function() { collectAndDownloadCards(false); };
  
  maybeFlatten = function(value, flatten, separator) {
    if (!flatten) return value;
    return value.join(separator);
  }

  collectAndDownloadCards = function(flat) {

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
      var isParent = null;
      try {
        isParent = elm.getAttribute('class').indexOf('parent') > 0
      } catch {
     		continue    
      }
      if (isParent) {
        console.debug('object is a parent of sort, skipping');
        continue
      }
      
      unsafeWindow.elm = elm;  // storing the element on the unsafeWindow exposes the internal React properties so we can access the nested card data
      for (jdx in Object.keys(unsafeWindow.elm)) {
        var key = Object.keys(unsafeWindow.elm)[jdx];
        if (!key.startsWith('__reactFiber')) {
          console.warning('reactFiber could not be found in element: ', elm);
          continue
        }
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
        delete card.flowNode;
        delete card.flowChildren;
        delete card.flowParents;
        delete card.doRepeat;
        delete card.appearance;
        delete card.userName;
        delete card.topic;
        delete card.publishedJourneys;
        delete card.template;

        for (var u in card.users) {
          if (u !== "Mandarin_Blueprint") {
            var user_fields = {...card.users[u].fields};
            if (user_fields["NOTES"]) {
              card.userNotes = cleanUserField(user_fields["NOTES"]);
              if (flat) {
                card.userNotes = card.userNotes.join('\n');
              }
            }
            continue
          }

          var fields = {...card.users[u].fields};
          for (const [key, value] of Object.entries(fields)) { // seed the card object with the nested fields
            card[key] = value;
          }
          // a whole lot of cleanup
          if (card.Sentence) {
            card['Highlights'] = [];
            var sentsplit = card.Sentence.split('==');
            for (var spl in sentsplit) {
              if (spl % 2 == 1) {
                var w = sentsplit[spl];
                if (card['Highlights'].indexOf(w) < 0) {
                  card['Highlights'].push(sentsplit[spl]);

                }
              }
            }
            card['Highlights'] = maybeFlatten(card['Highlights'], flat, '\n');
          }
          if (card["Top-Down Word(s)"]) {
            card["Top-Down Word(s)"] = maybeFlatten(card["Top-Down Word(s)"].replaceAll('&nbsp;', '').split('\n'), flat, '\n');
          }
          if (card.Tags) {
            card.Tags = maybeFlatten(card.Tags.split('\n').map(unMarkupifyLink), flat, ',');
          }
          if (card.Audio) {
            if (!includeMedia) {
              card.Audio = "";
            } else {
            	card.Audio = card.Audio.replaceAll('&nbsp;', '').split('\n').filter((x) => x.replaceAll(' ', '').length > 5).map(unMarkupifyLink);
            }
          }
          if (card.AUDIO) {
            if (!includeMedia) {
              card.AUDIO = "";
            } else {
              card.AUDIO = card.AUDIO.replaceAll('&nbsp;', '').split('\n').filter((x) => x.replaceAll(' ', '').length > 5).map(unMarkupifyLink);
            }
          }
          if (card["STROKE ORDER"]) {
            if (!includeMedia) {
              card["STROKE ORDER"] = "";
            } else {
            	card["STROKE ORDER"] = unMarkupifyLink(card["STROKE ORDER"]);
            }
          }

          if (card.Links) {
            var link_map = {};
            var splitvalues = card.Links.replaceAll('&nbsp;', '').split('**')
            var prev_key = null;

            for (splitidx in splitvalues) {
              var splitvalue = splitvalues[splitidx].replaceAll(' ', '').replaceAll('\n', '').trim();
              if (splitvalue.length == 0) {
                continue;
              }
              if (prev_key != null && prev_key.length > 0) {
                if (prev_key == "Characters") {
                  splitvalue = splitvalue.split(')').map(unMarkupifyLink).map(decodeComp).filter((x) => x.length > 0);
                } else if (prev_key == "Prop(s)") {
                  splitvalue = splitvalue.split(',').map(unMarkupifyLink).map(decodeComp).filter((x) => x.length > 0);
                } else {
                  splitvalue = [decodeComp(unMarkupifyLink(splitvalue))];
                }
                link_map[prev_key] = splitvalue
                prev_key = null;
                continue
              }
              prev_key = splitvalue.replaceAll(' ', '').replaceAll(":", "");

            }
            if (flat) {
              for (const [key, value] of Object.entries(link_map)) {
                card[key] = maybeFlatten(value, flat, ', ');
              }
              delete card.Links;
            } else {
            	card.Links = link_map;
            }
          }
        }
        delete card.users;
        cards.push(card);
        break;
      }
    }
    var filename = document.getElementsByClassName('text-lg text-black')[0].textContent.replaceAll(' ', '');
   	download(filename + '.json', cards);
  };

  var exported = 0;
  function dropdownCount(num) {
      var dropdown = document.getElementsByClassName("dropbtn")[0];
      dropdown.textContent = `E (${exported}/${num})`;
      if (exported == num) { // reset state
        dropdown.textContent = `E`;
        exported = 0;
      }
  }
  
  function expand(deck, decknum) {
    try {
      dropdownCount(decknum);
      exported += 1;
      deck.click();
    }
    catch {
      console.log('obj has no click function: ', deck);
    }
  };

  expandTopicDecks = function() {
    var decks = document.getElementsByClassName("react-flow__node react-flow__node-groupNode selectable parent");
  	var dropdown = document.getElementsByClassName("dropbtn")[0];
  	var decknum = decks.length;
  	dropdownCount(decknum);
    for (var i in decks) {
      var deck = decks[i];
      window.setTimeout(expand, 1000*i, deck, decknum);
    }
  };

  function myDropdown() {
    var dropdown = document.getElementById("myDropdown");
    dropdown.classList.toggle('show');
  }

  function createDownloadButton() {
    document.addEventListener('click', (event) => {
      if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i];
          if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
          }
        }
      }
    });
    var outer_div = document.createElement('div');
    outer_div.classList.toggle("dropdown");
    var button = document.createElement('button');
    button.textContent = 'E';
    button.classList.toggle('homescreen-button');
    button.classList.toggle('dropbtn');
    button.setAttribute('title', 'Traverse Export Toolbox');
    button.addEventListener('click', myDropdown, false);
    outer_div.appendChild(button);

    var inner_div = document.createElement('div');
    inner_div.id = 'myDropdown';
    inner_div.classList.toggle("dropdown-content");
    outer_div.appendChild(inner_div);
    
    var a_export = document.createElement('a');
 		a_export.setAttribute('title', 'Download visible cards as a flattened JSON (csv-friendly format)');
    a_export.textContent = 'Export as JSON (csv-friendly)';
    a_export.addEventListener('click', collectAndDownloadCardsFlat, false);
    inner_div.appendChild(a_export);

    var a_export_nested = document.createElement('a');
    a_export_nested.setAttribute('title', 'Download visible cards as a nested JSON (machine-readable format)');
    a_export_nested.textContent = 'Export as JSON (nested)';
    a_export_nested.addEventListener('click', collectAndDownloadCardsNested, false);
    inner_div.appendChild(a_export_nested);
    
    
    var a_expand = document.createElement('a');
    a_expand.setAttribute('title', 'Attempt to open all decks on the page');
    a_expand.textContent = 'Expand all decks (takes a few seconds)';
    a_expand.addEventListener('click', expandTopicDecks, false);
    inner_div.appendChild(a_expand);

    var a_about = document.createElement('a');
    a_about.setAttribute('href', 'https://github.com/soborg/travExport');
    a_about.setAttribute('target', '_blank');
    a_about.textContent = 'What is this?';
    a_about.setAttribute('title', 'Open the travExport Github page');
    inner_div.appendChild(a_about);

    var toolbar = document.getElementsByClassName('MuiToolbar-regular')[0];
    var anchor = toolbar.getElementsByClassName('homescreen-button')[0].parentNode;
    anchor.appendChild(outer_div);
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
