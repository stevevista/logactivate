import React from 'react'
import { Table, Icon, Modal } from 'antd'
import axios from 'axios'
import moment from 'moment'

export default class OTA extends React.Component {
  state = {
    data: [],
    pagination: {},
    filters: {},
    sorter: {},
    loading: false,
    filesModalVisible: false,
    logList: []
  }

  columns = [{
    title: 'IP',
    dataIndex: 'ip',
    sorter: true
  }, {
    title: 'IMEI',
    dataIndex: 'imei',
    sorter: true
  }, {
    title: 'GPS',
    render: (text, record) => (
      <span>{record.longitude},{record.latitude}</span>
    )
  }, {
    title: 'SW Version',
    dataIndex: 'swVersion',
    sorter: true
  }, {
    title: 'info',
    dataIndex: 'data'
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
        <Icon type="share-alt" onClick={() => this.showModal(record.imei)}/>
      </div>
    )
  }]

  showModal = (imei) => {
    axios.get('/log/files/' + imei)
      .then(res => {
        const {data} = res
        console.log(data)
        this.setState({
          filesModalVisible: true,
          logList: data
        })
      })
  }

  handleOk = (e) => {
    this.setState({
      filesModalVisible: false
    })
  }

  handleCancel = (e) => {
    this.setState({
      filesModalVisible: false
    })
  }


  render () {
    return (
      <div>
        <Modal
          title="Uploaded Logs"
          visible={this.state.filesModalVisible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          maskClosable={true}
        >
          {
            this.state.logList.map(p => (<p key={p.id}><a href={p.url}>{p.filename}</a></p>))
          }
        </Modal>
        <Table
          columns={this.columns}
          rowKey={record => record.id}
          dataSource={this.state.data}
          pagination={this.state.pagination}
          loading={this.state.loading}
          onChange={this.handleTableChange}
        />
      </div>
    )
  }

  componentDidMount() {
    this.fetch({
      sortField: 'createdAt',
      sortOrder: 'descend'
    })
  }

  fetch = (params = {}) => {
    this.setState({ loading: true })
  
    axios.get('/log/exceptions', {
      params: {results: 10, ...params}
    })
      .then(res => {
        const {data} = res
        
        this.columns[0].filters = data.ips.map(r => ({
          text: r, value: r
        }))
        this.columns[1].filters = data.imeis.map(r => ({
          text: r, value: r
        }))
        this.columns[3].filters = data.versions.map(r => ({
          text: r, value: r
        }))
        
        console.log(data)
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
      results: this.state.pagination.pageSize || 10,
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
