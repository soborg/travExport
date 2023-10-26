# travExport

## Exporting a deck from Traverse

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
Call the function and copy to clipboard:

```javascript
formatCards(temp0);
copy(temp0);
```

Open a text editor and paste the content, save.

The content contains all relevant information for each card: props, notes, links to audio/images, etc.

There is no scheduling information.

Done.


# Caveats

This method *only* works while the traverse app logs the topicCards object to the console.
If/when they remove that, well... RIP.

