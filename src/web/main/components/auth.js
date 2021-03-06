import React from 'react'
import { Form, Icon, Input, Button, message } from 'antd'
import axios from 'axios'
import { injectIntl } from 'react-intl'
import { connect } from 'react-redux'

const FormItem = Form.Item

function hasErrors(fieldsError) {
  return Object.keys(fieldsError).some(field => fieldsError[field])
}

class HorizontalLoginForm extends React.Component {
  componentDidMount() {
    // To disabled submit button at the beginning.
    this.props.form.validateFields()
    axios.get('/user/auth')
      .then((res) => {
        this.props.setAuthed(res.data)
      })
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.form.validateFields((err, values) => {
      if (!err) {
        axios.post('/user/auth', values)
          .then((res) => {
            this.props.setAuthed(res.data)
          })
          .catch(e => {
            console.log(e.response)
            if (e.response && e.response.data) {
              message.error(e.response.data)
            } else {
              message.error('login fail')
            }
          })
      }
    })
  }

  render() {
    const { getFieldDecorator, getFieldsError, getFieldError, isFieldTouched } = this.props.form

    // Only show error after a field is touched.
    const userNameError = isFieldTouched('username') && getFieldError('username')
    const passwordError = isFieldTouched('password') && getFieldError('password')
    return (
      <Form layout="inline" onSubmit={this.handleSubmit}>
        <FormItem
          validateStatus={userNameError ? 'error' : ''}
          help={userNameError || ''}
        >
          {getFieldDecorator('username', {
            rules: [{ required: true, message: 'Please input your username!' }]
          })(
            <Input prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="Username" />
          )}
        </FormItem>
        <FormItem
          validateStatus={passwordError ? 'error' : ''}
          help={passwordError || ''}
        >
          {getFieldDecorator('password', {
            rules: [{ required: true, message: 'Please input your Password!' }]
          })(
            <Input prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />} type="password" placeholder="Password" />
          )}
        </FormItem>
        <FormItem>
          <Button
            type="primary"
            htmlType="submit"
            disabled={hasErrors(getFieldsError())}
          >
            Log in
          </Button>
        </FormItem>
      </Form>
    )
  }
}

const WrappedHorizontalLoginForm = Form.create()(HorizontalLoginForm)

function mapStates (state) {
  return {
    authed: state.app.authed
  }
}

function mapDispatchs (dispatch) {
  return {
    setAuthed: (authed) => dispatch({type: 'app/setAuthed', authed})
  }
}

const LoginForm = injectIntl(connect(mapStates, mapDispatchs)(WrappedHorizontalLoginForm), {
  withRef: true
})


export default class Settings extends React.Component {
  render () {
    return (
      <div style={{
        marginRight: 'auto',
        marginLeft: 'auto',
        height: 200,
        width: 600,
        verticalAlign: 'middle',
        lineHeight: 200
      }}>
        <LoginForm/>
      </div>
    )
  }

  componentDidMount () {
  }

  componentWillUnmount () {
  }
}
