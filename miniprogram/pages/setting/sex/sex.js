// miniprogram/pages/setting/sex/sex.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    selected: false,
    gender: '',
    loading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    // 数据可能获取未数字，从本地获取为字符串
    const gender = options.gender == 0 || options.gender == "0" ? 0 : gender
    const selected = options.hasGender == false || options.hasGender == "false" ? false : true
    this.setData({
      gender,
      selected
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: async function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: async function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: async function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: async function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: async function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: async function () {

  },
  selected: async function (e) {
    const gender = e.currentTarget.dataset.gender;
    this.setData({
      gender: gender,
      selected: true
    });
  },
  /**
   * 提交
   */
  complete: async function (e) {
    if (this.data.gender == '' || this.data.gender == undefined || this.data.gender == null) {
      return
    }
    // complement me：update userInfo data go back pre
    this.setData({
      loading: true
    });
    wx.cloud.callFunction({
      name: 'setting',
      data: {
        action: 'updateGender',
        gender: this.data.gender
      },
      success: res => {
        // console.log("updateGender res=", res)
        if (res.errMsg == 'cloud.callFunction:ok' && res.result.stats.updated == 1) {
          this.setData({
            loading: false
          });
          // 更新本地缓存
          try {
            var myData = wx.getStorageSync('USERINFODATA')
            if (myData) {
              var myDataObj = JSON.parse(myData) // my.js 的data对象
              myDataObj.userInfo.gender = this.data.gender
              myDataObj.userInfo.hasGender=this.data.selected
              this.refreshPreMessages(myDataObj)
            }
          } catch (e) {
            console.log("local storage e=", e);
            wx.redirectTo({
              url: '../../chooseLib/chooseLib',
            })
          }
          wx.navigateBack({
            delta: 1,
          })
        } else {
          wx.showModal({
            title: '提示',
            content: '修改性别失败。请您稍后重试。',
            showCancel: false,
            success: res => {}
          });
        }
      }
    });
  },
  /**
   * 更新本地缓存并刷新上一页信息
   */
  refreshPreMessages: async function (myDataObj) {
    // 更新本地缓存
    wx.setStorage({
      key: "USERINFODATA",
      data: JSON.stringify(myDataObj)
    })
    // 刷新上一页的页面信息
    var pages = getCurrentPages();
    var prevPage = pages[pages.length - 2];
    prevPage.setData({
      ...myDataObj
    })
  }
})