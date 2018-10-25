import React from 'react'
import {Row, Col, Radio, Button, Divider, Modal, Form, Input, Icon, message} from 'antd'
import { injectIntl } from 'react-intl'
import pkg from '@/../../package.json'
import { connect } from 'react-redux'
import {locales} from '../locales'
import axios from 'axios'

class RegistrationForm extends React.Component {
  state = {
    confirmDirty: false
  }

  handleConfirmBlur = (e) => {
    const value = e.target.value
    this.setState({ confirmDirty: this.state.confirmDirty || !!value })
  }

  compareToFirstPassword = (rule, value, handle) => {
    const form = this.props.form
    if (form.getFieldValue('password') && value !== form.getFieldValue('password')) {
      handle('Two passwords that you enter is inconsistent!')
    } else {
      handle()
    }
  }

  validateToNextPassword = (rule, value, handle) => {
    const form = this.props.form
    if (value && this.state.confirmDirty) {
      form.validateFields(['confirm'], { force: true })
    }
    handle()
  }

  render() {
    const { getFieldDecorator } = this.props.form

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    }

    return (
      <Form>
        <Form.Item
          {...formItemLayout}
          label="Username"
        >
          {getFieldDecorator('username', {
            rules: [{ required: !this.props.user, message: 'Please input username!' }],
            initialValue: this.props.user && this.props.user.username
          })(
            <Input disabled={!!this.props.user}/>
          )}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="Password"
        >
          {getFieldDecorator('password', {
            rules: [{
              required: !this.props.user, message: 'Please input your password!'
            }, {
              validator: this.validateToNextPassword
            }]
          })(
            <Input type="password" />
          )}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="Confirm Password"
        >
          {getFieldDecorator('confirm', {
            rules: [{
              required: !this.props.user, message: 'Please confirm your password!'
            }, {
              validator: this.compareToFirstPassword
            }]
          })(
            <Input type="password" onBlur={this.handleConfirmBlur} />
          )}
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          label="Level"
        >
          {getFieldDecorator('level', {
            initialValue: this.props.user ? this.props.user.level : this.props.authed.level + 1
          })(
            <Radio.Group buttonStyle="solid" size="small">
              <Radio.Button value={0} disabled={this.props.authed.level >= 0}>Super</Radio.Button>
              <Radio.Button value={1} disabled={this.props.authed.level >= 1}>Admin</Radio.Button>
              <Radio.Button value={2} disabled={this.props.authed.level >= 2}>Reporter</Radio.Button>
              <Radio.Button value={3} disabled={this.props.authed.level >= 3}>Customer</Radio.Button>
              <Radio.Button value={4} disabled={this.props.authed.level >= 4}>Vistor</Radio.Button>
            </Radio.Group>
          )}
        </Form.Item>
      </Form>
    )
  }
}

const WrappedRegistrationForm = Form.create()(RegistrationForm)

class NormalLoginForm extends React.Component {
  state = {
    confirmDirty: false
  }

  render() {
    const { getFieldDecorator } = this.props.form
    return (
      <Form className="login-form">
        <Form.Item>
          {getFieldDecorator('old_password', {
            rules: [{ required: true, message: 'Please input old password!' }]
          })(
            <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Old Password" />
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('password', {
            rules: [
              { required: true, message: 'Please input new assword!' }, {
                validator: this.validateToNextPassword
              }]
          })(
            <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="New Password" onBlur={this.handleConfirmBlur}/>
          )}
        </Form.Item>
        <Form.Item>
          {getFieldDecorator('repassword', {
            rules: [
              { required: true, message: 'Please input confirm assword!' }, {
                validator: this.compareToFirstPassword
              }]
          })(
            <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Confirm Password"/>
          )}
        </Form.Item>
      </Form>
    )
  }

  handleConfirmBlur = (e) => {
    const value = e.target.value
    this.setState({ confirmDirty: this.state.confirmDirty || !!value })
  }

  validateToNextPassword = (rule, value, handle) => {
    const form = this.props.form
    if (value && this.state.confirmDirty) {
      form.validateFields(['repassword'], { force: true })
    }
    handle()
  }

  compareToFirstPassword = (rule, value, handle) => {
    const form = this.props.form
    if (value && value !== form.getFieldValue('password')) {
      handle('Two passwords that you enter is inconsistent!')
    } else {
      handle()
    }
  }
}

const WrappedNormalLoginForm = Form.create()(NormalLoginForm)

class Settings extends React.Component {
  state = {
    port: 0,
    exceptionPath: '',
    logLevel: 'warn',
    changePasswordVisible: false,
    confirmLoading: false,
    addUserVisible: false,
    users: [],
    updateUser: null
  }

  componentDidMount () {
    axios.get('/info/config')
      .then(({data}) => {
        this.setState({
          port: data.port,
          exceptionPath: data.exceptionPath,
          logLevel: data.logLevel
        })
      })
    this.refreshUsers()
  }

  refreshUsers = () => {
    axios.get('/user/list')
      .then(({data}) => {
        this.setState({
          users: data
        })
      })
  }

  render () {
    const titleStyle = {float: 'right', marginRight: 10}
    const rowStyle = {marginBottom: 15}

    return (
      <div style={{margin: 10}}>
        <Divider>{this.props.intl.formatMessage({id: 'settings.server-group'})}</Divider>
        <Row style={rowStyle}>
          <Col span={8}>
            <span style={titleStyle}>{this.props.intl.formatMessage({id: 'settings.about'})}</span>
          </Col>
          <Col span={15}>
            Logactivate {pkg.version} - authed by R.J. Powered by React
          </Col>
        </Row>

        <Row style={rowStyle}>
          <Col span={8}>
            <span style={titleStyle}>{this.props.intl.formatMessage({id: 'settings.language'})}</span>
          </Col>
          <Col span={15}>
            <Radio.Group defaultValue={this.props.locale} buttonStyle="solid" size="small" onChange={this.changeLocale}>
              {
                Object.keys(locales).map(key =>
                  <Radio.Button key={key} value={key}>{locales[key].title}</Radio.Button>
                )
              }
            </Radio.Group>
          </Col>
        </Row>

        <Row style={rowStyle}>
          <Col span={8}>
            <span style={titleStyle}>{this.props.intl.formatMessage({id: 'settings.port'})}</span>
          </Col>
          <Col span={15}>
            <span>{this.state.port}</span>
          </Col>
        </Row>

        <Row style={rowStyle}>
          <Col span={8}>
            <span style={titleStyle}>{this.props.intl.formatMessage({id: 'settings.exceptionPath'})}</span>
          </Col>
          <Col span={15}>
            <span>{this.state.exceptionPath}</span>
          </Col>
        </Row>

        <Row style={rowStyle}>
          <Col span={8}>
            <span style={titleStyle}>{this.props.intl.formatMessage({id: 'settings.logLevel'})}</span>
          </Col>
          <Col span={15}>
            <Radio.Group value={this.state.logLevel} buttonStyle="solid" size="small">
              <Radio.Button value="fatal">Fatal</Radio.Button>
              <Radio.Button value="error">Error</Radio.Button>
              <Radio.Button value="warn">Warning</Radio.Button>
              <Radio.Button value="info">Info</Radio.Button>
              <Radio.Button value="debug">Debug</Radio.Button>
              <Radio.Button value="trace">Trace</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
        <Divider>{this.props.intl.formatMessage({id: 'settings.user-group'})}</Divider>
        <Row style={rowStyle}>
          <Col span={8}>
            <span style={titleStyle}>{this.props.intl.formatMessage({id: 'settings.user'})}</span>
          </Col>
          <Col span={15}>
            <span>{this.props.authed.username}</span>
            <Button size="small" type="primary" onClick={this.changePassword} className="setting-button">Change Password</Button>
            <Button size="small" type="danger" onClick={this.logout} className="setting-button">Logout</Button>
          </Col>
        </Row>
        <Row style={rowStyle}>
          <Col span={8}>
            <span style={titleStyle}>{this.props.intl.formatMessage({id: 'settings.user-level'})}</span>
          </Col>
          <Col span={15}>
            <Radio.Group value={this.props.authed.level} buttonStyle="solid" size="small">
              <Radio.Button value={0}>Super</Radio.Button>
              <Radio.Button value={1}>Admin</Radio.Button>
              <Radio.Button value={2}>Reporter</Radio.Button>
              <Radio.Button value={3}>Customer</Radio.Button>
              <Radio.Button value={4}>Vistor</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>

        <Divider>{this.props.intl.formatMessage({id: 'settings.users-group'})}</Divider>

        {
          this.state.users.map(u => (
            <div key={u.id}>
              <Row style={rowStyle}>
                <Col span={8}>
                  <span style={titleStyle}><Button shape="circle" icon="user" size="small" onClick={() => { this.updateUser(u) }}/> <b>{u.username}</b></span>
                </Col>
                <Col span={15}>
                  <Radio.Group value={u.level} buttonStyle="solid" size="small">
                    <Radio.Button value={0} >Super</Radio.Button>
                    <Radio.Button value={1}>Admin</Radio.Button>
                    <Radio.Button value={2}>Reporter</Radio.Button>
                    <Radio.Button value={3}>Customer</Radio.Button>
                    <Radio.Button value={4}>Vistor</Radio.Button>
                  </Radio.Group>
                  <Button shape="circle" icon="delete" type="danger" size="small" onClick={() => this.deleteUser(u.username)}/>
                </Col>
              </Row>
            </div>
          ))
        }

        <Row style={rowStyle}>
          <Col span={8}>
            <span style={titleStyle}><Button size="small" type="primary" shape="circle" icon="plus" onClick={this.addUser}/></span>
          </Col>
          <Col span={15}>
          </Col>
        </Row>

        <Modal title="Change Password"
          maskClosable={false}
          visible={this.state.changePasswordVisible}
          onOk={this.handleOk}
          confirmLoading={this.state.confirmLoading}
          onCancel={() => {
            this.setState({
              changePasswordVisible: false
            })
          }}
        >
          <WrappedNormalLoginForm
            ref={ (form) => { this.changePassForm = form } }
          />
        </Modal>

        <Modal title={this.state.updateUser ? 'Update User' : 'Add User'}
          maskClosable={false}
          visible={this.state.addUserVisible}
          onOk={this.handleAddUser}
          confirmLoading={this.state.confirmLoading}
          onCancel={() => {
            this.setState({
              addUserVisible: false
            })
          }}
        >
          <WrappedRegistrationForm
            ref={ (form) => { this.registerForm = form } }
            user={this.state.updateUser}
            authed={this.props.authed}
          />
        </Modal>
      </div>
    )
  }

  handleOk = () => {
    this.changePassForm.validateFields((err, values) => {
      if (!err) {
        this.setState({
          confirmLoading: true
        })
  
        axios.post('/user/password', {
          old_password: values.old_password,
          password: values.password
        })
          .then(() => {
            this.changePassForm.resetFields()
            this.setState({
              changePasswordVisible: false,
              confirmLoading: false
            })
          })
          .catch(e => {
            this.setState({
              confirmLoading: false
            })

            if (e.response && e.response.data) {
              message.error(e.response.data.message)
            } else {
              message.error('fail')
            }
          })
      }
    })
  }

  handleAddUser = () => {
    this.registerForm.validateFields((err, values) => {
      if (!err) {
        this.setState({
          confirmLoading: true
        })

        axios.post(this.state.updateUser ? `/user/${values.username}/update` : `/user/${values.username}/add`, values)
          .then(() => {
            this.registerForm.resetFields()
            this.setState({
              addUserVisible: false,
              confirmLoading: false
            })
            this.refreshUsers()
          })
          .catch(e => {
            this.setState({
              confirmLoading: false
            })

            if (e.response && e.response.data) {
              message.error(e.response.data.message)
            } else {
              message.error('fail')
            }
          })
      }
    })
  }

  addUser = () => {
    this.setState({
      addUserVisible: true,
      updateUser: null
    })
  }

  changePassword = () => {
    this.setState({
      changePasswordVisible: true
    })
  }

  deleteUser = (username) => {
    Modal.confirm({
      title: 'Do you want to delete user?',
      content: '',
      onOk: () => {
        axios.post('/user/' + username + '/del')
          .then(() => {
            this.refreshUsers()
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

  changeLocale = (e) => {
    const localeValue = e.target.value
    this.props.setLocale(localeValue)
  }

  updateUser = (user) => {
    this.setState({
      addUserVisible: true,
      updateUser: user
    })
  }

  logout = () => {
    axios.post('/user/logout')
      .then(() => {
        this.props.setAuthed({})
      })
  }
}

function mapStates (state) {
  return {
    locale: state.app.locale,
    authed: state.app.authed
  }
}

function mapDispatchs (dispatch) {
  return {
    setLocale: (locale) => dispatch({type: 'app/setLocale', locale}),
    setAuthed: (authed) => dispatch({type: 'app/setAuthed', authed})
  }
}

export default injectIntl(connect(mapStates, mapDispatchs)(Settings), {
  withRef: true
})
