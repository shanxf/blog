var express = require('express');
var router = express.Router();
var crypto = require('crypto');//生成散列值来加密密码
var User = require('../models/user.js');
var Post = require('../models/post.js');
var fs = require('fs');
var formidable = require('formidable');
var Comment = require('../models/comment.js');

/* GET home page. */
router.get('/', function(req, res) {
  //判断是否是第一页，并把请求的页数转换成number
  var page = req.query.p ? parseInt(req.query.p) : 1;
  //查询并返回第page页的10篇文章
  Post.getTen(null, page, function (err, posts, total) {
    if (err) {
      posts = [];
    }
    res.render('index', { 
      title: '主页',
      user: req.session.user,
      posts: posts,
      page: page,
      isFirstPage: (page-1) == 0,
      isLastPage: ((page-1)*10 + posts.length) == total,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
router.get('/reg', checkNotLogin);
router.get('/reg', function(req, res){
  res.render('reg', {
  	title: '注册',
  	user: req.session.user,
  	success: req.flash('success').toString(),
  	error: req.flash('error').toString()
  });
});
router.post('/reg', checkNotLogin);
router.post('/reg', function(req, res){
  //req.body存储解析后的post信息
  var name = req.body.name,
      password = req.body.password,
      password_re = req.body.password_repeat;
  if(password!=password_re){
  	req.flash('error', '两次密码不一致');
  	return res.redirect('/reg');
  }
  //对密码md5
  var md5 = crypto.createHash('md5'),
      password = md5.update(req.body.password).digest('hex');
  var newUser = new User({
  	name: req.body.name,
  	password: password,
  	email: req.body.email
  });
  //检查用户是否已经存在
  User.get(newUser.name, function(err, user){
  	if(user){
  	  req.flash('error', '用户已存在');
  	  return res.redirect('/reg');
  	}
  	//用户不存在，新建
  	newUser.save(function(err, user) {
  	  if(err){
  	  	req.flash('error', err);
  	  	return res.redirect('/reg');
  	  }
  	  req.session.user = user;//用户信息存入session
  	  req.flash('success', '注册成功');
  	  res.redirect('/');//注册成功后跳转到主页
  	});
  });
});
router.get('/login', checkNotLogin);
router.get('/login', function(req, res){
  res.render('login', {
  	title: '登录',
  	user: req.session.user,
  	success: req.flash('success').toString(),
  	error: req.flash('error').toString()
  });
});
router.post('/login', checkNotLogin);
router.post('/login', function(req, res){
  var md5 = crypto.createHash('md5');
  var password = md5.update(req.body.password).digest('hex');
  //检查用户是否存在
  User.get(req.body.name, function(err, user) {
  	if(!user){
  	  req.flash('error', '用户不存在');
  	  return res.redirect('/login');
  	}
  	if (user.password != password) {
  	  req.flash('error', '密码错误');
  	  return res.redirect('/login');
  	}
  	//登录成功，将信息存入session
  	req.session.user = user;
  	req.flash('success', '登录成功');
  	res.redirect('/');
  });
});
router.get('/post', checkLogin);
router.get('/post', function(req, res){
  res.render('post', {
    title: '发表',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
});
router.post('/post', checkLogin);
router.post('/post', function (req, res) {
  var currentUser = req.session.user;
  var tags = [req.body.tag1,req.body.tag2,req.body.tag3];
  var post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
  post.save(function (err) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    req.flash('success', '发布成功');
    res.redirect('/');//发表成功跳转到主页
  });
});
router.get('/logout', checkLogin);
router.get('/logout', function (req, res) {
  req.session.user = null;
  req.flash('success', '注销成功');
  res.redirect('/');
});
router.get('/upload', checkLogin);
router.get('/upload', function (req, res) {
  res.render('upload', {
    title: '上传',
    user: req.session.user,
    success: req.flash('success').toString(),
    error: req.flash('error').toString()
  });
});
router.post('/upload', checkLogin);
router.post('/upload', function (req, res) {
  var form = new formidable.IncomingForm();
  form.encoding = 'utf-8';
  form.uploadDir = "./public/images/tmp/";
  form.keepExtensions = true;
  form.maxFieldsSize = 2 * 1024 * 1024;
  form.multiples = true;
  form.parse(req, function(err, fields, files) {
    for (var i in files) {
      var fName = (new Date()).getTime();
      var file = files[i];
      switch(file.type) {
        case 'image/jpeg':
          fName = fName + '.jpeg';
          break;
        case 'image/png':
          fName = fName + '.png';
          break;
        default:
          fName = fName + '.png';
          break;
      }
      if (file.size ==0) {
        //使用同步方式删除一个文件
        fs.unlinkSync(file.path);
        console.log('successfully removed an empty file');
      } else {
        var target_path = './public/images/' + fName;
        //使用同步方式重命名一个文件
        fs.renameSync(file.path, target_path);
        console.log('successfully renamed a file');
      }
    };
  });
});
router.get('/archive', function (req, res) {
  Post.getArchive(function (err, posts) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    res.render('archive', {
      title: '存档',
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
router.get('/tags', function (req, res) {
  Post.getTags(function (err, posts) {
    if (err) {
      req.flash('error', err);
      return res.redirect('/');
    }
    res.render('tags', {
      title: '标签',
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
router.get('/tags/:tag', function (req, res) {
  Post.getTag(req.params.tag, function (err, posts) {
    if (err) {
      req.flash('error',err);
      res.redirect('/');
    };
    res.render('tag', {
      title: 'TAG:' + req.params.tag,
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
router.get('/search', function (req, res) {
  Post.search(req.query.keyword, function (err, posts) {
    if (err) {
      req.flash('error', err);
      res.redirect('/');
    };
    res.render('search', {
      title: "SEARCH:" + req.query.keyword,
      posts: posts,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
router.get('/u/:name', function (req, res) {
  var page = req.query.p ? parseInt(req.query.p) : 1;
  //检查用户是否存在
  User.get(req.params.name, function (err, user) {
    if (!user) {
      req.flash('error', "用户不存在");
      return res.redirect('/');
    }
    //查询并返回该用户的第page页的文章
    Post.getTen(user.name, page, function (err, posts, total) {
      if (err) {
        req.flash('error', err);
        return res.redirect('/');
      }
      res.render('user', {
        title: user.name,
        posts: posts,
        page: page,
        isFirstPage: (page-1) == 0,
        isLastPage: ((page-1)*10 + posts.length) == total,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
});
router.get('/u/:name/:day/:title', function (req, res) {
  Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
    if (err) {
      req.flash('error', err);
      res.redirect('/');
    }
    res.render('article', {
      title: req.params.title,
      post: post,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
router.post('/u/:name/:day/:title', function (req, res) {
  var date = new Date();
  var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + (date.getDate()) + 
            " " +date.getHours() + ":" + (date.getMinutes() <10 ? "0" + date.getMinutes() : date.getMinutes());
  var md5 = crypto.createHash('md5');
  var email_md5 = md5.update(req.body.email.toLowerCase()).digest('hex');
  var head = "http://www.gravatar.com/avatar/" + email_md5 + '?s=48';
  var comment = {
    name: req.body.name,
    head: head,
    email: req.body.email,
    website: req.body.website,
    time: time,
    content: req.body.content
  };
  var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
  newComment.save(function (err) {
    if (err) {
      req.flash('error', err);
      return redirect('back');
    }
    req.flash('success', '留言成功');
    res.redirect('back');
  })
});
router.get('/edit/:name/:day/:title', function (req, res) {
  var currentUser = req.session.user;
  Post.edit(req.params.name, req.params.day, req.params.title, function (err, post) {
    if (err) {
      req.flash('error',err);
      res.redirect('/');
    }
    res.render('edit', {
      title: '编辑',
      post: post,
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
});
router.post('/edit/:name/:day/:title', checkLogin);
router.post('/edit/:name/:day/:title', function (req, res) {
  var currentUser = req.session.user;
  Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
    var url = '/u/' + currentUser.name + '/' + req.params.day + '/' + req.params.title;
    if (err) {
      req.flash('error', err);
      res.redirect(url);
    }
    req.flash('success', '修改成功');
    res.redirect(url);//返回文章页面
  });
});
router.get('/remove/:name/:day/:title', checkLogin);
router.get('/remove/:name/:day/:title', function (req, res) {
  var currentUser = req.session.user;
  Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
    if (err) {
      req.flash('error', err);
      res.redirect('back');
    }
    req.flash('success', '删除成功');
    res.redirect('/');
  });
});
router.get('*', function (req, res) {
  res.render("404");
});
function checkLogin(req, res, next){
  if (!req.session.user) {
  	req.flash('error', '未登录');
  	res.redirect('/login');
  }
  next();
}
function checkNotLogin(req, res, next){
  if(req.session.user){
    req.flash('error', '已登录');
    res.redirect('back');//返回之前的页面
  }
  next();
}

module.exports = router;


