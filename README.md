# Traverse Exporter
This tool allows you to download all your notes for all cards that are open in a Traverse graph.


## Why Does This Project Exist?
Traverse is a proprietary and closed platform, with extremely limited/non-existing options to export personal notes.
Some users have expressed a desire to be able to backup those exact personal notes, be it for any, but not limited to, the following reasons:

- the "all eggs in one basket"-problem. What happens if Traverse goes bankrupt or otherwise becomes unavailable?
- a desire to store notes elsewhere (Excel/Google Spreadsheets/other), perhaps to keep simple lists of actors/sets/props for easier access/asset management.

Whatever the reason, this tool attempts to solve that.



# Installation

**Prerequisites:**
- Firefox or Chrome/Chromium/Edge
- GreaseMonkey extension for Firefox, TamperMonkey extension for Chrome/Chromium/Edge
- A valid user account on Traverse

## Installing the Tool:
- Open the following user script: https://github.com/soborg/travExport/raw/main/gm-travexport.user.js
- A prompt should appear automatically, click `Install` to install.


## Usage
- open https://traverse.link/app in your browser and navigate to a deck of your choice
- a button with the letter `E` should appear on the top right of the screen after a few seconds
- click the button to get a few options:
  - download as JSON (downloads only the visible cards). Choose `flat` or `nested`. `flat` is easy to convert to Excel/CSV.
  - button to expand subdecks on the current level/deck.

When downloading, the file is named after the current level, e.g. `Level40-Intermediate.json`.

You can use https://jsoneditoronline.org/ to inspect and navigate the resulting JSON file.


# Help!

## Common Errors
In either of the following cases, please create an issue if the suggested solution (if any) does not work. Preferably include a screencap or text-copy of any errors (if available) in the browser console log.

### Q: The resulting JSON file is empty?
The script failed to parse your notes.
I've only encounted a few edge-cases in how personal notes are parsed but there may be exceptions I've not considered.

### Q: Nothing happens when I click the 'Download as JSON' button?
Script is not behaving, or the data the script is looking for is no longer where it's supposed to be.

### Q: There is not E-button?
Try refreshing the browser tab. Make sure the `travExport` user-script is enabled in GreaseMonkey/Tampermonkey.

### Q: Something else?
Feel free to make an issue if something's broken or otherwise doesn't work as expected.


# Limitations
The script is only tested to handle the Mandarin Blueprint decks in Traverse. It will most definitely not work with other Traverse projects.

Script output is currently *only* JSON. If you want a different format for the resulting data, please consider other tools to do the conversion, or create a feature-/pull-request detailing your needs.


# Example
Check out `example_output_card_flat.json` or `example_output_card_nested.json` for examples of what the output looks like (recently exported with v0.12 of the user script).
The output was pretty-printed using https://jsoneditoronline.org/.


# Contributing
I've kept the scope of the project quite narrow, but still feel free to request features or make pull-requests for stuff you'd like the project to do.

