## Functional Changes
1. Allow users to edit the questions and sample answers and save the study as an artefact or something in the browser, then allow them the autonomy to save the study when they want to.
 - Allow for additional AI calls for functions as such as generate questions, generate sample answers.
 - Have a study flow/main as an additional column so the user can see what the questions are there for and how they can direct. Allow the user to edit the flow as they please as if its an artefact and this would data being dynamic, would be used for the aforementioned AI functions as context to generate questions etc.
2. Need to test the history function whether the data actually persists during deployment.
3. Right now you can export JSON but how can you import it? Import feature should append to the existing "History" data for now, need a form of validation as well to check if the JSON is valid and the objects in the JSON are suitable for the data model. Need proper error handling.
4. Provide rules for the Ai, making sure it doesn't generate anything that is false doctrine and is faithful to the gospel.
5. Prompt improvements: Breaking down the passage into sections is good but 1 observation question and 1 interpretation question is usually not enough, change the prompt to base the questions of the new "flow" column and design questions based on that. It is not necessary to follow the rule that interpretation questions must follow after observation questions. It is more important that the questions help the reader with the flow of the study indicated by the "flow" column. Though there can be a rule that interpretation questions should be at the end of each section. There can also be "feeling" questions where if there certain profound truths that are meant to evoke feelings, these questions can be included after interpreting truths like "How does this make you feel?" But this should only be done WHEN applicable and not enforced.
6. Rule include for the AI prompt so that the Bible Study produced will not hallucinate and produce any false statements or doctrine that might mislead a reader. Would be good to consider guardrails for this, an additional check on the response itself to prevent such things from happening. The paragraph for the doctrine can be found below, denoted in """ """.
7.There are some passages in the Bible that are hard to study or are ambiguous and are till this day debated by scholars and what not. For these kinds of studies, focus on what is concrete like what is presented in the text. For things that are assumed or have differing interpretations between scholars, make it known to the user. Just make sure that the interpretation produced still follows the above rules. If you think of a better way to deal with the ambiguity of the negotiable (less crucial/important things in the faith) things, please go ahead with your method instead.222

## UI Changes
1. Select a Passage padding very ugly
2. Book, Passage, Chapter, Verse selector UI quite ugly and the button to generate study guide is weirdly flushed to the left, could have a more fun-themed button to generate.
3. Recent Studies Component has bad padding as well. 
4. Individual recent studies in history component is not very nice.
5. Back button from history is not very nice.
6. Insert a short descrition indicating that this is for expository, and the user should thoroughly check and pray when doing the study/prepping the study guide, making sure to discern.


Reformed Christian Theology:
"""
Reformed Christian doctrine affirms that there is one God who eternally exists as three distinct persons—Father, Son, and Holy Spirit—each fully God yet sharing one undivided divine essence. Central to the gospel is the belief that all humanity is sinful and totally depraved, unable to save themselves, and that God in His sovereign grace has elected some unconditionally to salvation through Jesus Christ, who, being fully God and fully man, died on the cross as a substitutionary sacrifice for sins and rose again for justification. Salvation is entirely by grace through faith in Christ alone, not by human works or merit, emphasizing God's absolute sovereignty over all creation and His predetermined plan for redemption. The Reformed tradition upholds the authority of Scripture as the infallible Word of God, covenant theology as the framework for understanding God's relationship with humanity, and the perseverance of the saints—that those truly saved will be kept by God's power unto eternal life. This gospel calls believers to discern truth from false teaching by affirming these core doctrines: the Trinity, total depravity, unconditional election, Christ's atoning work, irresistible grace, and the final perseverance of believers.
"""


## Defered
1. API Endpoints for additional functions.
2. Add ability to create/edit study without AI
3. Add ability to parse the JSON studies into a template for a word doc for a study to be printed.
4. Make everything Client side so it's not necessary to have load balancing.
5. Allow users to key in their own API key, this data will persist in their browser.
6. Loading Bar is not synced.
7. Add Dev logs, to see which API is being used
8. Include ability to change models.
9. Viewing the studies from history still doesnt work.