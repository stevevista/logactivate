import React from 'react'
import { Button, Icon, Input } from 'antd'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'

class MQTT extends React.Component {
  state = {
    uploading: false,
    topic: 'presence',
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
    this.ws.send(this.props.authed.username + ': ' + this.state.message)
  }

  componentDidMount() {
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/mqtt/presence`)
    this.ws = ws

    ws.onopen = () => {
      const mqttMsgs = [...this.state.mqttMsgs, '[connected]']
      if (mqttMsgs.length > 30) {
        mqttMsgs.shift()
      }
      this.setState({mqttMsgs, wsOpend: true})
    }

    ws.onerror = () => {
      const mqttMsgs = [...this.state.mqttMsgs, '[error]']
      if (mqttMsgs.length > 30) {
        mqttMsgs.shift()
      }
      this.setState({mqttMsgs, wsOpend: false})
    }

    ws.onclose = () => {
      const mqttMsgs = [...this.state.mqttMsgs, '[closed]']
      if (mqttMsgs.length > 30) {
        mqttMsgs.shift()
      }
      this.setState({mqttMsgs, wsOpend: false})
    }

    ws.onmessage = (data) => {
      const mqttMsgs = [...this.state.mqttMsgs, data.data]
      if (mqttMsgs.length > 30) {
        mqttMsgs.shift()
      }
      this.setState({mqttMsgs})
    }
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
