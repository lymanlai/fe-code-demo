import Request from '@/ifs/Request'
import Log from '@/ifs/Log'
import Config from '@/ifs/Config'
Log.enable('mobile')
const log = Log.sectionLog('mobile')
const url = `/ifs/public/login/mobile`

export const login = async data => {
  if (!data.mobile || data.mobile.length !== 11) {
    uni.showToast({
      title: '请输入11位的手机号',
      icon: 'none'
    })
    return false
  }
  if (!data.code) {
    uni.showToast({
      title: '请输入验证码',
      icon: 'none'
    })
    return false
  }

  const postData = {
    url,
    method: 'POST',
    data
  }
  const userInfo = await Request(postData)
  log(userInfo)
  if (userInfo && userInfo.error) {
    await uni.showModal({
      content: userInfo.message
    })
    return false
  }
  return userInfo
}
