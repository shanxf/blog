var mongodb = require('./db');

function Comment (name, day, title, comment) {
  this.name = name;
  this.day = day;
  this.title = title;
  this.comment = comment;
}

module.exports = Comment;

//保存留言
Comment.prototype.save = function(callback) {
  var name = this.name;
  var day = this.day;
  var title = this.title;
  var comment = this.comment;

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
  	  //通过用户名，时间、标题查找文档，并将留言添加到comments数组
  	  collection.update({
  	    "name": name,
  	    "title": title,
  	    "time.day": day
  	  }, {
  	    $push: {"comments": comment}
  	  }, function (err) {
  	    mongodb.close();
  	  	if (err) {
  	  	  return callback(err);
  	  	}
  	  	callback(null);
  	  });
  	});
  });
};