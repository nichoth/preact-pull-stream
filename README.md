# preact pull stream
Create a duplex stream from a preact component

This will take a preact component, and return a new component with some additional properties -- `.createSource()`, and `.sink`, so that you can easily connect a view to a pull-stream. The source produces events from the dom, and the sink consumes state objects that get passed down as props, re-rendering for each new state.

## install 

    npm install preact-pull-stream

## example

```js
var { h, render } = require('preact')
var createViewStream = require('preact-pull-stream')
var assert = require('assert')
var xtend = require('xtend')
var S = require('pull-stream')
var scan = require('pull-scan')

var initState = { hello: 'world', n: 0 }

// create a duplex stream from a preact component
var View = createViewStream(MyView, initState)

function MyView (props) {
    var { emit } = props

    if (props.n === 0) {
        process.nextTick(function () {
            emit('foo', {
                target: {
                    value: 'world'
                }
            })
        })
    }

    return <div>
        hello: {props.hello} {props.n}
        <br />

        {/*
            `emit('foo')` returns a function that takes a dom event,
            and emits events to the stream in the form [type, data], eg:
            `['foo', <input event>]`

            The curried emit functions are memoized based on type,
            so we do not create a new function on each render
        */}
        <input type="text" value={props.hello} onInput={emit('foo')}
            autofocus={true} />
    </div>
}

// transform view events into new states
var states$ = S(
    View.createSource(),
    scan((state, [type, ev]) => {
        assert.equal(type, 'foo')
        return { hello: ev.target.value, n: state.n + 1 }
    }, initState)
)

// View.sink will re-render on each event in the stream
S( states$, View.sink )

render(<View />, document.body)
```


