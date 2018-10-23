import React from 'react'
import PropTypes from 'prop-types'
import { render } from 'react-dom'
import store from './store'
import { connect, Provider } from 'react-redux'
import { LocaleProvider } from 'antd'
import { IntlProvider } from 'react-intl'
import {locales} from './locales'
import moment from 'moment'

import './style.less'

import App from './components/app'
import Auth from './components/auth'

moment.locale(store.getState().app.locale)

class Root extends React.Component {
  constructor () {
    super()
    this.state = {
      authed: false
    }
  }
  render () {
    const { locale } = this.props
    return (
      <LocaleProvider locale={locales[locale].antd}>
        <IntlProvider locale={locale} messages={locales[locale].messages}>
          {
            this.state.authed ? <App/> : <Auth onAuthed={() => this.setState({authed: true})}/>
          }
        </IntlProvider>
      </LocaleProvider>
    )
  }
}

Root.propTypes = {
  locale: PropTypes.string
}

function mapStates (state) {
  return {
    locale: state.app.locale
  }
}

const RootElement = connect(mapStates)(Root)

render(
  <Provider store={store}>
    <RootElement/>
  </Provider>, document.getElementById('app'))
