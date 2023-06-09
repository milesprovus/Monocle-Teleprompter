async function getTitle() {
    const url = document.getElementById('input').value;
    const regex = /\/presentation\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    let response;
    try {
        response = await gapi.client.slides.presentations.get({
            presentationId: match[1],

        })
        const presentation = response.result;
        title = presentation['title']
        document.getElementById('slide_title').innerText = title;
    } catch (err) {
        document.getElementById('slide_title').innerText = "Please enter a valid URL"
        return;
    }
}

var outputStr = "";
async function getNotes() {
    const url = document.getElementById('input').value;
    const regex = /\/presentation\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    let response;
    try {
        response = await gapi.client.slides.presentations.get({
            presentationId: match[1],
        });
    } catch (err) {
        document.getElementById('content').innerText = err.message;
        return;
    }
    const presentation = response.result;
    const slidesList = presentation.slides;
    console.log(slidesList);
    const correspondingSlides = [];
    const notesJson = {};
    const numSlides = slidesList.length;
    let notesShape = "";
    let allNotes = [];
    console.log(numSlides)
    document.getElementById('numSlides').innerHTML = "There are " + numSlides + " Slides";

    for (const slide of slidesList) {
        const notesPage = slide.slideProperties.notesPage;
        let slideNotes = [];

        if (notesPage.pageElements && notesPage.pageElements[1].shape && notesPage.pageElements[1].shape.text && notesPage.pageElements[1].shape.text.textElements) {
            for (var y = 1; y < notesPage.pageElements[1].shape.text.textElements.length; y = y + 2) {
                if (notesPage.pageElements[1].shape.text.textElements[y].textRun && notesPage.pageElements[1].shape.text.textElements[y].textRun.content) {
                    notesShape = notesPage.pageElements[1].shape.text.textElements[y].textRun.content.replace(/\n/g, '');
                    slideNotes.push(notesShape);
                    console.log(notesShape);
                    correspondingSlides.push(notesPage["objectId"]);
                }
            }
        } else {
            slideNotes.push("No Notes Present");
            correspondingSlides.push(notesPage["objectId"]);
        }

        allNotes.push(slideNotes);
        console.log(allNotes);
    };
    console.log(notesJson)
    console.log(correspondingSlides);

    // Create a dictionary to store the mapping from old values to new values.
    const valueToIndex = {};
    for (let index = 0; index < correspondingSlides.length; index++) {
        const value = correspondingSlides[index];
        if (valueToIndex[value] === undefined) {
            valueToIndex[value] = 1;
        } else {
            valueToIndex[value]++;
        }
    }
    console.log(valueToIndex)
    const slideDict = Object.keys(valueToIndex).map((key, index) => {
        return {
            slideNumber: index + 1,
            numOfNotes: valueToIndex[key],
            notes: allNotes[index],
        };
    });
    console.log(slideDict);
    outputStr = JSON.stringify(slideDict, undefined, 2);

    // Create a Blob with the JSON data
    const blob = new Blob([outputStr], { type: 'application/json' });
    display();
}

function display() {
    var output = document.getElementById('output_data')
    output.setAttribute("data-notes", outputStr)
    var json = JSON.parse(outputStr)
    var jsonContentElement = document.getElementById('jsonContent');
    jsonContentElement.innerHTML = '';
    var jsonHTML = '<ul>';
    for (var i = 0; i < json.length; i++) {
        var slide = json[i];
        jsonHTML += '<li>';
        jsonHTML += 'Slide Number: ' + slide.slideNumber + '<br>';
        jsonHTML += 'Number of Notes: ' + slide.numOfNotes + '<br>';

        jsonHTML += 'Notes:<ul>';
        // Iterate over each note in the notes array
        for (var j = 0; j < slide.notes.length; j++) {
            jsonHTML += '<li>' + slide.notes[j] + '</li>';
        }
        jsonHTML += '</ul>';

        jsonHTML += '</li>';
    }

    jsonHTML += '</ul>';

    jsonContentElement.innerHTML = jsonHTML;

    document.getElementById('signout_button').style.visibility = 'visible';
    document.getElementById('authorize_button').innerText = 'Refresh';
    document.getElementById('slide_title').style.display = 'block';
    document.getElementById('connectBtn').style.visibility = 'visible';
};
async function upload() {
    const jsonDataString = outputStr;
    const formData = new FormData();
    formData.append('file', new Blob([jsonDataString], { type: 'application/json' }), 'data.json');

    fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => response.text())
        .then(data => {
            console.log(data); // Server response
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
