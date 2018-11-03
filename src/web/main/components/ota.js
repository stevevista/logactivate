import React from 'react'
import { Table, Upload, Button, Icon, message, Input, Modal, Progress } from 'antd'
import axios from 'axios'
import moment from 'moment'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'

class OTA extends React.Component {
  state = {
    data: [],
    pagination: {},
    filters: {},
    sorter: {},
    loading: false,
    edit_file: null,
    uploading: false,
    uploadPercent: 0
  }

  columns = [{
    title: 'Name',
    dataIndex: 'name',
    sorter: true
  }, {
    title: 'Version',
    dataIndex: 'version',
    sorter: true
  }, {
    title: 'Description',
    dataIndex: 'description'
  }, {
    title: 'Update',
    dataIndex: 'updatedAt',
    defaultSortOrder: 'descend',
    sorter: true,
    render: (text, record) => (
      <span>{moment(text).fromNow()}</span>
    )
  }, {
    title: 'File',
    render: (text, record) => (
      <div>
        <a href={`/ota/download/${record.filename}`}><Icon type="download" className="table-button"/></a>
        {this.props.authed.level < 2 && <Icon type="delete" className="table-button delete" onClick={() => this.delete(record.id)}/>}
      </div>
    )
  }]

  delete = (id) => {
    Modal.confirm({
      title: 'Do you want to delete these items?',
      content: '',
      onOk: () => {
        axios.post('/ota/delete/' + id)
          .then(() => {
            this.refresh()
            message.success(`delete successfully`)
          })
          .catch(e => {
            console.log(e)
            message.error(`delete failed.`)
          })
      },
      onCancel() {}
    })
  }

  render () {
    return (
      <div>
        <Table
          columns={this.columns}
          rowKey={record => record.id}
          dataSource={this.state.data}
          pagination={this.state.pagination}
          loading={this.state.loading}
          onChange={this.handleTableChange} 
          footer={this.props.authed.level < 2 ? this.footer : () => null}
        />
      </div>
    )
  }

  footer = () => {
    const props = {
      name: 'file',
      action: '/ota/upload',
      data: {
        authorization: 'authorization-text'
      },
      showUploadList: true,
      fileList: this.state.edit_file ? [this.state.edit_file] : [],
      beforeUpload: (file) => {
        this.setState({
          edit_file: file,
          uploadPercent: 0
        })
        return false
      }
    }
  
    return (
      <div>
        <div>
          <div>
            <Input placeholder="Version" style={{width: 300}} onChange={(e) => { this.setState({edit_version: e.target.value}) }}/>
          </div>
          <div>
            <Input.TextArea placeholder="Description (optional)" autosize={{ minRows: 2, maxRows: 6 }} onChange={(e) => { this.setState({edit_desc: e.target.value}) }}/>
          </div>
        </div>
        <Upload {...props}>
          <Button>
            <Icon type="upload" /> Select package file
          </Button>
        </Upload>
        <Progress percent={this.state.uploadPercent} />
        <Button 
          disabled={!this.state.edit_file || !this.state.edit_version}
          loading={this.state.uploading}
          onClick={this.handleUpload}>
          <Icon type="upload"/> Upload
        </Button>
      </div>
    )
  }

  handleUpload = () => {
    
    this.setState({
      uploading: true
    })

    const formData = new FormData()
    formData.append('file', this.state.edit_file)
    formData.append('desc', this.state.edit_desc)
    formData.append('version', this.state.edit_version)
    axios.post(
      '/ota/upload',
      formData,
      {
        onUploadProgress: (evt) => {
          console.log('=>', evt)
          if (evt.lengthComputable) {
            const uploadPercent = evt.loaded / evt.total * 100
            this.setState({uploadPercent})
          }
        }
      }
    )
      .then(() => {
        this.refresh()
        message.success(`${this.state.edit_file.name} file uploaded successfully`)
        this.setState({
          uploading: false
        })
      })
      .catch(e => {
        message.error(`${this.state.edit_file.name} file upload failed.`)
        this.setState({
          uploading: false
        })
      })
  }

  componentDidMount() {
    this.fetch({
      sortField: 'createdAt',
      sortOrder: 'descend'
    })
  }

  fetch = (params = {}) => {
    this.setState({ loading: true })
  
    axios.get('/ota/packages', {
      params: {results: 20, ...params}
    })
      .then(res => {
        const {data} = res
        const pagination = { ...this.state.pagination }

        pagination.total = data.totalCount
        this.setState({
          loading: false,
          data: data.results,
          pagination
        })
      })
      .catch(e => {
        this.setState({
          loading: false
        })
      })
  }

  refresh = () => {
    this.fetch({
      results: this.state.pagination.pageSize || 20,
      page: this.state.pagination.current,
      sortField: this.state.sorter.field,
      sortOrder: this.state.sorter.order,
      ...this.state.filters
    })
  }

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination }
    pager.current = pagination.current
    this.setState({
      pagination: pager,
      filters: {...filters},
      sorter: {...sorter}
    })
    this.fetch({
      results: pagination.pageSize,
      page: pagination.current,
      sortField: sorter.field,
      sortOrder: sorter.order,
      ...filters
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
