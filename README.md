# travExport
Want to backup your personal notes from a Traverse deck?
Well, look no further, there are a number of methods to do this, and they all produce the same result. Method 1 is more accessible and the recommended method.

Choose your own adventure below.


## Method 1: GreaseMonkey user script installation and usage
This script injects a download-button on the navigation bar of Traverse, when you have a deck or level opened. The script downloads only the level you've opened, so if you want to download all your notes across all decks, you should do so for every level/deck.

Prerequisites:
- Firefox or Chrome/Chromium/Edge
- GreaseMonkey extension for Firefox, TamperMonkey extension for Chrome/Chromium/Edge


### Installation

- Open this user script: https://github.com/soborg/travExport/raw/main/gm-travexport.user.js
- A prompt should open, click 'Install' to install.


### Usage

- open https://traverse.link/app and navigate to a deck of your choice
- after a few seconds, a button with the letter `E` should appear on the top right of the screen
- expand all the subdecks for which you want the nested card notes exported
- click the `E` button and it should download a file

The resulting file is named after the current level, e.g. `Level40-Intermediate.json'.
The file is a well-structured JSON file containing all your notes for all the visible cards in the level/deck.

You can use https://jsoneditoronline.org/ to inspect and navigate the resulting JSON file. Just paste the contents of the downloaded json into the editor on the left of the screen and click `>` beneath `Transform`.


## Method 2: Manually backing up a deck from Traverse

Here's a rough guide to do the same process manually:

- Open Traverse app in a browser.
- Open Console
- find object containing 'topicCards'
  - there should be anywhere between 50 and hundreds of elements in the list
  - first card should contain information about the level (e.g. Phase 5 level 35).
- right-click the object and save as global variable (press enter)
- you should get a temp filename, e.g. temp0, this is used later.
- enter the following in the console:

```javascript
function formatCards(obj) { obj.topicCards.map( (x) => { x.topicCard = null; x.user = null; x.graphInfo = null; } ) };
```
The function just removes any recursive object references (`user` and `topicCard`) and potentially useless information (`graphInfo`) and prevents it from being a massive object. There may be other useless information in the resulting object, but it's no big deal to filter this out afterwards.

The `user` object contains information about the current logged in user, like study history and which courses/decks the user has access to. It may be included in the dump if you like, then alter the above javascript function accordingly. However, this will make the resulting object very large. The same information can be found be checking out the other objects logged to the console by the app.


Call the function and copy to clipboard:

```javascript
formatCards(temp0);
copy(temp0);
```

Open a text editor and paste the content, save. The file should be valid JSON.

The content contains all relevant information for each card: props, notes, links to audio/images, etc.

I've found no scheduling information for each card.

Done.

# Contributing

Feel free to request features or make pull-requests for stuff you'd like the project to do.


# Help?

Feel free to make an issue if something's broken or otherwise doesn't work as expected. I can't guarantee immediate fixes, but feedback is welcome.



# Example

Check out `example_output_card.json` for an example of what the output (of one card) contains and looks like.
