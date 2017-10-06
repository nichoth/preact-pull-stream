var { h, render } = require('preact')
var xtend = require('xtend')
var S = require('pull-stream')
var scan = require('pull-scan')
var cat = require('pull-cat')
var ViewStream = require('../index')

console.log(require('preact'))

var View = ViewStream(['foo', 'bar'], function myView (props) {
    console.log('render', props)
    return <div>
        hello {props.hurray}
        <br />
        <button onClick={props.events.foo}>foo click</button>
    </div>
})

render(<View.view />, document.body)

var strings = [ 'ham', 'string', 'world' ]
var initState = { hurray: 'hurray' }

S(
    cat([
        S.once(initState),
        S(
            View.sources.foo(),
            scan((prev, n) => prev === 2 ? 0 : prev + 1, 0),
            S.map(n => strings[n]),
            scan(function (state, string) {
                return xtend(state, { hurray: string })
            }, initState),
         )
    ]),
    View.sink
)



