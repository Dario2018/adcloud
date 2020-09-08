// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  //简单路由
  if (event.action && messagesHelper[event.action]) {
    const result = await messagesHelper[event.action](wxContext, event)
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
const messagesHelper = {
  /**添加文章 */
  async addmessages(context, params) {
    const addImageoneUrl = params.addImageoneUrl
    const addImagetwoUrl = params.addImagetwoUrl
    const addVideoUrl = params.addVideoUrl
    const content = params.content
    const type = params.type
    const title = params.title
    const str_date = params.str_date

    if (!addImageoneUrl || !content || !type || !title || !str_date) return {
      status: -200,
      message: 'addImageoneUrl and content not null '
    }
    const doc = await db.collection('messages').add({
      data: {
        createTime: Date.now(),
        updateTime: Date.now(),
        openid: context.OPENID,
        status: 3, // 0-新建后审核,1-修改后审核（暂无），2-审核不通过,3-审核通过
        clicks: 0,
        delete_state: 1, //有效，0-无效
        loves: [], // 被人收藏或喜欢的的openid
        type,
        title,
        addImageoneUrl,
        addImagetwoUrl,
        addVideoUrl,
        content,
        str_date
      }
    })
    return doc
  },
  /**
   * 根据openid获取发布的
   * 
   */
  async getHistoryMessagesList(context, params) {
    let openid = params.openid
    let isShowAttention
    if (!openid || openid == context.OPENID) { // 都是获取自己的
      isShowAttention = false
      openid = context.OPENID
    } else {
      isShowAttention = true // 显示关注
    }
    let hasAttented = false // 是否已经关注了
    let doc = await db.collection('messages').where({
      openid: openid,
      delete_state: 1
    }).orderBy('createTime', 'desc').get()
    const userInfodoc = await db.collection('userInfo').where({
      openid: openid
    }).get()
    const [user] = userInfodoc.data
    if (user && user.fans.indexOf(openid) >= 0) { // 判断粉丝是否已经包含此用户，自己不包括自己
      hasAttented = true
    }
    // for (let i = 0; i < doc.data.length; i++) {
    //   doc.data[i].nickName = user.nickName[user.nickName.length - 1]
    //   doc.data[i].avatarUrl = user.avatarUrl[user.avatarUrl.length - 1]
    // }
    doc.userInfo = user;
    doc.isShowAttention = isShowAttention;
    doc.hasAttented = hasAttented;
    return doc;
  },
  /**
   * 删除文章，需要是发布者才能删除
   */
  async deleteMessages(context, params) {
    const _id = params._id
    if (!_id) return {
      status: -200,
      message: 'not found'
    }
    const doc = await db.collection('messages').where({
      _id: params._id,
      openid: context.OPENID
    }).update({
      data: {
        delete_state: 0,
      }
    })
    return doc
  },
  /**
   * 更新封面
   */
  async updateBgUrl(context, params) {
    const bgUrl = params.bgUrl
    // console.log(bgUrl)
    if (!bgUrl) return {
      status: -200,
      message: 'update failed'
    }
    const userInfo = await db.collection('userInfo').where({
      openid: context.OPENID
    }).get()
    const [user] = userInfo.data
    user.bgUrl.push(bgUrl);
    const doc = await db.collection('userInfo').where({
      _id: user._id
    }).update({
      data: {
        bgUrl: user.bgUrl,
        updateTime: Date.now(),
      }
    })
    return doc
  },
  /**
   * 获取 指定类型和数量的 审核通过的文章文章列表
   */
  async getMessagesList(context, params) {
    const num = params.num
    const type = params.type
    let currentpage = params.currentpage
    let skipNum=num*(currentpage-1)
    // 先查询数据总数
    let page_info={}
   await db.collection('messages').where({
      status: 3,
      type: type
    }).count().then(res => {
      page_info.totalSize = res.total
      if(skipNum>=res.total){
        skipNum=0
        page_info.nextPage = 2
      }else{ 
        page_info.nextPage = currentpage + 1
      }
    })
    const doc = await db.collection('messages').where({
      status: 3,
      type: type
    }).orderBy('createTime', 'desc').skip(skipNum).limit(num).get()

    for (let i = 0; i < doc.data.length; i++) {
      let userInfodoc = await db.collection('userInfo').where({
        openid: doc.data[i].openid
      }).get()
      let [user] = userInfodoc.data
      doc.data[i].nickName = user.nickName[user.nickName.length - 1]
      doc.data[i].avatarUrl = user.avatarUrl[user.avatarUrl.length - 1]
      doc.data[i].openid = user.openid
    }
    doc.page_info=page_info
    return doc
  },
  /**
   * 查找指定id的文章
   */
  async findMessages(context, params) {
    const _id = params._id
    if (!_id) return {
      status: -200,
      message: 'not found'
    }
    // implement me:查询数据
    const doc = await db.collection('messages').where({
      _id: _id
    }).get()
    const userInfoDoc = await db.collection('userInfo').where({
      openid: doc.data[0].openid
    }).get()
    const [user] = userInfoDoc.data
    doc.data[0].nickName = user.nickName[user.nickName.length - 1]
    doc.data[0].lovesnum = doc.data[0].loves.length
    if (doc.data[0].loves.indexOf(user.openid) >= 0) {
      doc.data[0].hasLoved = true
    } else {
      doc.data[0].hasLoved = false
    }
    return doc
  },
  /**
   * 增加点击量
   */
  async addClicks(context, params) {
    const _id = params._id // 文章id
    if (!_id) return {
      status: -200,
      message: 'not found'
    }
    const str_date = params.str_date
    // implement me:查询数据
    const messageRes = await db.collection('messages').where({
      _id: _id
    }).get()
    const [message] = messageRes.data
    // if(context.OPENID==message.openid){
    //   return
    // }
    const scanInfores = await db.collection('scans_info').where({
      messageId: _id,
      scan_openid: context.OPENID, //浏览者的openid
      str_date: str_date,
      type: 1
    }).get()
    if (scanInfores.data.length > 0) {
      return {
        status: -200,
        message: 'has clicked'
      }
    }
    const res = await db.collection('scans_info').add({
      data: {
        createTime: Date.now(),
        updateTime: Date.now(),
        scan_openid: context.OPENID, // 浏览者openid
        messageId: _id, // 文章id
        author_openid: message.openid, // 文章作者id
        str_date: str_date,
        type: 1 // 类型
      }
    })
    //更新点击量
    const doc = await db.collection('messages').where({
      _id: message._id
    }).update({
      data: {
        clicks: message.clicks + 1,
        updateTime: Date.now(),
      }
    })
    return doc
  },
  /**
   * 更新文章
   */
  async updateMessages(context, params) {
    const messages = params.messages
    if (!messages || !messages._id) return {
      status: -200,
      message: 'not found'
    }
    // implement me:查询数据
    const doc = await db.collection('messages').where({
      _id: params._id
    }).update({
      data: {
        updateTime: Date.now(),
        content: params.content,
        title: params.title,
        delete_state: 1,
        addImageoneUrl: params.addImageoneUrl,
        addImagetwoUrl: params.addImagetwoUrl,
        addVideoUrl: params.addVideoUrl,
        status: 1, // 待管理员审核
      }
    })
    return doc
  },
  /**
   * 管理员专用:获取 需要审核 或者已经审核失败的文章
   */
  async getAllMessages(context, params) {
    const doc = await db.collection('messages').where({
      status: _.lt(3)
    }).orderBy('createTime', 'desc').get()
    return doc
  },
  /**
   *管理员审核文章的
   */
  async checkedMessages(context, params) {
    const _id = params._id
    const status = prams.status // 只能2-审核不通过，3-审核通过
    if (!_id || (status != 2 && status != 3)) return {
      status: -200,
      message: 'not found'
    }
    const doc = await db.collection('messages').where({
      _id: _id
    }).update({
      data: {
        status: status,
      }
    })
    return doc
  },
  /**
   * 显示最近浏览
   */
  async showLocalScan(context, params) {
    const _ids = params._ids

    if (!_ids) return {
      status: -200,
      message: 'not found'
    }
    const doc = await db.collection('messages').where({
      _id: db.command.in(_ids)
    }).get()
    return doc
  },
  /**
   * 添加喜欢的文章,
   */
  async addCollection(context, params) {
    const _id = params._id // 文章id
    const str_date = params.str_date
    if (!_id || !str_date) return {
      status: -200,
      message: 'not found'
    }

    // 更新文章
    const messageRes = await db.collection('messages').where({
      _id: _id
    }).get()
    const [messages] = messageRes.data
    let updateMessageFlag = true
    for (let a = 0; a < messages.loves.length; a++) {
      if (messages.loves[a] == context.OPENID) { // 是否包含
        updateMessageFlag = false
        break
      }
    }
    messages.loves.push(context.OPENID)
    if (updateMessageFlag) {
      const updateMessage = await db.collection('messages').where({
        _id: _id
      }).update({
        data: {
          updateTime: Date.now(),
          loves: messages.loves
        }
      })
    }
    //更新用户收藏
    const userInfoDoc = await db.collection('userInfo').where({
      openid: context.OPENID
    }).get()
    const [user] = userInfoDoc.data
    let updateUserFlag = true
    for (let i = 0; i < user.mycollects.length; i++) {
      if (user.mycollects[i] == _id) { // 包含了则不用再添加了
        updateUserFlag = false
        break
      }
    }
    user.mycollects.push(_id)
    if (updateUserFlag) {
      const doc = await db.collection('userInfo').where({
        openid: context.OPENID
      }).update({
        data: {
          updateTime: Date.now(),
          mycollects: user.mycollects
        }
      })
    }
    // 收藏只能一条，访问每天可以增加一条
    const scanInfores = await db.collection('scans_info').where({
      messageId: _id,
      scan_openid: context.OPENID, //收藏者的openid,1-表示浏览者的openid
      type: 2 // 1-点击类型，2-收藏类型
    }).get()
    if (scanInfores.data.length > 0) {
      return {
        status: -200,
        data: messages.loves.length,
        message: 'has collected'
      }
    }
    const res = await db.collection('scans_info').add({
      data: {
        createTime: Date.now(),
        updateTime: Date.now(),
        scan_openid: context.OPENID, // 收藏者的openid
        messageId: _id, //文章id
        author_openid: messages.openid, // 文章作者id
        str_date: str_date,
        type: 2 // 类型
      }
    })
    return {
      status: 200,
      data: messages.loves.length,
      message: 'add success'
    }
  },
  /**
   * 移除喜欢的文章,
   */
  async removeCollection(context, params) {
    const _id = params._id // 文章id
    if (!_id) return {
      status: -200,
      message: 'not found'
    }
    //更新用户收藏
    const userInfoDoc = await db.collection('userInfo').where({
      openid: context.OPENID
    }).get()
    const [user] = userInfoDoc.data
    if (user.mycollects.indexOf(_id) >= 0) {
      user.mycollects.splice(user.mycollects.indexOf(_id), 1)
      const doc = await db.collection('userInfo').where({
        openid: context.OPENID
      }).update({
        data: {
          updateTime: Date.now(),
          mycollects: user.mycollects
        }
      })
    }
    // 更新 文章
    const messagesDoc = await db.collection('messages').where({
      _id: _id
    }).get()
    const [messages] = messagesDoc.data
    if (messages.loves.indexOf(context.OPENID) >= 0) {
      messages.loves.splice(messages.loves.indexOf(context.OPENID), 1)
      const updateMessage = await db.collection('messages').where({
        _id: _id
      }).update({
        data: {
          updateTime: Date.now(),
          loves: messages.loves
        }
      })
    }
    return {
      status: 200,
      data: messages.loves.length,
      message: 'remove success'
    }
  },
}