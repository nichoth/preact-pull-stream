var Preact = require('preact')
var h = Preact.h
var Component = Preact.Component
var xtend = require('xtend')
var S = require('pull-stream/pull')
var Drain = require('pull-stream/sinks/drain')
var Notify = require('pull-notify')
var Pushable = require('pull-pushable')
var Abortable = require('pull-abortable')
var mux = require('pull-stream-util/mux')

function PreactStream (evNames, view) {
    var sources = evNames.reduce(function (acc, name) {
        var notify = Notify()
        acc[name] = notify
        return acc
    }, {})

    var state = Pushable()
    var abortable = Abortable()

    class ViewStream extends Component {

        componentDidMount() {
            var self = this
            S(
                state,
                abortable,
                Drain(function onUpdate (state) {
                    self.setState(state)
                }, function onEnd (err) {
                    if (err) throw err
                })
            )
        }

        componentWillUnmount() {
            abortable.abort()
        }

        render(props, state) {
            var emitters = Object.keys(sources).reduce(function (acc, k) {
                acc[k] = function (data) {
                    sources[k](data)
                }
                return acc
            }, {})

            return h(
                view,
                xtend(props, { events: emitters, state: state }),
                props.children
            )
        }
    }

    function Sources () {
        return mux(Object.keys(sources).reduce(function (acc, k) {
            acc[k] = sources[k].listen()
            return acc
        }, {}))
    }

    Object.keys(sources).forEach(function (k) {
        Sources[k] = sources[k].listen
    }, {})

    return {
        sources: Sources,
        sink: Drain(function onEvent (ev) {
            state.push(ev)
        }, function onEnd (err) {
            if (err) throw err
        }),
        view: ViewStream
    }
}

module.exports = PreactStream

