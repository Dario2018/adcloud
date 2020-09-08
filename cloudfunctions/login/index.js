// 云函数模板
// 部署：在 cloud-functions/login 文件夹右击选择 “上传并部署”

const cloud = require('wx-server-sdk')

// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 这个示例将经自动鉴权过的小程序用户 openid 返回给小程序端
 * 
 * event 参数包含小程序端调用传入的 data
 * 
 */
exports.main = async (event, context) => {
  // console.log(event)
  // console.log(context)
  // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID、及 UNIONID（需满足 UNIONID 获取条件）等信息
  const wxContext = cloud.getWXContext()
  // 简单的路由
  if (event.action && loginHelper[event.action]) {
    const result = await loginHelper[event.action](wxContext, event)
    return result
  }
  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
    env: wxContext.ENV,
  }
}
// 可执行其他自定义逻辑
// console.log 的内容可以在云开发云函数调用日志查看
const db = cloud.database()
const _ = db.command
// 函数列表
const loginHelper = {
  async findUserInfo(context, params) {
    // implement me:查询数据
    const doc = await db.collection('userInfo').where({
      openid: context.OPENID
    }).get()
    if (doc.data.length != 0) {
      const userInfo = doc.data[0]
      doc.data[0] = {
        _id: userInfo._id,
        avatarUrl: userInfo.avatarUrl[userInfo.avatarUrl.length - 1],
        checked: userInfo.checked,
        city: userInfo.city[userInfo.city.length - 1],
        country: userInfo.country[userInfo.country.length - 1],
        gender: userInfo.gender[userInfo.gender.length - 1],
        language: userInfo.language[userInfo.language.length - 1],
        nickName: userInfo.nickName[userInfo.nickName.length - 1],
        openid: userInfo.openid,
        province: userInfo.province[userInfo.province.length - 1],
        unionid: userInfo.unionid,
        showCity: userInfo.showCity,
        hasGender: userInfo.hasGender,
      }
    }
    return doc
  },
  async addUserInfo(context, params) {
    const doc = await db.collection('userInfo').add({
      data: {
        createTime: Date.now(),
        updateTime: Date.now(),
        openid: context.OPENID,
        appid: context.APPID,
        unionid: context.UNIONID,
        mycollects: [], //喜欢的收藏文章
        loves: [], //自己关注的用户的openip
        fans: [], // 被其他用户关注的对应openid
        bgUrl: ["https://img1.gtimg.com/10/1048/104857/10485731_980x1200_0.jpg"],
        showCity: false,
        hasGender: false,
        role: 1, // 0-系统管理员，1-普通用户
        ...params.userInfo
      }
    })
    return doc
  },
  /**
   *获取我喜欢的文章列表
   */
  async myloveList(context, params) {
    const userInfo = await db.collection('userInfo').where({
      openid: context.OPENID
    }).get()
    const [user] = userInfo.data
    const doc = await db.collection('messages').where({
      _id: db.command.in(user.mycollects)
    }).orderBy('createTime', 'desc').get()
    return doc
  },
  /**
   * 关注
   */
  async attention(context, params) {
    const openid = params.openid // 被关注人的openid
    const str_date=params.str_date
    if (!openid || openid == context.OPENID) return {
      status: -200,
      message: 'not found'
    }
    const userInfo = await db.collection('userInfo').where({
      openid: context.OPENID // 自己的
    }).get()
    const [user] = userInfo.data
    if (user.loves.indexOf(openid) < 0) {
      user.loves.push(openid)
      const my = await db.collection('userInfo').where({
        _id: user._id
      }).update({
        data: {
          updateTime: Date.now(),
          loves: user.loves
        }
      })
    }
    // 被关注者的
    const attanter = await db.collection('userInfo').where({
      openid: openid
    }).get()
    const [attantor] = attanter.data
    if (attantor.fans.indexOf(context.OPENID) < 0) {
      attantor.fans.push(context.OPENID)
      const doc = await db.collection('userInfo').where({
        _id: attantor._id
      }).update({
        data: {
          updateTime: Date.now(),
          fans: attantor.fans
        }
      })
      // 生成 关注记录
      const detatils_info = await db.collection('attention_details').where({
        loves_openid: openid, // 被关注的
        fancs_openid: context.OPENID, //成为粉丝的
      }).get()
      if (detatils_info.data.length == 0) {
        // 添加关注记录
        const detais = await db.collection('attention_details').add({
          data: {
            createTime: Date.now(),
            str_date,
            loves_openid: openid, // 被关注的
            fancs_openid: context.OPENID, //成为粉丝的
            type: 1,
            createTime: Date.now()
          }
        })
      }
    }
    return {
      status: 200,
      message: 'update success'
    }
  },
  /**
   * 取消关注
   */
  async removeAttention(context, params) {
    const openid = params.openid // 被关注人的openid
    if (!openid || openid == context.OPENID) return {
      status: -200,
      message: 'not found'
    }
    const userInfo = await db.collection('userInfo').where({
      openid: context.OPENID // 自己的
    }).get()
    const [user] = userInfo.data
    if (user.loves.indexOf(openid) >= 0) {
      console.log(user.loves.indexOf(openid))
      user.loves.splice(user.loves.indexOf(openid), 1)
      const my = await db.collection('userInfo').where({
        _id: user._id
      }).update({
        data: {
          updateTime: Date.now(),
          loves: user.loves
        }
      })
    }
    // 被关注者的
    const attanter = await db.collection('userInfo').where({
      openid: openid
    }).get()
    const [attantor] = attanter.data
    if (attantor.fans.indexOf(context.OPENID) >= 0) {
      attantor.fans.splice(attantor.fans.indexOf(context.OPENID), 1)
      const doc = await db.collection('userInfo').where({
        _id: attantor._id
      }).update({
        data: {
          updateTime: Date.now(),
          fans: attantor.fans
        }
      })
    }
    return {
      status: 200,
      message: 'update success'
    }
  },
}