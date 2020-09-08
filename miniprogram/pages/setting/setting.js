// miniprogram/pages/setting/setting.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {
      avatarUrl: "",
      nickName: "",
      gender: null,
      city: "",
      showCity: false,
      hasGender: false,
    },
    showModal: false,
    changeNicke: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    // 取本地缓存
    try {
      var userInfodata = wx.getStorageSync('USERINFODATA')
      if (userInfodata) {
        var userInfo = JSON.parse(userInfodata).userInfo
        this.setData({
          userInfo,
          changeNicke: userInfo.nickName
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
  onHide: function () {

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
  /**
   * 上传头像
   */
  uploadImage: async function (e) {
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
            // console.log(res)
            const fileID = res.fileID
            // 更新数据库
            wx.cloud.callFunction({
              name: 'setting',
              data: {
                action: 'updateAvatarUrl',
                avatarUrl: fileID
              },
              success: res => {
                // console.log("front updateAvatarUrl=", res)
                if (res.errMsg == 'cloud.callFunction:ok' && res.result.stats.updated == 1) {

                  that.setData({
                    'userInfo.avatarUrl': fileID
                  });
                  // 更新本地缓存
                  try {
                    var myData = wx.getStorageSync('USERINFODATA')
                    if (myData) {
                      var myDataObj = JSON.parse(myData) // my.js 的data对象
                      myDataObj.userInfo.avatarUrl = that.data.userInfo.avatarUrl
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
                  } catch (e) {
                    console.log("local storage e=", e);
                    wx.redirectTo({
                      url: '../chooseLib/chooseLib',
                    })
                  }
                } else {
                  wx.showModal({
                    title: '提示',
                    content: '更新头像失败。请您稍后重试。',
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
   * 弹窗-修改名字
   */
  editNickName: async function (e) {
    this.setData({
      showModal: true
    })
  },
  /**
   * 弹出框蒙层截断touchmove事件
   */
  preventTouchMove: async function () {},
  /**
   * 输入input发生变化事件
   */
  inputChange: async function (e) {
    const nickName = e.detail.value;
    this.data.changeNicke = nickName;
  },
  /**
   * 隐藏模态对话框
   */
  hideModal: async function () {
    this.setData({
      showModal: false
    });
  },
  /**
   * 对话框取消按钮点击事件
   */
  onCancel: async function () {
    this.data.changeNicke = this.data.userInfo.nickName
    this.hideModal();
  },
  /**
   * 对话框确认按钮点击事件
   */
  onConfirm: async function (e) {
    if (this.data.changeNicke == undefined || this.data.changeNicke == '' ||
      this.data.changeNicke == null || this.data.changeNicke == this.data.userInfo.nickName) {
      console.log(this.data.changeNicke, "==", this.data.userInfo.nickName)
      this.hideModal();
      return
    }
    // implement me: update userInfo data
    wx.cloud.callFunction({
      name: 'setting',
      data: {
        action: 'updateNickName',
        nickName: this.data.changeNicke
      },
      success: res => {
        if (res.errMsg == 'cloud.callFunction:ok' && res.result.stats.updated == 1) {
          this.setData({
            'userInfo.nickName': this.data.changeNicke
          });
          // 更新本地缓存
          try {
            var myData = wx.getStorageSync('USERINFODATA')
            if (myData) {
              var myDataObj = JSON.parse(myData) // my.js 的data对象
              myDataObj.userInfo.nickName = this.data.changeNicke
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
          } catch (e) {
            console.log("local storage e=", e);
          }
        } else {
          wx.showToast({
            icon: 'none',
            title: '修改呢称失败。请您稍后重试。'
          })
        }
      }
    });
    this.hideModal();
  },
  /**
   * 跳转到性别修改
   */
  gotoSex: async function (e) {
    wx.navigateTo({
      url: './sex/sex?gender=' + this.data.userInfo.gender + "&hasGender=" + this.data.userInfo.hasGender,
    })
  },
  /**
   * 跳转到地区
   */
  gotoArea: async function (e) {
    wx.navigateTo({
      url: './area/area?city=' + this.data.userInfo.city + "&showCity=" + this.data.userInfo.showCity + "&province=" + this.data.userInfo.province,
    })
  }

})