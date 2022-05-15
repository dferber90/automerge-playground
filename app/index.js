let docId = window.location.hash.replace(/^#/, "");
let doc = Automerge.init();

loadFromRemote(docId);

let actorId = Automerge.getActorId(doc);

function saveToRemote(docId, binary) {
  fetch(`https://automerge-playground.dferber.workers.dev/${docId}`, {
    body: binary,
    method: "post",
    headers: { "Content-Type": "application/octet-stream" },
  }).catch((err) => console.log(err));
}

async function loadFromRemote(docId) {
  const response = await fetch(
    `https://automerge-playground.dferber.workers.dev/${docId}`
  );
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
let incrementButton = document.getElementById("increment");

incrementButton.addEventListener("click", () => {
  doc = Automerge.change(doc, (doc) => {
    if (!doc.counter) doc.counter = new Automerge.Counter();
    doc.counter.increment();
  });
  render(doc);
});

document.getElementById("push").addEventListener("click", async () => {
  publishableBinary = Automerge.save(doc);
  if (publishableBinary) {
    await saveToRemote(docId, publishableBinary);
  }
  publishableBinary = null;
});

document.getElementById("pull").addEventListener("click", async () => {
  loadFromRemote(docId);
});

function addItem(text) {
  doc = Automerge.change(doc, (doc) => {
    if (!doc.items) doc.items = [];
    doc.items.push({ text, done: false });
  });
  render(doc);
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
  doc = Automerge.change(doc, (doc) => {
    // your code here
    doc.items[index].done = !doc.items[index].done;
  });
  render(doc);
}
