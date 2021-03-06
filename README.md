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


## Developing

### `app`

To develop, run `yarn dev` from `app`
- this will start serving the folder statically
- it connects to the deployed cloudflare worker at `https://automerge-playground.dferber.workers.dev/`

### `worker`

To develop the worker, run `yarn dev` from `worker`.

But in reality, I mostly ran `yarn pub` after making changes to publish a new version of the worker and test live.

To reset state for a specific key, you can send `curl -X DELETE https://automerge-playground.dferber.workers.dev/foo`.

## Note

This implementation always sends the full document back and forth. In a real-world scenario you'd optimize the network using either of the strategies described in the [Real-time Collaboration Cookbook](https://automerge.org/docs/cookbook/real-time/).
