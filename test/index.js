var { h, render } = require('preact')
var test = require('tape')
var xtend = require('xtend')
var S = require('pull-stream')
var scan = require('pull-scan')
var createViewStream = require('../')

var initState = { hello: 'world', n: 0 }

// create a duplex stream from a preact component
var View = createViewStream(MyView, initState)

function MyView (props) {
    var { emit } = props

    if (props.n === 0) {
        process.nextTick(function () {
            emit('foo', {
                target: {
                    value: 'foo'
                }
            })
        })
    }

    return <div>
        hello: {props.hello} {props.n}
        <br />
        <input type="text" value={props.hello} onInput={emit('foo')}
            autofocus={true} />
    </div>
}

test('preact stream', function (t) {
    t.plan(2)

    // transform view events into new states
    var states$ = S(
        View.createSource(),
        scan((state, [type, ev]) => {
            t.equal(type, 'foo')
            t.equal(ev.target.value, 'foo')
            return { hello: ev.target.value, n: state.n + 1 }
        }, initState)
    )

    // View.sink will re-render on each event in the stream
    S( states$, View.sink )

    render(<View />, document.body)
})

