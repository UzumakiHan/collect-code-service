const express = require('express');
const router = express.Router();
const request = require('request')
const collectDb = require('../model/collectDb');
const userDb = require('../model/userDb');
const moment = require('moment')
const multiparty = require('multiparty');
const path = require('path');
const fs = require('fs');
const { existsSync, mkdir, rmdir, rmdirSync, unlinkSync, statSync, readdirSync } = fs;
const { resolve } = path;
const NET_URL = 'http://127.0.0.1:3000'
const uploadCodePath = resolve(path.join(process.cwd(), 'uploadCode'));
const APP_ID = 'wx9f5c3c03589de947' // 微信小程序APP_ID
const APP_SECRET = '33323c7a628c5b7614efb58ef5610eca' //微信小程序APP_SECRET
const APP_URL = 'https://api.weixin.qq.com/sns/jscode2session'
const SUPER_ADMIN = 'UzumakiHanwx9f5c3c03589de947'

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});


router.post('/uploadCode', (req, res) => {
  const form = new multiparty.Form();
  const isExit = existsSync(uploadCodePath)
  if (!isExit) {
    mkdir(uploadCodePath, { recursive: true }, err => {
      if (err) throw err;
    })
  }
  form.uploadDir = 'uploadCode';
  form.parse(req, (err, fields, files) => {
    const filePath = files.filecontent[0].path;
    const fileUrl = files.filecontent[0].path.replace(/\\/g, "/");
    const fileName = files.filecontent[0].originalFilename;
    const account = fields.account[0]
    const fileData = {
      fileUrl: `${NET_URL}/${fileUrl}`,
      fileName: fileName,
      fileCreateAt: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      filePath: filePath,
      collectName: '默认二维码',
      account
    }
    collectDb.create(fileData, (err, data) => {
      if (err) throw err;
      res.json({
        success_code: 200,
        fileData: data
      })
    });

  })
});
//获取列表
router.get('/getCollectList', (req, res) => {
  const account = req.query.account
  if (account) {
    collectDb.find({ account }, (err, data) => {
      if (err) throw err;
      res.json({
        success_code: 200,
        collectList: data
      })
    })
  } else {
    res.json({
      success_code: 400,
      message: '没有权限访问'
    })
  }
})
router.get('/getAllList',(req,res)=>{
  const isAuth = req.query.isAuth;
  if(isAuth === SUPER_ADMIN){
    collectDb.find({}, (err, data) => {
      if (err) throw err;
      res.json({
        success_code: 200,
        collectList: data
      })
    })
  }else{
    res.json({
      success_code: 400,
      message: '没有权限访问'
    })
  }

})
//删除对应的列表
router.get('/delCode', (req, res) => {
  const filePath = req.query.filePath.replace(/\\/g, "/")
  const file_id = req.query.file_id;
  const delFlag = delPath(filePath)
  collectDb.deleteOne({ _id: file_id }, (err, data) => {
    if (err) throw err;
    if (delFlag) {
      res.json({
        success_code: 200,
        message: '删除成功'
      })
    }
  })
});
//编辑对应的博客
router.get('/editCode', (req, res) => {
  // console.log(req)
  const editId = req.query._id;
  const collectName = req.query.collectName
  const editInfo = {
    collectName
  }
  collectDb.updateOne({
    _id: editId
  }, editInfo, (err, data) => {
    if (err) throw err;
    res.json({
      success_code: 200,
      codeList: data
    })
  })

})
router.get('/saveUser', (req, res) => {
  const js_code = req.query.code
  const userInfo =JSON.parse(req.query.userInfo);
  if (js_code) {
    request(`${APP_URL}?appid=${APP_ID}&secret=${APP_SECRET}&js_code=${js_code}&grant_type=authorization_code`, (error, response, body) => {
      if (error) throw error
      if (response.statusCode === 200) {
        const bodyInfo = JSON.parse(body)
        const openId = bodyInfo.openid
        userDb.find({ openId }, (err, data) => {
          if (err) throw err;

          if (data.length === 0) {
            const userDbInfo = {
              openId,
              userInfo
            }
            userDb.create(userDbInfo, (userErr, userData) => {
              if (userErr) throw userErr;

            })
          }
          res.json({
            success_code: 200,
            data: bodyInfo
          })
        })
      } else {
        res.json({
          success_code: 400,
          message: '获取用户信息失败'
        })
      }
    })
  }



})
router.get('/getAllUser',(req,res)=>{
  const isAuth = req.query.isAuth;
  if(isAuth === SUPER_ADMIN){
    userDb.find({}, (err, data) => {
      if (err) throw err;
      res.json({
        success_code: 200,
        userList: data
      })
    })
  }else{
    res.json({
      success_code: 400,
      message: '没有权限访问'
    })
  }
})
router.get('/deleteAll', (req, res) => {
  collectDb.remove({}, (err, data) => {
    if (err) throw err;
    if (existsSync(uploadCodePath)) {  //先删除文件   rootPath文件夹路径
      let files = readdirSync(uploadCodePath);
      files.forEach(function (file, index) {
        var curPath = uploadCodePath + "/" + file;
        if (statSync(curPath).isDirectory()) { // recurse
          rmdirSync(uploadCodePath);
          console.log("文件夹");
        } else { // delete file
          console.log("删除文件", file);
          unlinkSync(curPath, function (err) {
            if (err) throw err;
          });
        }
      });
    }
  })
})
function delPath(path) {
  if (!existsSync(path)) {
    console.log("路径不存在");
    return "路径不存在";
  }
  const info = statSync(path);
  if (info.isDirectory()) {//目录
    const data = readdirSync(path);
    if (data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        delPath(`${path}/${data[i]}`); //使用递归
        if (i == data.length - 1) { //删了目录里的内容就删掉这个目录
          delPath(`${path}`);
        }
      }
    } else {
      rmdirSync(path);//删除空目录
      return true
    }
  } else if (info.isFile()) {
    unlinkSync(path);//删除文件
    return true
  }
}
module.exports = router;
