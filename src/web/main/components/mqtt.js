import React from 'react'
import { Button, Icon, message, Input } from 'antd'
import axios from 'axios'
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
            <Input.TextArea placeholder="Description (optional)" autosize={{ minRows: 2, maxRows: 6 }} onChange={(e) => { this.setState({message: e.target.value}) }}/>
          </div>
        </div>
        <Button
          disabled={!this.state.topic || !this.state.message}
          loading={this.state.uploading}
          onClick={this.publish}>
          <Icon type="upload"/> Publish
        </Button>
      </div>
    )
  }

  publish = () => {
    
    this.setState({
      uploading: true
    })

    axios.post(
      '/mqtt/pub',
      {
        topic: this.state.topic,
        message: this.state.message
      }
    )
      .then(() => {
        message.success(`message publish successfully`)
        this.setState({
          uploading: false
        })
      })
      .catch(e => {
        message.error(`message publish failed.`)
        this.setState({
          uploading: false
        })
      })
  }

  componentDidMount() {
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/mqtt/presence`)
    ws.onopen = () => {
      const mqttMsgs = [...this.state.mqttMsgs, 'connected']
      this.setState({mqttMsgs})
    }

    ws.onmessage = (data) => {
      const mqttMsgs = [...this.state.mqttMsgs, data.data]
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
