//index.js
const app = getApp()
const dayjs = require('dayjs')

Page({
  data: {
    userInfo: {}, // 定义object对象
    logged: false,
    showAgree: false,
    checked: false, //是否已经同意
    recentlyScans:[],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }

    // 后期删除：先获取本地缓存
    // try {
    //   var userInfodata = wx.getStorageSync('USERINFODATA')
    //   if (userInfodata) {
    //     this.setData({
    //       ...JSON.parse(userInfodata)
    //     })
    //     return
    //   }
    // } catch (e) {
    //   console.log("local storage e=", e);
    // }

    this.queryUserInfo(null);
    this.showLocalScan();

  },

  // 用户点击头像登录
  onGetUserInfo: async function (e) {
    // console.log("bingo e=", e)
    if (!this.data.logged && e.detail.userInfo) {
      // 判断是否已经同意了协议和隐私
      if (!this.data.checked) {
        wx.showModal({
          title: '提示',
          content: '请您先阅读《码农SHOW营小程序用户协议及隐私条款》并同意方可登录哦',
          showCancel: false,
          success: res => {}
        });
        this.setData({
          showAgree: true
        })
        return
      }
      var wxUserInfo = e.detail.userInfo;
      // console.log("wxUserInfo=", wxUserInfo)
      this.queryUserInfo(wxUserInfo);

    }
  },
  /**
   * 
   * @param {添加新用户} myUserInfo 
   */
  addUserInfo: async function (myUserInfo) {
    wx.cloud.callFunction({
      name: 'login',
      data: {
        action: 'addUserInfo',
        userInfo: {
          ...myUserInfo
        }
      },
      success: res => {
        // console.log("addUserInfo=", res)
        if (res.errMsg == 'cloud.callFunction:ok' && res.result._id) {
          //更新缓存
          this.queryUserInfo(null)
        } else {
          wx.showToast({
            icon: 'none',
            title: '获取信息出现异常，请您稍后重试。'
          })
        }
      }
    })
  },
  /**
   * 查询
   */
  queryUserInfo: async function (params) {
    // 加载中
    wx.showLoading({title: '加载中…'})
    wx.cloud.callFunction({
      name: 'login',
      data: {
        action: 'findUserInfo'
      },
      success: res => {
        // console.log("findUserInfo res=", res)
        if (res.errMsg == 'cloud.callFunction:ok' && res.result.data.length != 0) {
          this.setData({
            userInfo: {
              ...res.result.data[0]
            }, // 定义object对象
            logged: true,
            checked: res.result.data[0].checked,
            showAgree: false
          })
          wx.setStorageSync('shareHeaderImageURL', res.result.data[0].avatarUrl)
          // 更新本地缓存
          wx.setStorage({
            key: "USERINFODATA",
            data: JSON.stringify(this.data)
          })
          return;
        }
        // 查询保存到数据库
        if (params == null) {
          return;
        }
        let myUserInfo = {
          avatarUrl: [params.avatarUrl],
          city: [params.city],
          country: [params.country],
          gender: [params.gender],
          language: [params.language],
          nickName: [params.nickName],
          province: [params.province],
          checked: true
        }
        // console.log("myUserInfo=",myUserInfo)
        // 保存到数据中
        this.addUserInfo(myUserInfo)
      },
      complete: res =>{
        wx.hideLoading()
      }
    })
  },
  /**
   * 去设置头像和昵称
   */
  setting: async function (e) {
    // console.log("bingo=", this.data.userInfo)
    wx.navigateTo({
      url: '../setting/setting'
    })
  },
  /**
   * 
   * @param {点击图片预览} e 
   */
  previewImage: async function (e) {
    const image_url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: image_url,
      current: image_url,
      urls: [ // 所有图片的URL列表，数组格式
        image_url
      ],
      success: function (res) {
        console.log(res)
      },
      fail: function (res) {
        console.log("previewImage fail", res)
      },
      complete: function (res) {
        console.log("previewImage complete", res)
      }
    })
  },
  selectRadio: async function (e) {
    const checked = e.currentTarget.dataset.checked;
    this.setData({
      checked: !checked
    })
  },
  /**
   * 显示还未登录提示
   */
  showNotLoggin:function(e){
    wx.showToast({
      title: '请您先登录！',
    });
    return
  },
  /**
   * 显示最近浏览
   */
  showLocalScan:async function(e){
    try {
      let localScanInfo = wx.getStorageSync('LOCAL_SCAN_INFO')
      if(localScanInfo&&localScanInfo.length!=0){
        wx.cloud.callFunction({
          name: 'messages',
          data: {
            action: 'showLocalScan',
            _ids:localScanInfo
          },
          success: res => {
            // console.log("showLocalScan res=", res)
            if (res.errMsg == 'cloud.callFunction:ok' && res.result.data.length != 0) {
              this.setData({
                recentlyScans:res.result.data
              })
            }
          },
          complete: res =>{
            wx.hideLoading()
          }
        })
      }
    } catch (e) {
      console.log("local storage e=", e);
    }
  },
  /**
   * 跳转详情
   */
  toDetail:async function(e){
    let _id=e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../details/details?messageId=' + _id,
    })
  }
})