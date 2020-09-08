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
  if (event.action && reportsHelper[event.action]) {
    const result = await reportsHelper[event.action](wxContext, event)
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
const $ = _.aggregate
// 函数列表
const reportsHelper = {
  async getReportData(context, params) {
    const dateArr = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(new Date(new Date().toLocaleDateString()).getTime() - i * 24 * 60 * 60 * 1000)
      let YY = date.getFullYear() + '-';
      let MM = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
      let DD = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate());
      dateArr.push(YY + MM + DD)
    }
    // 七天前 零点
    const startTime = new Date(new Date(new Date().toLocaleDateString()).getTime() - 6 * 24 * 60 * 60 * 1000).getTime()
    // 到今天23:59:59
    // const endTiem = new Date(new Date(new Date().toLocaleDateString()).getTime() + 24 * 60 * 60 * 1000 - 1).getTime()

    let data = {
      dateArr: dateArr.reverse(),
      totalData: {}
    }
    // 发表文章
    await db.collection('messages').aggregate()
      .match({
        openid: context.OPENID,
        createTime: _.gte(startTime)
      }).group({
        _id: '$str_date',
        num: $.sum(1)
      }).end().then((res) => {
        const messageslist = []
        let sevenTotalmessages = 0
        for (let i = 0; i < 7; i++) {
          messageslist[i] = 0
          for (let j = 0; j < res.list.length; j++) {
            if (res.list[j]._id == dateArr[i]) {
              messageslist[i] = res.list[j].num
              sevenTotalmessages += res.list[j].num
              break
            }
          }
        }
        data.messageslist = messageslist
        data.totalData.sevenTotalmessages = sevenTotalmessages
      })
    // 访问量
    await db.collection('scans_info').aggregate()
      .match({
        author_openid: context.OPENID,
        type: 1,
        createTime: _.gte(startTime)
      }).group({
        _id: '$str_date',
        num: $.sum(1)
      }).end().then((res) => {
        const clickslist = []
        let sevenTotalclicks = 0;
        for (let i = 0; i < 7; i++) {
          clickslist[i] = 0
          for (let j = 0; j < res.list.length; j++) {
            if (res.list[j]._id == dateArr[i]) {
              clickslist[i] = res.list[j].num
              sevenTotalclicks += res.list[j].num
              break
            }
          }
        }
        data.clickslist = clickslist
        data.totalData.sevenTotalclicks = sevenTotalclicks
      })
    // 被喜欢
    await db.collection('scans_info').aggregate()
      .match({
        author_openid: context.OPENID,
        type: 2,
        createTime: _.gte(startTime)
      }).group({
        _id: '$str_date',
        num: $.sum(1)
      }).end().then((res) => {
        const loveslist = []
        let sevenTotalloves = 0
        for (let i = 0; i < 7; i++) {
          loveslist[i] = 0
          for (let j = 0; j < res.list.length; j++) {
            if (res.list[j]._id == dateArr[i]) {
              loveslist[i] = res.list[j].num
              sevenTotalloves += res.list[j].num
              break
            }
          }
        }
        data.loveslist = loveslist
        data.totalData.sevenTotalloves = sevenTotalloves
      })
    // 粉丝
    await db.collection('attention_details').aggregate()
      .match({
        loves_openid: context.OPENID,
        createTime: _.gte(startTime)
      }).group({
        _id: '$str_date',
        num: $.sum(1)
      }).end().then((res) => {
        const fenslist = []
        let sevenTotalfens = 0
        for (let i = 0; i < 7; i++) {
          fenslist[i] = 0
          for (let j = 0; j < res.list.length; j++) {
            if (res.list[j]._id == dateArr[i]) {
              fenslist[i] = res.list[j].num
              sevenTotalfens += res.list[j].num
              break
            }
          }
        }
        data.fenslist = fenslist
        data.totalData.sevenTotalfens = sevenTotalfens
      })
      // 截取日期的月-日
      for(let i=0;i<data.dateArr.length;i++){
        data.dateArr[i]=data.dateArr[i].substr(5)
      }
    return {
      stutas: 200,
      data: data,
      message: 'success'
    }
  },
}