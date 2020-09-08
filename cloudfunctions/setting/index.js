// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  //简单路由
  if (event.action && settingHelper[event.action]) {
    const result = await settingHelper[event.action](wxContext, event)
    return result
  }
  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}

const db = cloud.database()
const _ = db.command

const settingHelper = {
  async updateAvatarUrl(context, params) {
    const avatarUrl = params.avatarUrl
    // console.log(avatarUrl);
    if (!avatarUrl) return {
      status: -200,
      message: 'update failed'
    }
    const userInfo = await db.collection('userInfo').where({
      openid: context.OPENID
    }).get()
    const [user] = userInfo.data
    user.avatarUrl.push(avatarUrl);
    const doc = await db.collection('userInfo').where({
      _id: user._id
    }).update({
      data: {
        avatarUrl: user.avatarUrl,
        updateTime: Date.now(),
      }
    })
    return doc
  },
  async updateNickName(context, params) {
    const nickName = params.nickName
    if (!nickName) return {
      status: -200,
      message: 'update failed'
    }
    const userInfo = await db.collection('userInfo').where({
      openid: context.OPENID
    }).get()
    const [user] = userInfo.data
    user.nickName.push(nickName);
    const doc = await db.collection('userInfo').where({
      _id: user._id
    }).update({
      data: {
        nickName: user.nickName,
        updateTime: Date.now(),
      }
    })
    return doc
  },
  async updateGender(context, params) {
    const gender = params.gender
    if (!gender) return {
      status: -200,
      message: 'update failed'
    }
    const userInfo = await db.collection('userInfo').where({
      openid: context.OPENID
    }).get()
    const [user] = userInfo.data
    user.gender.push(gender == 0 || gender == '0' ? 0 : 1);
    const doc = await db.collection('userInfo').where({
      _id: user._id
    }).update({
      data: {
        gender: user.gender,
        hasGender: true,
        updateTime: Date.now(),
      }
    })
    return doc
  },
  async updateCity(context, params) {
    const city = params.city
    const province = params.province
    if (!city || !province) return {
      status: -200,
      message: 'update failed'
    }
    const userInfo = await db.collection('userInfo').where({
      openid: context.OPENID
    }).get()
    const [user] = userInfo.data
    user.province.push(province)
    user.city.push(city);
    const doc = await db.collection('userInfo').where({
      _id: user._id
    }).update({
      data: {
        province: user.province,
        city: user.city,
        showCity: true,
        updateTime: Date.now(),
      }
    })
    return doc
  }
}