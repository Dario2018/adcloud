// miniprogram/pages/details/details.js

import dayjs from 'dayjs'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    messages:null,
    isCanDraw: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const messageId = options.messageId
    if (messageId == null) {
      wx.showToast({
        title: '加载失败！',
      })
      wx.navigateBack({
        delta: 1,
      })
      return
    }
    wx.showLoading({
      title: '加载中',
    })
    // 文章显示
    wx.cloud.callFunction({
      name: 'messages',
      data: {
        action: 'findMessages',
        _id:messageId
      },
      success: res => {
        // console.log("findMessages res=", res)
        if(res.errMsg=="cloud.callFunction:ok"&&res.result.data.length!=0){
          const [messages]=res.result.data
          this.setData({
            messages:messages
          })
          wx.setStorageSync('shareTitle', messages.title)
          wx.setStorageSync('shareNickName', messages.nickName)
          wx.setStorageSync('shareImageURL', messages.addImageoneUrl[0])
        }
     
      },
      complete: res =>{
        wx.hideLoading({
          success: (res) => {},
        })
      }
    })
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
  onShareAppMessage: function (options) {
    let _id=this.data.messages._id
    if (options.from === 'button') {
      _id=options.target.dataset.id;
    }
    const result = {
      title: '我分享了我一篇精彩的创作！快点开看！',
      path: '/pages/details/details?messageId=' + _id
    }
    return result
  },
  createShareImage: function () {
    this.setData({
      isCanDraw: !this.data.isCanDraw
    })
  },
  /**
   * 添加喜欢
   */
  addCollection: async function(e){
    const _id=e.currentTarget.dataset.id
    const str_date=dayjs(new Date()).format('YYYY-MM-DD')
    wx.cloud.callFunction({
      name: 'messages',
      data: {
        action: 'addCollection',
        _id:_id,
        str_date:str_date
      },
      success: res => {
        // console.log("addCollection res=", res)
        if(res.errMsg=="cloud.callFunction:ok"){
        this.setData({
          'messages.lovesnum':res.result.data,
          'messages.hasLoved':true
        })
        }
     
      }
    })
  },
  /**
   * 移除喜欢的
   */
  removeCollection: async function(e){
    const _id=e.currentTarget.dataset.id
    wx.cloud.callFunction({
      name: 'messages',
      data: {
        action: 'removeCollection',
        _id:_id
      },
      success: res => {
        // console.log("removeCollection res=", res)
        if(res.errMsg=="cloud.callFunction:ok"){
          this.setData({
            'messages.lovesnum':res.result.data,
            'messages.hasLoved':false
          })
        }
     
      }
    })
  },

})