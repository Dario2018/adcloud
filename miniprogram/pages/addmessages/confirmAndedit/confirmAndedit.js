// miniprogram/pages/addmessages/confirmAndedit/confirmAndedit.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    messages:null
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
        }
      }
    })


      // 取本地缓存
      try {
        var userInfodata = wx.getStorageSync('USERINFODATA')
        if (userInfodata) {
          var userInfo = JSON.parse(userInfodata).userInfo
          this.setData({
            userInfo
          })
        }
      } catch (e) {
        console.log("local storage e=", e);
        wx.redirectTo({
          url: '../chooseLib/chooseLib',
        })
        return
      }
    
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
   * 返回首页
   */
  toIndex:function(){
    wx.reLaunch({
      url: '../../index/index',
    })
  },

  /**
   * 查看我的发布
   */
  toMy:function(){
    wx.navigateTo({
      url: '../../history/history',
    })
  }
})