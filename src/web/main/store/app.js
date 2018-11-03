import {detectLocale} from '../locales'

export default {
  state: {
    authed: {},
    locale: detectLocale()
  },
  reducers: {
    setLocale (state, action) {
      return {...state, locale: action.locale}
    },
    setAuthed (state, action) {
      return {...state, authed: {...action.authed}}
    }
  }
}
