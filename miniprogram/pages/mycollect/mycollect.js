// miniprogram/pages/mycollect/mycollect.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    mylovelist: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.showmylovelist()
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
   * 我的喜欢
   */
  showmylovelist: async function () {
    wx.showLoading({
      title: '加载中...',
    })
    wx.cloud.callFunction({
      name: 'login',
      data: {
        action: 'myloveList'
      },
      success: res => {
        // console.log("myloveList res=", res)
        if (res.errMsg == "cloud.callFunction:ok" && res.result.data.length != 0) {
          this.setData({
            mylovelist: res.result.data
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
   * 去查看详情
   */
  toDetail: async function (e) {
    let messsageId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../details/details?messageId=' + messsageId,
    })
  }
})