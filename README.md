# automerge-playground

## About

I used this to play around with [automerge](https://automerge.org/).

This persists state in a Durable Object using a Cloudflare Worker.

All changes changes need to be synchronized manually using the <kbd>↑ push</kbd> and <kbd>↓ pull</kbd> buttons. These explicit syncs of state are done for demo purposes.

You can test using multiple tabs.

You can open a fresh state by appending a different hash, like `/#foo` or `/#bar`. Each hash is its own state.

## Source

The source code is basically an extended version of this tutorial https://automerge.org/docs/tutorial/introduction/.

Automerge is by Martin Kleppmann https://www.youtube.com/watch?v=UUGdMHrdzIU.
