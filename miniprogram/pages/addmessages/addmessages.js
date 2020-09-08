// miniprogram/pages/addmessages/addmessages.js

import dayjs from 'dayjs'

const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    type: null, // 标签类型，1，2，3
    addImageoneUrl: [],
    addImagetwoUrl: [],
    addVideoUrl: '',
    content: null,
    title: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
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
   * 
   * @param {选择文章类型标签} e 
   */
  selectedLabled: function (e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      type: key
    });
  },


  /**
   * 上传图片
   */
  uploadImage: function (e) {
    const type = e.currentTarget.dataset.type;
    var that = this;
    // 选择图片
    wx.chooseImage({
      count: 2,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        wx.showLoading({
          title: '上传中',
        })
        // console.log("upload image res=", res)
        const filePath = res.tempFilePaths
        for (let i = 0; i < filePath.length; i++) {
          let fileURL = filePath[i]
          // 上传图片
          const date = new Date();
          const cloudPath = "addmessagesiimage-" + that.data.userInfo.openid + "-" + date.toLocaleDateString() + "-" + date.toTimeString().split(" ")[0] + fileURL.match(/\.[^.]+?$/)[0]
          // console.log("cloudPath=", cloudPath)
          wx.cloud.uploadFile({
            cloudPath: cloudPath,
            filePath: fileURL,
            success: res => {
              // console.log('[上传文件] 成功：', res)
              if (type == 1) {
                // console.log("fileURL=",fileURL)
                that.data.addImageoneUrl.push(fileURL);
                // console.log("type=", type, "||addImagetwoUrl=", that.data.addImageoneUrl)
                that.setData({
                  addImageoneUrl: that.data.addImageoneUrl,
                });
              } else {
                that.data.addImagetwoUrl.push(fileURL);
                // console.log("type=",type,"addImagetwoUrl=", that.data.addImagetwoUrl)
                that.setData({
                  addImagetwoUrl: that.data.addImagetwoUrl,
                });
              }

            },
            fail: e => {
              console.error('[上传文件] 失败：', e)
              wx.hideLoading()
              wx.showToast({
                icon: 'none',
                title: '上传失败',
              });
              return
            },
            complete: () => {
              if (i == filePath.length - 1) {
                wx.hideLoading()
              }
            }
          });
        }

      },
      fail: e => {
        console.error(e)
      }
    })
  },

  /**
   * 
   * @param {上传视频} e 
   */
  uploadVideo: function (e) {
    var that = this;
    // 选择视频
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success(res) {
        wx.showLoading({
          title: '上传中',
        })
        // console.log("res=",res)
        const filePath = res.tempFilePath
        // console.log("filePath=",filePath)
        // 上传视频
        const cloudPath = 'addmesssagesvideo-' + that.data.userInfo.openid + '-' + date.toLocaleDateString() + "-" + date.toTimeString().split(" ")[0] + filePath.match(/\.[^.]+?$/)[0]
        // console.log("cloudPath=",cloudPath)
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            // console.log('[上传文件] 成功：', res)
            that.setData({
              addVideoUrl: filePath,
            });
          },
          fail: e => {
            console.error('[上传文件] 失败：', e)
            wx.showToast({
              icon: 'none',
              title: '上传失败',
            })
          },
          complete: () => {
            wx.hideLoading()
          }
        })
      },
      fail: e => {
        console.error(e)
      }
    })
  },

  /**
   * 
   * @param {点击图片预览} e 
   */
  previewImage: function (e) {
    const type = e.currentTarget.dataset.type;
    var image_urls;
    if (type == 1) {
      image_urls = this.data.addImageoneUrl;
    } else {
      image_urls = this.data.addImagetwoUrl;
    }
    // console.log("image_urls=",image_urls)
    wx.previewImage({
      current: image_urls[0],
      urls: image_urls,
      success: function (res) {
        // console.log(res)
      },
      fail: function (res) {
        console.log("previewImage fail", res)
        wx.showToast({
          icon: 'none',
          title: '预览失败',
        })
      },
      complete: function (res) {
        // console.log("previewImage complete", res)
      }
    })
  },
  /**
   * 
   * @param {文章标题} e 
   */
  bindinputTitle: function (e) {
    const title = e.detail.value
    if (title == null || this.ifNull(title)) {
      return
    }
    this.data.title = title
  },
  /**
   * 
   * @param {输入内容完成} e 
   */
  bindinputContent: function (e) {
    const content = e.detail.value
    if (content == null || this.ifNull(content)) {
      return
    }
    this.data.content = content
  },
  /**
   * 去展示编辑/确认
   */
  confirmAndedit: function (e) {
    // console.log(this.data)
    if (this.data.title == null || this.data.title == undefined) {
      wx.showToast({
        title: '请输入标题',
      })
      return
    }
    if (this.data.content == null || this.data.content == undefined) {
      wx.showToast({
        title: '请输入内容',
      })
      return
    }
    if (this.data.type == null) {
      wx.showToast({
        title: '请选择文章类型',
      })
      return
    }
    if (this.data.addImageoneUrl.length == 0 && this.data.addImagetwoUrl.length == 0) {
      wx.showToast({
        title: '至少需配图一张',
      })
      return
    }
    const str_date=dayjs(new Date()).format('YYYY-MM-DD')
    // implement me: add
    wx.cloud.callFunction({
      name: 'messages',
      data: {
        action: 'addmessages',
        type: parseInt(this.data.type),
        addImageoneUrl: this.data.addImageoneUrl,
        addImagetwoUrl: this.data.addImagetwoUrl,
        addVideoUrl: this.data.addVideoUrl,
        content: this.data.content,
        title: this.data.title,
        str_date:str_date
      },
      success: res => {
        // console.log("addmessages=", res)
        if (res.errMsg == 'cloud.callFunction:ok' && res.result._id) {
          wx.redirectTo({
            url: './confirmAndedit/confirmAndedit?messageId=' + res.result._id,
          })
        } else {
          wx.showToast({
            icon: 'none',
            title: '网络异常，请您稍后重试。'
          })
        }
      },
      fail: res =>{
        console.log("fail res=",res)
      }
    })
  },
  /**
   * 
   * @param {判断是否为空} str 
   */
  ifNull: function (str) {
    return str.replace(/\s/g, "") == "" || str == undefined ? true : false
  }
})