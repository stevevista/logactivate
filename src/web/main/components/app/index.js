import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Layout, Menu } from 'antd'
import { injectIntl } from 'react-intl'
import store from '../../store'

import menusItems from './items'

const { Content, Sider } = Layout

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      collapsed: false
    }
  }

  toggle = (key) => {
    if (this.props.selectedPage === key) {
      this.setState({
        collapsed: !this.state.collapsed
      })
    }
  }

  onMenuSelect = ({key}) => {
    store.dispatch({type: 'app/switchPage', page: key})
  }
  

  selectMenu = (key) => {
    this.onMenuSelect({key})
  }

  componentDidMount () {
  }

  componentWillUnmount () {
  }

  renderMenuItem (item) {
    const Tag = item.icon
    const key = item.path
    return (
      <Menu.Item key={key} onClick={() => this.toggle(key)}>
        <Tag type={item.iconType}/>
        <span>{item.messageId ? this.props.intl.formatMessage({id: item.messageId}) : item.label}</span>
      </Menu.Item>
    )
  }

  render () {
    return (
      <Layout style={{height: '100%'}}>
        <Sider
          trigger={null}
          collapsible
          collapsed={this.state.collapsed}
        >
          <Menu theme="dark" defaultSelectedKeys={[menusItems[0].path]} selectedKeys={[this.props.selectedPage]} mode="inline" onSelect={this.onMenuSelect}>
            {menusItems.map(item => this.renderMenuItem(item))}
          </Menu>
        </Sider>
        <Content>
          {
            menusItems.filter(item => item.path === this.props.selectedPage)
              .map(item =>
                <item.component key={item.path}/>
              )
          }
        </Content>
      </Layout>
    )
  }
}

App.propTypes = {
  history: PropTypes.object,
  match: PropTypes.object,
  setBarTitle: PropTypes.func,
  intl: PropTypes.object,
  selectedPage: PropTypes.string
}

function mapStates (state) {
  return {
    selectedPage: state.app.selectedPage
  }
}

function mapDispatchs (dispatch) {
  return {
    setBarTitle: (title) => dispatch({type: 'windowsBar/setTitle', title})
  }
}

export default injectIntl(connect(mapStates, mapDispatchs)(App), {
  withRef: true
})
