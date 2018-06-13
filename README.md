# preact pull stream

Create a duplex stream from a preact component

You can create a render loop with a stream interface. Events come out of the dom, then get transformed into state and sent to preact to re-render.

## install 

    npm install preact-pull-stream

## example

```js
var { h, render } = require('preact')
var xtend = require('xtend')
var S = require('pull-stream')
var scan = require('pull-scan')
var cat = require('pull-cat')
var ViewStream = require('preact-pull-stream')

// define view event names foo and bar
var View = ViewStream(['foo', 'bar'], MyView)

// a preact component is exposed on `.view` field
render(<View.view />, document.body)

function MyView (props) {
    return <div>
        hello {props.hurray}
        <br />
        <button onClick={props.events.foo}>foo click</button>
    </div>
}

var strings = [ 'ham', 'string', 'world' ]
var initState = { hurray: 'hurray' }

S(
    cat([
        S.once(initState),
        S(

            // create a stream of foo events
            View.sources.foo(),

            // create a state object that gets sent back to the view
            scan((prev, n) => prev === 2 ? 0 : prev + 1, 0),
            S.map(n => strings[n]),
            scan(function (state, string) {
                return xtend(state, { hurray: string })
            }, initState),
         )
    ]),

    // all state changes are consumed by a single sink
    View.sink
)
```


