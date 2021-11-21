/* This is an example publish.js segment to add caint.casa comment functionality to your site.
    Take this entire code and add it to your publish.js file, remebering to configure the variables
    at the top to be specific to your site (importantly, the threadHost variable).
    **You still have to configure the CSS**. Read the docs on caint.casa for a start on this.
    I offer no insurance for this code nor do I intend to offer support unless it breaks
    (in which case, I'll fix it for my site and update this source :)). Good luck!

    Remember to thank the author of caint.casa, without his amazing work none of this would be possible:
    https://www.jpgleeson.com
*/

var attemptCount = 0;
var sanitizeHTML = function (str) { return str.replace(/[^\w. ]/gi, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
const uri = 'https://api.caint.casa/api/Comments';
const threadUri = 'https://api.caint.casa/api/Threads';
const maxCommentLength = 500; // Configures the maximum length of comments; won't accept longer than this
const maxNameLength = 30;

const threadHost = "YOURNAMEHERE"; // Replace this with your threadHost name from caint.casa
var threadPath = document.location.pathname;

const thisThread = getThreadId();

/* Needed due to obsidian sanitation; adds the required functionality for submission*/
function fixForm() {
    const commentAttr = document.getElementById("formField");
    if (commentAttr === null) {
        console.log("Bad load!")
        attemptCount++;
        if (attemptCount < 3) {
            setTimeout(fixForm, 500);
        } else {
            console.log("Took too long to load front matter. Maybe obisidian has changed?");
        }
    } else {
        commentAttr.setAttribute("action", "javascript:void(0);");
        commentAttr.setAttribute("method", "POST");
        commentAttr.setAttribute("onsubmit", "addItem()");
    }
}

function getThreadId() {
    /* Tries to find the threadId div on the page source.
        If found, attempts to fetch the comment chain from caint.casa
        and begins rendering comments on the page.
        If not found, prints an error (indicates you're missing the div tags)
    */
    const threadLocation = {
        hostname: threadHost,
        path: threadPath,
    };

    fetch(threadUri, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(threadLocation)
    })
        .then(response => response.json())
        .then(_data => {
            data = _data;
            document.getElementById("threadID").value = data;
            getThread(data);
            return data;
        })
        .catch(error => console.error('Unable to get thread id. Maybe comments aren\'t on this page?', error));
}

function getThread(thread) {
    /* Gets the thread comments from caint.casa. 
        If it can't (network error, for example),
        errors to console
    */
    fetch(uri + "/thread/" + thread)
        .then(response => response.json())
        .then(data => _displayThread(data))
        .catch(error => console.error('Unable to get comments.', error));
}

async function addItem() {
    /* Adds a comment to the page. Grabs the input from the user,
        bundles it together, and attempts to post it to caint.casa
        after some basic form validation. 

        If input is invalid length wise, indicates this to the user.
        Else, errors to console.
        todo: add regex to filter out banned words?
    */
    const commenterNameTextbox = document.getElementById('commenterName');
    const commentBodyTextbox = document.getElementById('commentBody');
    var commentThreadId = document.getElementById('threadID').value;

    if (commentBodyTextbox.value.length == 0) {
        console.log(commentBodyTextbox.value.length);
        return;
    } else if (commentBodyTextbox.value.length > maxCommentLength) {
        commentBodyTextbox.setAttribute("placeholder", `Comment too long! Max ${maxCommentLength} characters.`);
        commentBodyTextbox.value = '';
        return;
    } else if (commenterNameTextbox.value.length > maxNameLength) {
        commentBodyTextbox.setAttribute("placeholder", `Name too long! Max is ${maxNameLength} characters.`);
        commenterNameTextbox.value = '';
        return;
    }
    else {
        const item = {
            name: commenterNameTextbox.value.trim(),
            body: commentBodyTextbox.value.trim(),
            threadId: commentThreadId,
        };

        fetch(uri, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
            .then(response => response.json())
            .then(() => {
                getThread(commentThreadId);
                commenterNameTextbox.value = '';
                commentBodyTextbox.value = '';
            })
            .catch(error => console.error('Unable to add comment.', error));
    }


}

function deleteItem(id) {
    fetch(`${uri}/${id}`, {
        method: 'DELETE'
    })
        .then(() => getItems())
        .catch(error => console.error('Unable to delete item.', error));
}

function approveItem(id) {
    fetch(`${uri}/admin/approve/${id}`, {
        method: 'POST'
    })
        .then(() => getItems())
        .catch(error => console.error('Unable to approve comments.', error));
}

function closeInput() {
    document.getElementById('editForm').style.display = 'none';
}

function _displayCount(itemCount) {
    const name = (itemCount === 1) ? 'comment' : 'comments';

    document.getElementById('counter').innerText = `${itemCount} ${name}`;
}

function _displayThread(data) {
    /* Internal method for rendering comments */
    const threadBody = document.getElementById('commentThread');
    threadBody.setAttribute('class', 'commentThread');
    threadBody.innerHTML = '';

    _displayCount(data.length);

    const button = document.createElement('button');

    var x = 0;

    data.forEach(item => {
        var commentDiv = document.createElement('div');
        var commentName = document.createElement('h3');
        var commentBody = document.createElement('p');

        commentDiv.setAttribute('class', 'comment');

        commentName.setAttribute('class', 'commenterName');
        commentBody.setAttribute('class', 'commentBody');

        commentName.innerHTML = sanitizeHTML(item.name);
        commentBody.innerHTML = sanitizeHTML(item.body);

        commentDiv.appendChild(commentName);
        commentDiv.appendChild(commentBody);

        threadBody.appendChild(commentDiv);
    });

    comments = data;
}

/* This is here for page load since the "navigate" event is inconsistent on load */
fixForm();
getThreadId();

function resetFields() {
    /* Resets the path for caint.casa in the event user navigates away from a post to a new one */
    console.log('Navigation event triggered!');
    attemptCount = 0; // Reset page load attempt count
    threadPath = document.location.pathname; // Get the new page path
    fixForm() // Try to fix up the html again
    getThreadId() // rerun the caint rendering
}

/* Event used by obsidian to indicate a new page has been loaded */
window.app.on('navigated', resetFields)

/* Stops pop up on refresh */
if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}