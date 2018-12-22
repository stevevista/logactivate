import React from 'react'
import { Button, Icon, Input } from 'antd'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import {Client} from 'mqtt-over-web'

class MQTT extends React.Component {
  state = {
    uploading: false,
    topic: '/presence',
    message: '',
    mqttMsgs: []
  }

  render() {
    return (
      <div>
        <pre>
          <p>use a mqtt libary to implement subscribe to <b>{this.state.topic}</b></p>
          <ul>
            {
              this.state.mqttMsgs.map((s, i) => (<li key ={i}>{s}</li>))
            }
          </ul>
        </pre>
        <div>
          <div>
            <Input defaultValue={this.state.topic} placeholder="Topic" style={{width: 300}} onChange={(e) => { this.setState({topic: e.target.value}) }}/>
          </div>
          <div>
            <Input.TextArea placeholder="Message" autosize={{ minRows: 2, maxRows: 6 }} onChange={(e) => { this.setState({message: e.target.value}) }}/>
          </div>
        </div>
        <Button
          disabled={!this.state.wsOpend || !this.state.message}
          loading={this.state.uploading}
          onClick={this.publish}>
          <Icon type="upload"/> Publish
        </Button>
      </div>
    )
  }

  publish = () => {
    this.client.publish(this.state.topic, this.state.message).then(() => { console.log('published') })
  }

  componentDidMount() {
    this.client = new Client(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/mqtt/a11vWRALINU/AvQKEXmnxyrOc20vmZZB`)
    //this.client = new MqttClient(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/mqtt`)
    this.client.on('connect', () => {
      const mqttMsgs = [...this.state.mqttMsgs, '[mqtt connected]']
      if (mqttMsgs.length > 30) {
        mqttMsgs.shift()
      }
      this.setState({mqttMsgs})
      this.client.subscribe(this.state.topic)
    })

    this.client.serve('property/set', (data) => {
      console.log('Received a message: ', JSON.stringify(data))
    });

    this.client.subscribeAndListen('/presence', function (err, topic, message) {
      if (err) {
        throw err
      }
        
      console.log(topic, message)
    })

    this.client.on('message', (topic, msg) => {
      const mqttMsgs = [...this.state.mqttMsgs, JSON.stringify(msg)]
      if (mqttMsgs.length > 30) {
        mqttMsgs.shift()
      }
      this.setState({mqttMsgs})
    })

    const events = [
      'socket-open',
      'socket-error',
      'socket-close'
    ]

    events.forEach(evt => {
      this.client.on(evt, () => {
        const mqttMsgs = [...this.state.mqttMsgs, `[${evt}]`]
        if (mqttMsgs.length > 30) {
          mqttMsgs.shift()
        }
        this.setState({mqttMsgs, wsOpend: true})
      })
    })
  }
}

function mapStates (state) {
  return {
    authed: state.app.authed
  }
}

export default injectIntl(connect(mapStates)(MQTT), {
  withRef: true
})
