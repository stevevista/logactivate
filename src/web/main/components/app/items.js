import {Icon} from 'antd'

export default [
  {
    icon: Icon,
    iconType: 'setting',
    messageId: 'sidebar.setting',
    path: 'test',
    component: require('../settings').default
  },
  {
    icon: Icon,
    iconType: 'link',
    label: 'Demo',
    path: 'demo',
    component: require('../presentation').default
  }
]
