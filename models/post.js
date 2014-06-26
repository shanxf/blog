var mongodb = require('./db');
var markdown = require('markdown').markdown;
function Post(name,tilte,post){ 
  this.name = name;
  this.tilte = tilte;
  this.post = post;
}

module.exports = Post;

//保存文章
Post.prototype.save = function(callback) {
  var date = new Date();
  //存储各种时间格式，方便以后扩展
  var time = {
  	date: date,
  	year: date.getFullYear(),
  	month: date.getFullYear() + "-" + (date.getMonth() + 1),
  	day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + (date.getDate()),
  	minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + (date.getDate()) + 
  	        " " +date.getHours() + ":" + (date.getMinutes() <10 ? "0" + date.getMinutes() : date.getMinutes())
  }
  //要存入数据库的文档
  var post = {
  	name: this.name,
  	time: time,
  	title: this.tilte,
  	post: this.post,
    comments: []
  }
  //打开数据库
  mongodb.open(function(err, db){
  	if (err) {
  	  return callback(err);
  	}
  	//读取post集合
  	db.collection('posts', function(err, collection){
  	  if (err) {
        mongodb.close();
  	  	return callback(err);
  	  }
  	  //将文档插入posts集合
  	  collection.insert(post, {
  	  	safe: true
  	  }, function(err){
  	  	mongodb.close();
  	  	if (err) {
  	  	  return callback(err);
  	  	};
  	  	callback(null);
  	  });
  	});
  });
};
//读取文档
Post.getAll = function(name, callback){
  mongodb.open(function(err, db){
  	if(err){
  		return callback(err);
  	}
  	//读取posts集合
  	db.collection('posts', function (err, collection) {
  		if (err) {
  		  mongodb.close();
  		  return callback(err);
  		}
  		var query = {};
  		if(name) {
  		  query.name = name;
  		}
  		//根据query对象查询文章
  		collection.find(query).sort({
  		  time: -1
  		}).toArray(function (err, docs) {
  		  mongodb.close();
  		  if (err) {
  		  	return callback(err);
  		  };
        //解析markdown为html
        docs.forEach(function (doc) {
          doc.post = markdown.toHTML(doc.post);
        });
  		  callback(null, docs);//成功，以数组形式返回查询的结果
  		});
  	});
  });
}
//获取一篇文章
Post.getOne = function (name, day, title, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取posts集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      };
      //根据用户名、发表日期及文章名进行查询
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title 
      }, function (err, doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        //解析markdown为html
        if (doc) {
          doc.post = markdown.toHTML(doc.post);
          doc.comments.forEach(function (comment) {
            comment.content = markdown.toHTML(comment.content);
          });
        }
        callback(null,doc);//返回查询的一篇文章
      });
    });
  });
}
Post.edit = function (name, day, title, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取posts集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、发表日期及文章名进行查询
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      }, function (err, doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, doc);//返回查询的一篇文章
      });
    });
  });
}
Post.update = function (name, day, title, post, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取posts集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      collection.update({
        'name': name,
        'time.day': day,
        'title': title 
      }, {
        $set: {post: post}
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        return callback(null);
      });
    });
  });
}
Post.remove = function (name, day, title, callback) {
  //打开数据库
  mongodb.open(function (err, db) {
    if (err) {
      return callback(err);
    }
    //读取post集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      //根据用户名、日期、标题查找并删除文章
      collection.remove({
        'name': name,
        'time.day': day,
        'title': title
      }, {
        w: 1
      }, function (err) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        return callback(null);
      });
    });
  });
}



