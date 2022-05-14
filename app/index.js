let docId = window.location.hash.replace(/^#/, "");
let channel = new BroadcastChannel(docId);
let binary = await localforage.getItem(docId);
let doc = Automerge.init();

// loadFromRemote(docId);

channel.onmessage = (ev) => {
  let newDoc = Automerge.merge(doc, Automerge.load(ev.data));
  doc = newDoc;
  render(newDoc);
};

if (binary) {
  doc = Automerge.load(binary);
  console.log(binary);
  render(doc);
}

let actorId = Automerge.getActorId(doc);
console.log({ doc, actorId });

function saveToRemote(docId, binary) {
  fetch(`http://localhost:5050/${docId}`, {
    body: binary,
    method: "post",
    headers: {
      "Content-Type": "application/octet-stream",
    },
  }).catch((err) => console.log(err));
}

async function loadFromRemote(docId) {
  const response = await fetch(`http://localhost:5050/${docId}`);
  if (response.status !== 200)
    throw new Error("No saved draft for doc with id=" + docId);
  const respbuffer = await response.arrayBuffer();
  if (respbuffer.byteLength === 0)
    throw new Error("No saved draft for doc with id=" + docId);
  const view = new Uint8Array(respbuffer);
  let newDoc = Automerge.merge(doc, Automerge.load(view));
  doc = newDoc;
  render(newDoc);
}

let publishableBinary;
function updateDoc(newDoc) {
  doc = newDoc;
  render(newDoc);
  publishableBinary = Automerge.save(newDoc);
  localforage
    .setItem(docId, publishableBinary)
    .catch((err) => console.log(err));
  // channel.postMessage(publishableBinary);
  // saveToRemote(docId, binary);
}

let incrementButton = document.getElementById("increment");

incrementButton.addEventListener("click", () => {
  let newDoc = Automerge.change(doc, (doc) => {
    if (!doc.counter) doc.counter = new Automerge.Counter();
    doc.counter.increment();
  });
  updateDoc(newDoc);
});

let publishButton = document.getElementById("publish");

publishButton.addEventListener("click", () => {
  if (publishableBinary) {
    channel.postMessage(publishableBinary);
  }
  publishableBinary = null;
});

function addItem(text) {
  let newDoc = Automerge.change(doc, (doc) => {
    if (!doc.items) doc.items = [];
    doc.items.push({ text, done: false });
  });
  updateDoc(newDoc);
}

let form = document.querySelector("form");
let input = document.querySelector("#new-todo");
form.onsubmit = (ev) => {
  ev.preventDefault();
  addItem(input.value);
  input.value = null;
};

function render(doc) {
  let list = document.querySelector("#todo-list");
  list.innerHTML = "";
  doc.items &&
    doc.items.forEach((item, index) => {
      let itemEl = document.createElement("li");
      itemEl.innerText = item.text;
      itemEl.style = item.done ? "text-decoration: line-through" : "";
      itemEl.onclick = () => toggle(index);
      list.appendChild(itemEl);
    });

  if (doc.counter) {
    document.getElementById("count").innerText = doc.counter.value;
  }
}

function toggle(index) {
  let newDoc = Automerge.change(doc, (doc) => {
    // your code here
    doc.items[index].done = !doc.items[index].done;
  });
  updateDoc(newDoc);
}
