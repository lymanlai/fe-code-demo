import { isWXInstalled } from '@/ifs/app-plus-utils'
import Request from '@/ifs/Request'
import Config from '@/ifs/Config'
import Log from '@/ifs/Log'
// Log.enable('appWeixin')
const log = Log.sectionLog('appWeixin')

function promisefyFn (fn, opts) {
  return new Promise((resolve, reject) => fn(resolve, reject, opts))
}
// weixin only: http://www.html5plus.org/doc/zh_cn/oauth.html#plus.oauth.AuthService.authorize
export async function doWeixinAppAuthorize (appid) {
  const list = await promisefyFn(plus.oauth.getServices)
  const service = list.find(item => item.id === 'weixin')
  // Authorize here
  // 1. this is not work!!! fuck!!!
  // const authRz = await promisefyFn(service.authorize, {appid})
  // 2. this is work!!
  return new Promise((resolve, reject) => {
    service.authorize(resolve, reject, {
      appid
    })
  })
}

export async function login () {
  const appWeixinId = Config.get('appWeixinId')
  let authRz = ''
  try {
    authRz = await doWeixinAppAuthorize(appWeixinId)
  } catch (e) {
    log.error(`appWeixin ${appWeixinId}`, authRz, e)
    return false
  }
  if (!authRz.code) {
    log.error(`appWeixin ${appWeixinId}`, authRz)
  }
  const url = `/ifs/public/login/app-weixin?appWeixinId=${appWeixinId}`
  const loginInfo = await Request({
    url,
    prefix: 'ifsApi',
    method: 'POST',
    data: {
      code: authRz.code
    }
  })

  if (!loginInfo) {
    await confirmWechatAppDownload('微信 App 登录服务器接口未返回用户信息')
  }
  log(loginInfo)
  return loginInfo
}

export const confirmWechatAppDownload = async content => {
  if (isWXInstalled()) {
    log.error(content)
    await uni.showModal({
      content,
      cancelText: '取消',
      confirmText: '确定'
    })
    return
  }
  const [error, { confirm }] = await uni.showModal({
    content: '您还未安装微信',
    cancelText: '取消',
    confirmText: '去下载'
  })
  if (confirm) {
    plus.runtime.openURL('https://itunes.apple.com/cn/app/wei-xin/id414478124?mt=8')
  }
}
