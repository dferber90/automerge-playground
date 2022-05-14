let docId = window.location.hash.replace(/^#/, "");
let doc = Automerge.init();

loadFromRemote(docId);

let actorId = Automerge.getActorId(doc);

function saveToRemote(docId, binary) {
  fetch(`https://worker.dferber.workers.dev/${docId}`, {
    body: binary,
    method: "post",
    headers: { "Content-Type": "application/octet-stream" },
  }).catch((err) => console.log(err));
}

async function loadFromRemote(docId) {
  const response = await fetch(`https://worker.dferber.workers.dev/${docId}`);
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
  saveToRemote(docId, publishableBinary);
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

publishButton.addEventListener("click", async () => {
  if (publishableBinary) {
    await saveToRemote(docId, publishableBinary);
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
