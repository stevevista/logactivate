import React from 'react'
import { Card, Upload, Icon, message, Modal, Checkbox } from 'antd'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import {Client} from 'mqtt-over-web/web'
import axios from 'axios'

const productKey = 'prod'
const deviceName = 'dev'

const CheckboxGroup = Checkbox.Group;

const plainOptions = ['Detect Face'];

class OTA extends React.Component {
  state = {
    data: [],
    loading: false,
    previewVisible: false,
    previewImage: '',
    fileList: [],
    imageUrl: '',
    detects: [],
    checkedList: [],
    selectFace: null
  }

  setFace = (det) => {
    const detectFace = this.state.checkedList.indexOf('Detect Face') >= 0;
    const feature = {detectFace, ...det}
    axios.post('/detection/feature-face', {
      feature
    })
      .then(() => {
        this.setState({selectFace: det})
      })
  }

  removeFace = () => {
    const detectFace = this.state.checkedList.indexOf('Detect Face') >= 0;
    const feature = {detectFace}
    axios.post('/detection/feature-face', {
      feature
    })
      .then(() => {
        this.setState({selectFace: null})
      })
  }

  handleCancel = () => this.setState({ previewVisible: false })

  handlePreview = (file) => {
    this.setState({
      previewImage: file.url || file.thumbUrl,
      previewVisible: true,
    });
  }

  onOptionChange = (checkedList) => {
    const detectFace = checkedList.indexOf('Detect Face') >= 0;
    const feature = {detectFace, ...(this.state.selectFace || {})}
    axios.post('/detection/feature-face', {
      feature
    })
      .then(() => {
        this.setState({
          checkedList
        });
      })
  }
  
  handleChange = ({ fileList }) => this.setState({ fileList })

  render () {
    const { previewVisible, previewImage, fileList, imageUrl, detects, selectFace } = this.state
    const uploadButton = (
      <div>
        <Icon type="plus" />
        <div className="ant-upload-text">Upload</div>
      </div>
    )
    return (
      <div>
        <Upload
          action="/detection/upload"
          data= {{
            product: productKey,
            device: deviceName
          }}
          listType="picture-card"
          fileList={fileList}
          onPreview={this.handlePreview}
          onChange={this.handleChange}
        >
          {fileList.length >= 3 ? null : uploadButton}
        </Upload>
        <Modal visible={previewVisible} footer={null} onCancel={this.handleCancel}>
          <img alt="example" style={{ width: '100%' }} src={previewImage} />
        </Modal>
        <div>
          <div style={{ borderBottom: '1px solid #E9E9E9' }}>
          </div>
          <br />
          <CheckboxGroup options={plainOptions} value={this.state.checkedList} onChange={this.onOptionChange} />
        </div>
        <div style={{display: 'flex'}}>
          <Card
            hoverable
            style={{ width: 600 }}
            cover={imageUrl ? <img alt="example" src={`/detection/files/${imageUrl}`} /> : null}
          >
          </Card>
          <div>
            {
              selectFace ? (
                <Card
                  hoverable
                  style={{ width: 150, borderWidth: 2, borderColor: 'green' }}
                  bodyStyle={{padding: 0}}
                  bordered={true}
                  cover={<img alt="example" src={`/detection/files/${selectFace.path}`} />}
                  actions={[<Icon key="setting" type="setting" />, <Icon key="edit" type="delete" onClick={this.removeFace}/>, <Icon key="ellipsis" type="ellipsis" />]}
                >
                </Card>
              ) : null
            }
            {
              detects.map((det, index) => (
                <Card
                  hoverable
                  key={index}
                  style={{ width: 150 }}
                  bodyStyle={{padding: 0}}
                  cover={<img alt="example" src={`/detection/files/${det.path}`} />}
                  actions={[<Icon key="edit" type="plus-circle" onClick={() => this.setFace(det)} />, <Icon key="ellipsis" type="ellipsis" />]}
                >
                </Card>
              ))
            }
          </div>
        </div>
      </div>
    )
  }

  componentWillUnmount() {
    this.client.end()
  }
  
  componentDidMount() {
    axios.get('/detection/feature-face')
      .then(({data}) => {
        if (data.path && data.desc) {
          this.setState({selectFace: {path: data.path, desc: data.desc}})
        }
        if (data.detectFace) {
          this.setState({checkedList: ['Detect Face']})
        }
      })

    this.client = new Client(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/mqtt`)
    this.client.on('connect', () => {
      message.success('connected')
      this.setState({wsOpend: true})
      this.client.subscribe([
        `sys/${productKey}/${deviceName}/shot/upload`, 
        `sys/${productKey}/${deviceName}/shot/detect`,
        `sys/${productKey}/${deviceName}/log/upload`,
        `sys/${productKey}/${deviceName}/screen/upload`,
        `client/${productKey}/${deviceName}/data`,
        `client/${productKey}/${deviceName}/status`])
    })

    this.client.on('message', (topic, msg) => {
      if (topic.indexOf('/shot/upload')) {
        const obj = JSON.parse(msg);
        console.log(obj)
        this.setState({imageUrl: obj.url, detects: []})
      }
      if (topic.indexOf('/shot/detect')) {
        const obj = JSON.parse(msg);
        console.log(obj)
        if (obj.output) {
          this.setState({imageUrl: obj.output})
        }
        if (obj.detects) {
          this.setState({detects: obj.detects})
        }
      }
    })
  }
}

function mapStates (state) {
  return {
    authed: state.app.authed
  }
}

export default injectIntl(connect(mapStates)(OTA), {
  withRef: true
})
