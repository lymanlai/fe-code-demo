import Request from '@/ifs/Request'
import Log from '@/ifs/Log'
import Config from '@/ifs/Config'
const providerObj = {
  provider: 'sinaweibo'
}
// Log.enable('appWeibo')
const log = Log.sectionLog('appWeibo')

export const login = async () => {
  const [err, { authResult: data }] = await uni.login(providerObj)
  if (err) {
    log.error(`appWeibo.login`, err, data)
    return false
  }
  const appWeiboId = Config.get('appWeiboId')
  const url = `/ifs/public/login/app-weibo?appWeiboId=${appWeiboId}`
  const userInfo = await Request({
    url,
    prefix: 'ifsApi',
    method: 'POST',
    data
  })

  return userInfo
}
