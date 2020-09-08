// miniprogram/pages/history/history.js

import dayjs from 'dayjs'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    messageslist: null, // 发布列表
    userInfo:null,  // 信息
    isShowAttention:false, // 显示关注
    hasAttented:false // 显示是否已经关注
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
   
    let openid;
    if(!options.openid){
      openid=null
    }else{
      openid=options.openid
    }
    wx.showLoading({
      title: '加载中...',
    })
    // 获取发布的文章列表
    this.getHistoryMessagesList({openid:options.openid});

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  /**
   * 获取自己或者他人发布列表
   * openid:null 获取自己
   * openid:！null获取别人或者自己的
   *  
   */
  getHistoryMessagesList: async function (params) {
    wx.cloud.callFunction({
      name: 'messages',
      data: {
        action: 'getHistoryMessagesList',
        openid:params.openid
      },
      success: res => {
        // console.log("getHistoryMessagesList res=", res)
        if (res.errMsg == "cloud.callFunction:ok") {
          const messageslist = res.result.data
          const userInfo =res.result.userInfo
          const isShowAttention=res.result.isShowAttention
          const hasAttented=res.result.hasAttented
          this.setData({
            messageslist,
            userInfo,
            isShowAttention,
            hasAttented
          })
        }
      },
      complete: res => {
        wx.hideLoading({
          success: (res) => {},
        })
      }
    })
  },
  /**
   * 发布者删除发布文章
   */
  deleteMessage: function (e) {
    const id = e.currentTarget.dataset.id;
    if (id == '' || id == undefined || id == null) {
      wx.showToast({
        title: '删除失败',
      })
      return
    }
    wx.showLoading({
      title: '正在删除...',
    })
    wx.cloud.callFunction({
      name: 'messages',
      data: {
        action: 'deleteMessages',
        _id: id
      },
      success: res => {
        // console.log("deleteMessages res=", res)
        if (res.errMsg == "cloud.callFunction:ok" && res.result.stats.updated == 1) {
          this.getHistoryMessagesList({openid:null})
        } else {
          wx.showToast({
            title: '删除失败',
          })
          return
        }
      },
      complete: res => {
        wx.hideLoading({
          success: (res) => {},
        })
      }
    })
  },
  /**
   *跳转详情
   */
  lookDetail: function (e) {
    let messagesId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../details/details?messageId=' + messagesId,
    })
  },
  /**
   * 修改封面背景
   */
  changeBgUrl:async function(){
    var that = this;
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        wx.showLoading({
          title: '上传中',
        })
        const filePath = res.tempFilePaths[0]
        // 上传图片
        var date = new Date()
        const cloudPath = "headerpic" + "-" + date.toLocaleDateString() + "-" + date.toTimeString().split(" ")[0] + filePath.match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: filePath,
          success: res => {
            const fileID = res.fileID
            console.log(fileID)
            // 更新数据库
            wx.cloud.callFunction({
              name: 'messages',
              data: {
                action: 'updateBgUrl',
                bgUrl: fileID,
              },
              success: res => {
                if (res.errMsg == 'cloud.callFunction:ok' && res.result.stats.updated == 1) {
                  that.data.userInfo.bgUrl.push(fileID)
                  that.setData({
                    'userInfo.bgUrl':that.data.userInfo.bgUrl
                  })
                } else {
                  wx.showModal({
                    title: '提示',
                    content: '更新封面失败。请您稍后重试。',
                    showCancel: false,
                    success: res => {}
                  });
                }
              }
            });
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.hideLoading()
            wx.showModal({
              title: '提示',
              content: '上传失败',
              showCancel: false,
              success: res => {}
            });
            return
          },
          complete: () => {
            wx.hideLoading()
          }
        });
      },
      fail: e => {
        console.error(e)
      }
    })
  },
  /**
   * 点击关注
   */
  attention:function(e){
    const openid=e.currentTarget.dataset.id
    const str_date=dayjs(new Date()).format('YYYY-MM-DD')
    wx.cloud.callFunction({
      name: 'login',
      data: {
        action: 'attention',
        openid: openid,
        str_date:str_date
      },
      success: res => {
        // console.log("attention res=", res)
        if(res.errMsg=="cloud.callFunction:ok"&& res.result.status==200){
          this.setData({
            hasAttented:true
          })
        }
      }
    })
  },
  /**
   * 取消关注
   */
  removeAttention:function(e){
    const openid=e.currentTarget.dataset.id
    var that =this
    wx.showModal({
      title: '提示',
      content: '确定取消关注该用户？',
      success (res) {
        if (res.confirm) {
           wx.cloud.callFunction({
            name: 'login',
            data: {
              action: 'removeAttention',
              openid: openid
            },
            success: res => {
              // console.log("removeAttention res=", res)
              if(res.errMsg=="cloud.callFunction:ok"&& res.result.status==200){
                that.setData({
                  hasAttented:false
                })
              }
            }
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  }
})