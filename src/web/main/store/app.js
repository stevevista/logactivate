import {detectLocale} from '../locales'

export default {
  state: {
    authed: {},
    selectedPage: 'devices',
    locale: detectLocale()
  },
  reducers: {
    switchPage (state, action) {
      return {...state, selectedPage: action.page}
    },
    setLocale (state, action) {
      return {...state, locale: action.locale}
    },
    setAuthed (state, action) {
      return {...state, authed: {...action.authed}}
    }
  }
}
