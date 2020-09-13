//index.js
import dayjs from 'dayjs'

const wxCharts = require("../../components/wxcharts/wxcharts.js")
const app = getApp()
var datalineChart = null;

Page({
  data: {
    num:0, // 显示文章列表数
    userInfo: null,
    technoeduList: null, //科技教育
    marketplace: null, // 微商市场
    recommend: null, // 为你推荐
    technoeduPageInfo: null, //页脚信息
    marketplacePageInfo: null,
    recommendPageInfo: null,
    totalData:null, // 七日总数
  },

  onLoad: function () {
    if (!wx.cloud) {
      wx.redirectTo({
        url: '../chooseLib/chooseLib',
      })
      return
    }
    wx.showLoading({
      title: '正在加载...',
    })
    // 这里不可删掉
    this.setData({
      num:5
    })
    // 加载用户信息
    wx.cloud.callFunction({
      name: 'reportdatas',
      data: {
        action: 'getReportData'
      },
      success: res => {
        // console.log("res=",res) 
        this.setData({
          totalData:res.result.data.totalData
        })
        // 加载显示图表shuju
          this.getDatas(res.result.data);

      },
      fail: res =>{
        // console.log("fail res=",res) 
      }
    })
    
    // 发布列表
    this.getMessagesList(1,1)
    this.getMessagesList(2,1)
    this.getMessagesList(3,1)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.hideLoading({
      success: (res) => {},
    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (options) {
    const result = {
      title: '我分享了我的创作成就！快点开看！',
      path: '/pages/index/index'
    }
    return result
  },

  getDatas: function (data) {
    var windowWidth = 320;
    try {
      var res = wx.getSystemInfoSync();
      windowWidth = res.windowWidth;
    } catch (e) {
      console.error('getSystemInfoSync failed!');
    }

    // 获取报表数据信息
    datalineChart = new wxCharts({ //线图配置
      canvasId: 'dataEle',
      type: 'line',
      categories: data.dateArr, //categories X轴
      animation: true,
      legend: true,
      background: '#F6F6F6',
      series: [{
          name: '粉丝增量',
          data: data.fenslist,
          format: function (val, name) {
            return val;
          }
        }, {
          name: '访问量',
          data: data.clickslist,
          format: function (val, name) {
            return val;
          }
        },
        {
          name: '发表量',
          data: data.messageslist,
          format: function (val, name) {
            return val;
          }
        },
        {
          name: '被喜欢',
          data: data.loveslist,
          format: function (val, name) {
            return val;
          }
        }
      ],
      xAxis: {
        disableGrid: true
      },
      yAxis: {
        // title: '次数',
        format: function (val) {
          return val;
        },
        max: 20,
        min: 0
      },
      width: windowWidth,
      height: 200,
      dataLabel: false,
      dataPointShape: true,
      extra: {
        lineStyle: 'curve'
      }
    });

  },
  dataTouchHandler: function (e) { //当触摸显示
    // console.log("dataTouchHandler e=", e);
    datalineChart.showToolTip(e, { //showToolTip图表中展示数据详细内容
      background: '#2E2E2E',
      format: function (item, category) {
        return category + '日 ' + item.name + ':' + item.data
      }
    });
  },
  /**
   * 加载画布出错触发的事件
   */
  canvasIdErrorCallback: function (e) {
    // 跳到错误提示页面
    wx.redirectTo({
      url: '../chooseLib/chooseLib',
    })
  },
  /**
   * 
   * 点击刷新 
   */
  refreshGetMessages: function (e) {
    let type = e.currentTarget.dataset.type
    let next_page = e.currentTarget.dataset.next
    let totalSize = e.currentTarget.dataset.total
    if(totalSize<(next_page-1)*this.data.num){
      console.log("没有下一页了...")
      return
    }
    this.getMessagesList(parseInt(type),parseInt(next_page))
  },
  /**
   * 获取各个标签列表
   */
  getMessagesList: async function (type,currentpage) {
    wx.cloud.callFunction({
      name: 'messages',
      data: {
        action: 'getMessagesList',
        type: type,
        num: this.data.num,
        currentpage:currentpage
      },
      success: res => {
        // console.log("getMessagesList res=", res)
        var messageList = res.result.data;
        for (let i = 0; i < messageList.length; i++) {
          messageList[i].createTime = dayjs(messageList[i].createTime).format('YYYY-MM-DD')
        }
        switch (type) {
          case 1:
            this.setData({
              technoeduList: res.result.data,
              technoeduPageInfo:res.result.page_info
            })
            break;
          case 2:
            this.setData({
              marketplace: res.result.data,
              marketplacePageInfo:res.result.page_info
            })
            break;
          case 3:
            this.setData({
              recommend: res.result.data,
              recommendPageInfo:res.result.page_info
            })
            break;
          default:
            break;
        }
      }
    })
  },
  /**
   * 增加用户文章点击量，跳转到详情页面
   */
  toDetail: async function (e) {
    let _id = e.currentTarget.dataset.id
    // 增加点击
    this.addClicks(_id);
    // 本地保存
    this.addLocalStroage(_id);
    //跳转到相应页面
    wx.navigateTo({
      url: '../details/details?messageId=' + _id,
    })
  },
   /**
   * 跳转到相应用户发布
   */
  toUserInfo: async function (e) {
    let openid = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../history/history?openid=' + openid,
    })
  },
  addLocalStroage: async function (_id) {
    try {
      let localScanInfo = wx.getStorageSync('LOCAL_SCAN_INFO')
      if (!localScanInfo) {
        localScanInfo = new Array();
        localScanInfo.push(_id)
      } else {
        let addFlag = true;
        for (let i = 0; i < localScanInfo.length; i++) {
          if (localScanInfo[i] == _id) {
            addFlag = false
            break;
          }
        }
        if (addFlag) {
          if(localScanInfo.length<5){
            localScanInfo.push(_id)
          }else{
            localScanInfo[0]=_id
          }
        }
      }
      wx.setStorage({
        key: "LOCAL_SCAN_INFO",
        data: localScanInfo
      })

    } catch (e) {
      console.log("local storage e=", e);
    }
  },
  addClicks: async function (_id) {
    wx.cloud.callFunction({
      name: 'messages',
      data: {
        action: 'addClicks',
        _id: _id,
        str_date:dayjs(Date.now()).format('YYYY-MM-DD')
      },
      success: res => {
        // console.log("addClicks res=", res)
      }
    })
  }

})