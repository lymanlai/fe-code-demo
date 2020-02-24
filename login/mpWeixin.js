import Config from '@/ifs/Config'
import Request from '@/ifs/Request'
import Log from '@/ifs/Log'
Log.enable('ifs/login/mpWeixin')
const log = Log.sectionLog('ifs/login/mpWeixin')
const providerObj = {
  provider: 'weixin',
}
export const login = async () => {
  // 获得 code
  const [loginErr, { code }] = await uni.login(providerObj)
  if (loginErr) {
    log.error('mpWeixin.loginErr', loginErr)
    return loginErr
  }

  // 获得用户授权允许
  const [getUserInfoErr, data] = await uni.getUserInfo(providerObj)
  if (getUserInfoErr) {
    log.error('mpWeixin.getUserInfo', getUserInfoErr)
    uni.showModal({
      title: '提示',
      content: '请点击"允许"按钮授权, 否则无法正常登录',
      showCancel: false,
      confirmText: '知道啦',
    })
    return false
  }
  data.code = code
  const refCode = uni.getStorageSync('refCode')
  if (refCode) {
    data['refCode'] = refCode
  }
  const mpWeixinId = Config.get('mpWeixinId')
  const url = `/ifs/public/login/mp-weixin?mpWeixinId=${mpWeixinId}`
  const rz = await Request({
    prefix: 'ifsApi',
    url,
    method: 'POST',
    data,
  })

  return rz
}
