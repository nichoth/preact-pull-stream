var Preact = require('preact')
var h = Preact.h
var Component = Preact.Component
var xtend = require('xtend')
var S = require('pull-stream/pull')
var Drain = require('pull-stream/sinks/drain')
var Notify = require('pull-notify')
var Pushable = require('pull-pushable')
var Abortable = require('pull-abortable')

function PreactStream (view, initState) {
    // @TODO should probably get rid of this and make a simple
    // pub/sub thing
    var pushable = Pushable()
    var abortable$ = Abortable()
    var notify = Notify()

    // memoize these emitter functions
    var emitFns = {}
    function emit (type, data) {
        if (data === undefined) {
            emitFns[type] = emitFns[type] || function (data) {
                notify([type, data])
            }
            return emitFns[type]
        }

        notify([type, data])
    }

    class ViewStream extends Component {
        constructor() {
            super()
            this.state = initState
        }

        componentDidMount() {
            var self = this

            S(
                pushable,
                abortable$,
                Drain(function onUpdate (state) {
                    self.setState(state)
                }, function onEnd (err) {
                    if (err) throw err
                })
            )
        }

        componentWillUnmount() {
            abortable$.abort()
        }

        render(props, state) {
            return h(
                view,
                xtend(props, state, {
                    emit: emit,
                }),
                props.children
            )
        }
    }

    ViewStream.createSource = notify.listen
    ViewStream.sink = Drain(function onEvent (ev) {
        pushable.push(ev)
    }, function onEnd (err) {
        if (err) throw err
    })

    return ViewStream
}

module.exports = PreactStream

