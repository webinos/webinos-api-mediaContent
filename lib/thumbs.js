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

  var url = require("url");
  var os = require('os');
  var fs = require('fs');
  var path = require('path');
  var mkdirp = require('mkdirp');
  var imageMagick = require('gm').subClass({ imageMagick: true });

  var processingQueue={}, processingIndexR=0, processingIndexW=0, processingActive=false;

  var Thumbs = function(config) {
    this.config = config;
    this.cachePath="";
  };

  Thumbs.prototype.getThumbPath = function(originalPath, successCb, errorCb){
    "use strict";
    var webinosApiCache,that=this;

    if(that.cachePath){
      that.createThumbPath(originalPath, successCb, errorCb);
      return;
    }

    switch(process.platform){
      case "win32":
        webinosApiCache = path.resolve(process.env.appdata + "/webinos");
        break;
      case "android":
        //on Android we use ContentProvider
        webinosApiCache="";
        break;
      case "linux":
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
    var thumbPath = path.join(that.cachePath, escapePath(path.dirname(originalPath))||"");
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

  Thumbs.prototype._processQueue = function(item){
    var self = this;
    this._createThumb(item.originalPath, function(p){
      item.successCb(p);
      if(processingQueue[1+processingIndexR]){
        self._processQueue(processingQueue[++processingIndexR]);
      }else{
        processingActive=false;
      }
    },function(p){
      item.errorCb(p);
      if(processingQueue[1+processingIndexR]){
        self._processQueue(processingQueue[++processingIndexR]);
      }else{
        processingActive=false;
      }    
    }
    );
  };

  Thumbs.prototype.createThumb = function(originalPath, successCb, errorCb){
    processingQueue[++processingIndexW]={originalPath:originalPath, successCb:successCb, errorCb:errorCb};
    if(!processingActive && processingQueue[processingIndexR+1]){
        processingActive=true;
        this._processQueue(processingQueue[++processingIndexR]);
        delete processingQueue[processingIndexR];
    }
  };  

  Thumbs.prototype._createThumb = function(originalPath, successCb, errorCb){
    if (process.platform === 'android') return;

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
      , pathname : "/module/webinos-api-mediacontent/link"
      , query : { "filePath" : originalPath }
      });

    that.createThumb(originalPath,function(pathToCreated){
      successCb(link);
    },function(err){
      errorCb(err);
    });

    //return the link to the probably later created thumb
    return link;
  };

  Thumbs.prototype.getThumbLocalPath = function(originalPath){
    var link = "";
    if(this.cachePath){
      link = path.join(this.cachePath, escapePath(originalPath));
    } 
    return link;
  };

  function escapePath(path) {
      // used when concatenating paths, removes : from path
      var p = process.platform === 'win32' ? path.replace(':', '') : path;
      return p;
  }

  exports.Thumbs = Thumbs;
}());
