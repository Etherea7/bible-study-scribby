## Small Wins
1. Model Selector (Separate the serverless functions one and the own api key one for this, remember to add claude key also if needed), Cleaner way to do this.


## Production System Architecture - Future Work
1. Chatbot to ask questions about the Study (whole different thing)
2. Collaboration Studies - Real Time edits like Google Docs. (Need to look into this)
3. If its good, provision database for people to store and share their studies.


# Outstanding Bugs
1. Clicking Generate with AI when using the CreateStudyWizard bugs out and it doesnt load the study but there's a white screen. -> Need to restore the loading screen or create one for this.
2. Generate in Study Flow doesnt work (might just need open router key), just make this use the model that is being used.

# Small UI changes 
1. Verses in PassageDisplay have the wrong regex, also need to parse the range of verses correctly. Need to prompt with the esv api output for AI to parse it properly
2. Study Flow column (middle column), components should be able to be dragged and reordered
3. Generate Scroll Handles for scrolling animation.
4. Smoothen out the animations
5. Third column (study sections) in editor should collapsable like the other two as well, which will retract the right column and make space for the other two
6. Dont need the passage selector component in the editor
7. Random black circles/dots on the handles of the scroll layout, not necessary.
8. Background/wallpaper could look like a scroll
