// miniprogram/pages/setting/area/area.js
var QQMapWX = require('../../../components/qqmap-wx-jssdk1.2/qqmap-wx-jssdk.js');
var qqmapsdk;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    city: null,
    province: null,
    showCity: false, // 是否已经修改过了
    currentCity: null, // 定位的当前位置
    currentProvince: null,
    type: null, // 勾选图显示
    loading: false //完成显示
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var city = options.city
    var province = options.province
    var showCity = options.showCity == "false" || options.showCity == false ? false : true
    this.setData({
      province,
      city,
      showCity
    })
    var that = this;
    // 实例化API核心类
    qqmapsdk = new QQMapWX({
      key: 'FP2BZ-BT43P-SIXDJ-LCLJ6-7PH2S-BFFHS'
    });
    // 页面初始化时获取用户当前定位,先注释掉,调试需要用真机才可以
    wx.getSetting({
      success: (res) => {
        // console.log(res)
        // res.authSetting['scope.userLocation'] == undefined    表示 初始化进入该页面
        // res.authSetting['scope.userLocation'] == false    表示 非初始化进入该页面,且未授权
        // res.authSetting['scope.userLocation'] == true    表示 地理位置授权
        if (res.authSetting['scope.userLocation'] != undefined && res.authSetting['scope.userLocation'] != true) {
          wx.showModal({
            title: '请求授权当前位置',
            content: '需要获取您的地理位置，请确认授权',
            success: function (res) {
              if (res.cancel) {
                wx.showToast({
                  title: '拒绝授权',
                  icon: 'none',
                  duration: 1000
                })
              } else if (res.confirm) {
                wx.openSetting({
                  success: function (dataAu) {
                    if (dataAu.authSetting["scope.userLocation"] == true) {
                      wx.showToast({
                        title: '授权成功',
                        icon: 'success',
                        duration: 1000
                      })
                      //再次授权，调用wx.getLocation的API
                      wx.getLocation({
                        type: 'wgs84',
                        success: function (res) {
                          //根据坐标获取当前位置名称，显示在顶部:腾讯地图逆地址解析
                          qqmapsdk.reverseGeocoder({
                            location: {
                              latitude: res.latitude,
                              longitude: res.longitude
                            },
                            success: function (addressRes) {
                              // console.log("addressRes=",addressRes)
                              const province = addressRes.result.ad_info.province
                              const city = addressRes.result.ad_info.city
                              that.setData({
                                currentCity: city,
                                currentProvince: province
                              })
                            },
                            fail: function (reserr) {
                              console.log("reverseGeocoder fail reserr", reserr)
                            }
                          })
                        },
                        fail: function (res) {
                          console.log("getLocation fail res={}", res)
                        }
                      })
                    } else {
                      wx.showToast({
                        title: '授权失败',
                        icon: 'none',
                        duration: 1000
                      })
                    }
                  }
                })
              }
            }
          })
        } else if (res.authSetting['scope.userLocation'] == undefined) {
          //调用wx.getLocation的API
          wx.getLocation({
            type: 'wgs84',
            success: function (res) {
              //根据坐标获取当前位置名称，显示在顶部:腾讯地图逆地址解析
              qqmapsdk.reverseGeocoder({
                location: {
                  latitude: res.latitude,
                  longitude: res.longitude
                },
                success: function (addressRes) {
                  // console.log("reverseGeocoder addressRes", addressRes)
                  const province = addressRes.result.ad_info.province
                  var city = addressRes.result.ad_info.city
                  that.setData({
                    currentCity: city,
                    currentProvince: province
                  })
                }
              })
            }
          })
        } else {
          //调用wx.getLocation的API
          wx.getLocation({
            type: 'wgs84',
            success: function (res) {
              // console.log("getLocation的API res=", res)
              //根据坐标获取当前位置名称，显示在顶部:腾讯地图逆地址解析
              qqmapsdk.reverseGeocoder({
                location: {
                  latitude: res.latitude,
                  longitude: res.longitude
                },
                success: function (addressRes) {
                  // console.log("reverseGeocoder addressRes",addressRes)
                  const province = addressRes.result.ad_info.province
                  const city = addressRes.result.ad_info.city
                  that.setData({
                    currentCity: city,
                    currentProvince: province
                  })
                },
                fail: function (errorRes) {
                  console.log("reverseGeocoder errorRes", errorRes)
                }
              })
            }
          })
        }
      },
      fail: (res) => {
        console.log(" getSetting fail res={}", res)
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
  onShareAppMessage: function () {

  },
  selected: function (e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      type
    });
  },
  complete: async function (e) {
    if (this.data.currentCity == null) {
      wx.showModal({
        title: '提示',
        content: '操作失败！不能正确获取到定位！',
        showCancel: false,
        success: res => {}
      });
      return
    }
    if (this.data.type == null) {
      wx.showModal({
        title: '提示',
        content: '请选择类型',
        showCancel: false,
        success: res => {}
      });
      return
    }

    if (!this.data.showCity && this.data.type == 0) {
      wx.navigateBack({
        delta: 0,
      })
      return
    }
    if (this.data.showCity && this.data.title == this.data.currentCity) {
      wx.navigateBack({
        delta: 0,
      })
      return
    }
    // complement me：update userInfo data go back pre
    this.setData({
      loading: true
    });
    wx.cloud.callFunction({
      name: 'setting',
      data: {
        action: 'updateCity',
        province: this.data.currentProvince,
        city: this.data.currentCity
      },
      success: res => {
        // console.log("updateCity res=", res)
        if (res.errMsg == 'cloud.callFunction:ok' && res.result.stats.updated == 1) {
          this.setData({
            loading: false,
            province: this.data.currentProvince,
            city: this.data.currentCity,
            showCity: true
          });
          // 更新本地缓存
          try {
            var myData = wx.getStorageSync('USERINFODATA')
            if (myData) {
              var myDataObj = JSON.parse(myData) // my.js 的data对象
              myDataObj.userInfo.city = this.data.currentCity
              myDataObj.userInfo.province = this.data.currentProvince
              myDataObj.userInfo.showCity = true
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
          wx.showToast({
            icon: 'none',
            title: '修改性别失败。请您稍后重试。'
          })
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