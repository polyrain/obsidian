var attemptCount = 0;
var sanitizeHTML = function (str) { return str.replace(/[^\w. ]/gi, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
const uri = 'https://api.caint.casa/api/Comments';
const threadUri = 'https://api.caint.casa/api/Threads';

const threadHost = "polyrain";
var threadPath = document.location.pathname;

const thisThread = getThreadId();

/* Needed due to obsidian sanitation */
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
    console.log("Hello");
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
            console.log(data);
            document.getElementById("threadID").value = data;
            getThread(data);
            return data;
        })
        .catch(error => console.error('Unable to get thread id.', error));
}

function getThread(thread) {
    fetch(uri + "/thread/" + thread)
        .then(response => response.json())
        .then(data => _displayThread(data))
        .catch(error => console.error('Unable to get comments.', error));
}

async function addItem() {
    const commenterNameTextbox = document.getElementById('commenterName');
    const commentBodyTextbox = document.getElementById('commentBody');
    var commentThreadId = document.getElementById('threadID').value;
    console.log(commentThreadId);

    if (commentBodyTextbox.value.length == 0) {
        console.log(commentBodyTextbox.value.length);
        return;
    } else if (commentBodyTextbox.value.length > 500) {
        commentBodyTextbox.value = "Comment too long! Max 500 characters.";
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


fixForm();
getThreadId();

function resetFields() {
    console.log('Navigation event triggered!');
    attemptCount = 0;
    threadPath = document.location.pathname;
    fixForm()
    getThreadId()
}

window.app.on('navigated', resetFields)

/* Stops pop up on refresh */
if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}
