import React from 'react'
import { connect } from 'react-redux'
import { Layout, Menu, Icon } from 'antd'
import { injectIntl } from 'react-intl'
import {withRouter, HashRouter as Router, Route, Link, Redirect, Switch} from 'react-router-dom'

const { Content, Sider } = Layout

const menusItems = [
  {
    icon: Icon,
    iconType: 'cloud',
    label: 'Logview',
    path: '/log',
    component: require('./log').default
  },
  {
    icon: Icon,
    iconType: 'link',
    label: 'OTA',
    path: '/ota',
    component: require('./ota').default
  },
  {
    icon: Icon,
    iconType: 'setting',
    messageId: 'sidebar.setting',
    path: '/setting',
    component: require('./settings').default
  },
  {
    icon: Icon,
    iconType: 'wechat',
    label: 'MQTT',
    path: '/mqtt',
    component: require('./mqtt').default
  },
  {
    icon: Icon,
    iconType: 'wechat',
    label: 'Detection',
    path: '/detection',
    component: require('./detection').default
  }
]

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      collapsed: false
    }
  }

  LeftSider = withRouter(({history}) => {
    return (
      <Sider
        trigger={null}
        collapsible
        collapsed={this.state.collapsed}
      >
        <Menu theme="dark" selectedKeys={[history.location.pathname]} mode="inline">
          {menusItems.map(item => (
            <Menu.Item key={item.path} onClick={history.location.pathname === item.path ? () => this.toggle() : () => {} }>
              <Link to={item.path}>
                <item.icon type={item.iconType}/>
                <span>{item.messageId ? this.props.intl.formatMessage({id: item.messageId}) : item.label}</span>
              </Link>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
    )
  })

  toggle = () => {
    this.setState({
      collapsed: !this.state.collapsed
    })
  }

  componentDidMount () {
  }

  componentWillUnmount () {
  }

  render () {
    return (
      <Router>
        <Layout style={{height: '100%'}}>
          <this.LeftSider/>
          <Content>
            <Switch>
              {
                menusItems
                  .map(item =>
                    <Route exact path={item.path} key={item.path} component={item.component}/>
                  )
              }
              <Redirect to="/log"/>
            </Switch>
          </Content>
        </Layout>
      </Router>
    )
  }
}

function mapStates (state) {
  return {
  }
}

export default injectIntl(connect(mapStates)(App), {
  withRef: true
})
