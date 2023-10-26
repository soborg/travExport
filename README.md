# travExport

Want to save/backup your personal notes from a Traverse deck?

Well, here's a rough guide to help you through it.
It's still very much a manual process, but there may be ways to automate this further.


## Backing up a deck from Traverse

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

# Example

Check out `example_output_card.json` for an example of what the output (of one card) contains and looks like.


# Caveats

This method *only* works while the traverse app logs the topicCards object to the console.
If/when they remove that, well... RIP.

