import React from 'react'
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
  render () {
    const { locale } = this.props
    return (
      <LocaleProvider locale={locales[locale].antd}>
        <IntlProvider locale={locale} messages={locales[locale].messages}>
          {
            this.props.authed.username ? <App/> : <Auth/>
          }
        </IntlProvider>
      </LocaleProvider>
    )
  }
}

function mapStates (state) {
  return {
    locale: state.app.locale,
    authed: state.app.authed
  }
}

const RootElement = connect(mapStates)(Root)

render(
  <Provider store={store}>
    <RootElement/>
  </Provider>, document.getElementById('app'))
