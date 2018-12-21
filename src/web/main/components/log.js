import React from 'react'
import { Table, Button, Tooltip } from 'antd'
import axios from 'axios'
import moment from 'moment'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import copy from 'copy-to-clipboard'

class Log extends React.Component {
  state = {
    data: [],
    pagination: {},
    filters: {},
    sorter: {},
    loading: false,
    logLists: {},
    shareToken: null,
    shareTokenTime: null
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
    dataIndex: 'sw_version',
    sorter: true
  }, {
    title: 'Title',
    dataIndex: 'title'
  }, {
    title: 'Update',
    dataIndex: 'updatedAt',
    defaultSortOrder: 'descend',
    sorter: true,
    render: (text, record) => (
      <span>{moment(text).fromNow()}</span>
    )
  }]

  onExpand = (expanded, record) => {
    if (expanded) {
      axios.post('/user/share-token', {
        level: 2,
        max_age: 60 * 60
      })
        .then(({data}) => {
          this.setState({
            shareToken: data,
            shareTokenTime: Date.now()
          })
        })
    }
  }

  expandedRowRender = (record, index, indent, expanded) => {
    if (expanded) {
      const info = record.data || {}
      return (
        <div>
          {
            Object.keys(info).map(k => (
              <p key={k}>{k} ： {info[k]}</p>
            ))
          }
          <p>Attachments ：</p>
          <ul>
            {
              record.attachments && record.attachments.map(p => {
                return (
                  <li key={p._id}>
                    <a href={p.url}>{p.filename}</a>
                    <CopyToClipboard text={p.url + '?access_token=' + this.state.shareToken} className="setting-button">
                      <Tooltip title={this.props.intl.formatMessage({id: 'log.copy_link_tip'})}>
                        <Button shape="circle" size="small" icon="copy"/>
                      </Tooltip>
                    </CopyToClipboard>
                  </li>)
              })
            }
          </ul>
        </div>
      )
    }
    return null
  }

  render () {
    return (
      <div>
        <Table
          columns={this.columns}
          expandedRowRender={this.expandedRowRender}
          onExpand={this.onExpand}
          rowKey={record => record._id}
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
      params: {results: 20, ...params}
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

export default injectIntl(connect(mapStates)(Log), {
  withRef: true
})

class CopyToClipboard extends React.PureComponent {
  static defaultProps = {
    onCopy: undefined
  };


  onClick = event => {
    const {
      text,
      onCopy,
      children
    } = this.props

    const elem = React.Children.only(children)

    const result = copy(text)

    if (onCopy) {
      onCopy(text, result)
    }

    // Bypass onClick if it was present
    if (elem && elem.props && typeof elem.props.onClick === 'function') {
      elem.props.onClick(event)
    }
  }


  render() {
    const {
      text: _text,
      onCopy: _onCopy,
      children,
      ...props
    } = this.props
    const elem = React.Children.only(children)

    return React.cloneElement(elem, {...props, onClick: this.onClick})
  }
}
