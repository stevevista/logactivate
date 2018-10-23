import {Icon} from 'antd'

export default [
  {
    icon: Icon,
    iconType: 'cloud',
    label: 'Logview',
    path: 'log',
    component: require('../log').default
  },
  {
    icon: Icon,
    iconType: 'link',
    label: 'OTA',
    path: 'ota',
    component: require('../ota').default
  },
  {
    icon: Icon,
    iconType: 'setting',
    messageId: 'sidebar.setting',
    path: 'test',
    component: require('../settings').default
  }
]
