/*******************************************************************************
*  Code contributed to the webinos project
* 
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*  
*     http://www.apache.org/licenses/LICENSE-2.0
*  
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
* Copyright 2013 Martin Lasak, Fraunhofer FOKUS
 ******************************************************************************/
(function () {
  "use strict";

  var send = require("send");
  var url = require("url");
  var uuid = require("node-uuid");
  var os = require('os');
  var fs = require('fs');
  var path = require('path');
  var mkdirp = require('mkdirp');
  var imageMagick = require('gm').subClass({ imageMagick: true });

  var Thumbs = function(config) {
    this.config = config;
    this.cachePath="";
    this.httpHandler=null;
  };

  Thumbs.prototype.getThumbPath = function(originalPath, successCb, errorCb){
    "use strict";
    var webinosApiCache,that=this;

    if(that.cachePath){
      that.createThumbPath(originalPath, successCb, errorCb);
      return;
    }

    switch(os.type().toLowerCase()){
      case "windows_nt":
        webinosApiCache = path.resolve(process.env.appdata + "/webinos");
        break;
      case "linux":
        switch(os.platform().toLowerCase()){
          case "android":
            //on Android we use ContentProvider
            webinosApiCache="";
            break;
          case "linux":
            webinosApiCache = path.resolve(process.env.HOME + "/.webinos");
            break;
        }
        break;
      case "darwin":
        webinosApiCache = path.resolve(process.env.HOME + "/.webinos");
        break;
    }

    if(webinosApiCache){
      that.cachePath=path.join(webinosApiCache,"apiCache","mediaContent","thumbs");
      mkdirp(that.cachePath, function (err) {
          if (err) {
            that.cachePath="";
            console.error(err);
            if(typeof errorCb == "function"){
              errorCb();
            }
          }else{
            that.createThumbPath(originalPath, successCb, errorCb);
          }
      });
    }
    return that.cachePath;
  };

  Thumbs.prototype.createThumbPath = function(originalPath, successCb, errorCb){
    var that=this;
    var thumbPath = path.join(that.cachePath, path.dirname(originalPath)||"");
        mkdirp(thumbPath, function (err) {
          if (err) {
            console.error(err);
            if(typeof errorCb == "function"){
              errorCb(err);
            }
          }else{
            successCb(thumbPath);
          }
      });  
  };

  Thumbs.prototype.createThumb = function(originalPath, successCb, errorCb){
    var that=this;
    that.getThumbPath(originalPath,function(thumbPath){
      var filePath = path.join(thumbPath,path.basename(originalPath));
      fs.exists(filePath, function (exists) {
        if(exists){
          //thumb already there
          successCb(filePath);
        }else{
          //create a thumb
          imageMagick(originalPath).autoOrient().thumb(96, 96, filePath, 100, function(err){
            if(err){
              errorCb(err);
            }else{
              successCb(filePath);
            }
          })
        }
      });
    },function(err){
      errorCb(err);
    })
  };

  Thumbs.prototype.getThumbUrl = function(originalPath, successCb, errorCb){
    var that=this;
    var link = url.format(
      { protocol : "http"
      , hostname : that.config.http.hostname
      , port : that.config.http.port
      , pathname : "/module/webinos-api-mediacontent/thumblink"
      , query : { "path" : originalPath }
      });

    that.createThumb(originalPath,function(pathToCreated){
      
      //set up http handler if not done already
      if(!that.httpHandler){
        that.httpHandler = (function (request, response) {
          var filepath = url.parse(request.url, true).query["path"];
          if (filepath && that.cachePath) {
              send(request, path.join(that.cachePath,filepath)).pipe(response);
          } else {
              response.writeHead(404, "404 Not Found");
              response.end();
          }
        }).bind(that);
      }
      //return the thumb url

      successCb(link);

      console.log("done link to, ",link);

    },function(err){
      errorCb(err);
    });

    //return the link to the probably later created thumb
    return link;
  };

  exports.Thumbs = Thumbs;
}());
