import React from 'react'
import { Button } from 'antd'

export default class Settings extends React.Component {
  render () {
    return (
      <div>
        <div style={{margin: 10}}>
          <Button shape='circle' type='primary' icon='fire'/>
        </div>
        <div style={{margin: 10}}>
          <Button shape='circle' type='primary' icon='ant-design'/>
        </div>
        <div style={{margin: 10}}>
          <Button shape='circle' type='primary' icon='wechat'/>
        </div>
      </div>
    )
  }
}
